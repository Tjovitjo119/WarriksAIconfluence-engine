"""LLM call layer: Claude first, automatic failover to Ollama, with a token budget.

Every call is logged to SQLite (the `requests` table), and that same table is the
source of truth for the Claude token budget, so the budget survives restarts and
the logging piece of the spec comes for free.

    layer = LLMCallLayer.from_env()
    resp = await layer.complete(
        [{"role": "user", "content": "Explain this stack trace ..."}],
        system="You are FORGE, a coding agent.",
        agent="FORGE",
    )
    resp.text, resp.provider, resp.model, resp.fallback_reason
"""

from __future__ import annotations

import os
import sqlite3
import threading
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Literal

import httpx

Message = dict[str, str]  # {"role": "user"|"assistant", "content": "..."}
Quality = Literal["auto", "high", "local"]

# Statuses where Claude is temporarily/permanently unusable for us, so Ollama
# should answer instead. 400/404/422 are caller bugs and are raised, not masked.
_FAILOVER_STATUSES = {401, 403, 408, 429, 500, 502, 503, 504, 529}


class LLMError(RuntimeError):
    """Raised when no provider could answer."""


@dataclass
class LLMResponse:
    text: str
    provider: Literal["claude", "ollama"]
    model: str
    input_tokens: int
    output_tokens: int
    latency_ms: int
    fallback_reason: str | None = None  # why Claude was skipped/failed, if it was


@dataclass
class Config:
    anthropic_api_key: str = ""
    anthropic_url: str = "https://api.anthropic.com/v1/messages"
    claude_model: str = "claude-sonnet-5-5"
    ollama_url: str = "http://localhost:11434"
    ollama_model: str = "qwen2.5-coder:7b"
    daily_claude_token_budget: int = 200_000  # input + output, UTC day
    claude_timeout_s: float = 60.0
    ollama_timeout_s: float = 300.0  # local models are slow on first load
    cooldown_s: float = 60.0  # skip Claude this long after a 429/5xx
    simple_prompt_chars: int = 400  # "auto" sends shorter prompts to Ollama
    db_path: str = "router_usage.db"

    @classmethod
    def from_env(cls) -> "Config":
        d = cls()
        return cls(
            anthropic_api_key=os.getenv("ANTHROPIC_API_KEY", d.anthropic_api_key),
            anthropic_url=os.getenv("ANTHROPIC_URL", d.anthropic_url),
            claude_model=os.getenv("CLAUDE_MODEL", d.claude_model),
            ollama_url=os.getenv("OLLAMA_URL", d.ollama_url).rstrip("/"),
            ollama_model=os.getenv("OLLAMA_MODEL", d.ollama_model),
            daily_claude_token_budget=int(
                os.getenv("DAILY_CLAUDE_TOKEN_BUDGET", d.daily_claude_token_budget)
            ),
            db_path=os.getenv("ROUTER_DB_PATH", d.db_path),
        )


class UsageStore:
    """SQLite request log; also answers 'how many Claude tokens used today?'."""

    def __init__(self, path: str):
        self._db = sqlite3.connect(path, check_same_thread=False)
        self._lock = threading.Lock()
        with self._lock:
            self._db.execute(
                """CREATE TABLE IF NOT EXISTS requests (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    ts TEXT NOT NULL,
                    agent TEXT,
                    provider TEXT,
                    model TEXT,
                    input_tokens INTEGER NOT NULL DEFAULT 0,
                    output_tokens INTEGER NOT NULL DEFAULT 0,
                    latency_ms INTEGER NOT NULL DEFAULT 0,
                    fallback_reason TEXT,
                    error TEXT
                )"""
            )
            self._db.commit()

    def log(self, *, agent: str | None, provider: str | None, model: str | None,
            input_tokens: int = 0, output_tokens: int = 0, latency_ms: int = 0,
            fallback_reason: str | None = None, error: str | None = None) -> None:
        ts = datetime.now(timezone.utc).isoformat()
        with self._lock:
            self._db.execute(
                "INSERT INTO requests (ts, agent, provider, model, input_tokens,"
                " output_tokens, latency_ms, fallback_reason, error)"
                " VALUES (?,?,?,?,?,?,?,?,?)",
                (ts, agent, provider, model, input_tokens, output_tokens,
                 latency_ms, fallback_reason, error),
            )
            self._db.commit()

    def recent(self, limit: int = 25) -> list[dict]:
        with self._lock:
            cur = self._db.execute(
                "SELECT ts, agent, provider, model, input_tokens, output_tokens,"
                " latency_ms, fallback_reason, error FROM requests"
                " ORDER BY id DESC LIMIT ?", (limit,))
            cols = [c[0] for c in cur.description]
            return [dict(zip(cols, row)) for row in cur.fetchall()]

    def claude_tokens_today(self) -> int:
        day = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        with self._lock:
            row = self._db.execute(
                "SELECT COALESCE(SUM(input_tokens + output_tokens), 0) FROM requests"
                " WHERE provider = 'claude' AND ts >= ?",
                (day,),
            ).fetchone()
        return int(row[0])


def estimate_tokens(system: str, messages: list[Message], max_tokens: int) -> int:
    """Rough pre-flight estimate (~4 chars/token) used only for the budget check."""
    chars = len(system) + sum(len(m["content"]) for m in messages)
    return chars // 4 + max_tokens


