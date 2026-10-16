import sys
from pathlib import Path

import httpx
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from llm_layer import Config, LLMCallLayer, LLMError, UsageStore  # noqa: E402

LONG = [{"role": "user", "content": "x" * 1000}]  # not a "simple" prompt


def make_layer(tmp_path, claude, ollama=None, **cfg):
    calls = {"claude": 0, "ollama": 0}

    def handler(req: httpx.Request) -> httpx.Response:
        if "anthropic" in req.url.host:
            calls["claude"] += 1
            return claude(req)
        calls["ollama"] += 1
        return (ollama or ok_ollama)(req)

    config = Config(anthropic_api_key="k", db_path=str(tmp_path / "u.db"), **cfg)
    client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    return LLMCallLayer(config, UsageStore(config.db_path), client), calls


def ok_claude(_req):
    return httpx.Response(200, json={
        "model": "claude-sonnet-5-5", "content": [{"type": "text", "text": "from claude"}],
        "usage": {"input_tokens": 100, "output_tokens": 50}})


def ok_ollama(_req):
    return httpx.Response(200, json={
        "model": "qwen", "message": {"content": "from ollama"},
        "prompt_eval_count": 10, "eval_count": 5})


@pytest.mark.asyncio
async def test_claude_happy_path_and_logging(tmp_path):
    layer, calls = make_layer(tmp_path, ok_claude)
    r = await layer.complete(LONG, agent="FORGE")
    assert (r.provider, r.text, r.fallback_reason) == ("claude", "from claude", None)
    assert calls == {"claude": 1, "ollama": 0}
    assert layer.store.claude_tokens_today() == 150


@pytest.mark.asyncio
async def test_429_fails_over_then_cools_down(tmp_path):
    layer, calls = make_layer(tmp_path, lambda _r: httpx.Response(429, headers={"retry-after": "5"}))
    r1 = await layer.complete(LONG)
    r2 = await layer.complete(LONG)
    assert r1.provider == r2.provider == "ollama"
    assert r1.fallback_reason == "claude_http_429"
    assert r2.fallback_reason == "cooldown"
    assert calls["claude"] == 1  # second request never touched Claude


@pytest.mark.asyncio
async def test_network_error_fails_over(tmp_path):
    def boom(_r):
        raise httpx.ConnectError("down")
    layer, _ = make_layer(tmp_path, boom)
    r = await layer.complete(LONG)
    assert r.provider == "ollama" and r.fallback_reason.startswith("claude_unreachable")


@pytest.mark.asyncio
async def test_budget_exhausted_skips_claude(tmp_path):
    layer, calls = make_layer(tmp_path, ok_claude, daily_claude_token_budget=100)
    r = await layer.complete(LONG)
    assert r.provider == "ollama" and r.fallback_reason == "budget_exhausted"
    assert calls["claude"] == 0


@pytest.mark.asyncio
async def test_simple_task_stays_local_unless_high(tmp_path):
    layer, calls = make_layer(tmp_path, ok_claude)
    short = [{"role": "user", "content": "hi"}]
    assert (await layer.complete(short)).fallback_reason == "simple_task"
    assert (await layer.complete(short, quality="high")).provider == "claude"
    assert (await layer.complete(LONG, quality="local")).fallback_reason == "forced_local"


@pytest.mark.asyncio
async def test_bad_request_is_not_masked(tmp_path):
    layer, _ = make_layer(tmp_path, lambda _r: httpx.Response(400, json={"error": "bad"}))
    with pytest.raises(httpx.HTTPStatusError):
        await layer.complete(LONG)


@pytest.mark.asyncio
async def test_both_down_raises_and_logs(tmp_path):
    layer, _ = make_layer(tmp_path, lambda _r: httpx.Response(529),
                          lambda _r: httpx.Response(500))
    with pytest.raises(LLMError):
        await layer.complete(LONG)