class LLMCallLayer:
    def __init__(self, config: Config, store: UsageStore | None = None,
                 client: httpx.AsyncClient | None = None):
        self.cfg = config
        self.store = store or UsageStore(config.db_path)
        self._client = client or httpx.AsyncClient()
        self._claude_blocked_until = 0.0  # monotonic; simple circuit breaker

    @classmethod
    def from_env(cls) -> "LLMCallLayer":
        return cls(Config.from_env())

    async def aclose(self) -> None:
        await self._client.aclose()

    # ------------------------------------------------------------------ public

    async def complete(self, messages: list[Message], *, system: str = "",
                       agent: str | None = None, quality: Quality = "auto",
                       max_tokens: int = 1024) -> LLMResponse:
        """Answer with Claude when allowed, otherwise (or on failure) Ollama.

        quality="high"  -> try Claude regardless of how simple the prompt looks
        quality="local" -> Ollama only, never spend Claude quota
        quality="auto"  -> short prompts go to Ollama to save quota
        """
        skip = self._skip_claude_reason(system, messages, quality, max_tokens)
        if skip is None:
            try:
                resp = await self._call_claude(messages, system, max_tokens)
                self._log(agent, resp)
                return resp
            except _Failover as e:
                skip = e.reason

        try:
            resp = await self._call_ollama(messages, system, max_tokens)
        except Exception as e:
            self.store.log(agent=agent, provider=None, model=None,
                           fallback_reason=skip, error=f"ollama: {e!r}")
            raise LLMError(f"All providers failed (claude skipped/failed: {skip}); "
                           f"ollama: {e!r}") from e
        resp.fallback_reason = skip
        self._log(agent, resp)
        return resp

    def budget_remaining(self) -> int:
        return max(0, self.cfg.daily_claude_token_budget - self.store.claude_tokens_today())

    # --------------------------------------------------------------- internals

    def _skip_claude_reason(self, system: str, messages: list[Message],
                            quality: Quality, max_tokens: int) -> str | None:
        if quality == "local":
            return "forced_local"
        if not self.cfg.anthropic_api_key:
            return "no_api_key"
        if time.monotonic() < self._claude_blocked_until:
            return "cooldown"
        if estimate_tokens(system, messages, max_tokens) > self.budget_remaining():
            return "budget_exhausted"
        if quality == "auto":
            prompt_chars = len(system) + sum(len(m["content"]) for m in messages)
            if prompt_chars <= self.cfg.simple_prompt_chars and "```" not in messages[-1]["content"]:
                return "simple_task"
        return None

    def _log(self, agent: str | None, r: LLMResponse) -> None:
        self.store.log(agent=agent, provider=r.provider, model=r.model,
                       input_tokens=r.input_tokens, output_tokens=r.output_tokens,
                       latency_ms=r.latency_ms, fallback_reason=r.fallback_reason)

    async def _call_claude(self, messages: list[Message], system: str,
                           max_tokens: int) -> LLMResponse:
        body: dict = {"model": self.cfg.claude_model, "max_tokens": max_tokens,
                      "messages": messages}
        if system:
            body["system"] = system
        headers = {"x-api-key": self.cfg.anthropic_api_key,
                   "anthropic-version": "2023-06-01"}
        start = time.monotonic()
        try:
            r = await self._client.post(self.cfg.anthropic_url, json=body, headers=headers,
                                        timeout=self.cfg.claude_timeout_s)
        except (httpx.TimeoutException, httpx.TransportError) as e:
            self._claude_blocked_until = time.monotonic() + self.cfg.cooldown_s
            raise _Failover(f"claude_unreachable:{type(e).__name__}") from e

        if r.status_code in _FAILOVER_STATUSES:
            cooldown = self.cfg.cooldown_s
            if r.status_code == 429:
                try:
                    cooldown = max(cooldown, float(r.headers.get("retry-after", 0)))
                except ValueError:
                    pass
            self._claude_blocked_until = time.monotonic() + cooldown
            raise _Failover(f"claude_http_{r.status_code}")
        r.raise_for_status()  # 400 etc: a bug in our request, don't hide it

        data = r.json()
        text = "".join(b.get("text", "") for b in data.get("content", [])
                       if b.get("type") == "text")
        usage = data.get("usage", {})
        return LLMResponse(
            text=text, provider="claude", model=data.get("model", self.cfg.claude_model),
            input_tokens=usage.get("input_tokens", 0),
            output_tokens=usage.get("output_tokens", 0),
            latency_ms=int((time.monotonic() - start) * 1000),
        )

    async def _call_ollama(self, messages: list[Message], system: str,
                           max_tokens: int) -> LLMResponse:
        msgs = ([{"role": "system", "content": system}] if system else []) + messages
        body = {"model": self.cfg.ollama_model, "messages": msgs, "stream": False,
                "options": {"num_predict": max_tokens}}
        start = time.monotonic()
        r = await self._client.post(f"{self.cfg.ollama_url}/api/chat", json=body,
                                    timeout=self.cfg.ollama_timeout_s)
        r.raise_for_status()
        data = r.json()
        return LLMResponse(
            text=data["message"]["content"], provider="ollama",
            model=data.get("model", self.cfg.ollama_model),
            input_tokens=data.get("prompt_eval_count", 0),
            output_tokens=data.get("eval_count", 0),
            latency_ms=int((time.monotonic() - start) * 1000),
        )


class _Failover(Exception):
    def __init__(self, reason: str):
        super().__init__(reason)
        self.reason = reason
