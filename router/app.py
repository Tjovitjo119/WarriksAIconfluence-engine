"""FastAPI router. Point AnythingLLM at http://<host>:8000/v1 as a generic OpenAI provider.

Set the model name to `forge`, `atlas` or `auto` (classify by content).
Run:  uvicorn app:app --port 8000
"""

from __future__ import annotations

import time
import uuid
from contextlib import asynccontextmanager

import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from agents import AGENTS, classify
from llm_layer import LLMCallLayer, LLMError, Quality


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    model: str = "auto"
    messages: list[ChatMessage]
    max_tokens: int = 1024
    quality: Quality = "auto"  # extension: "high" forces Claude, "local" forces Ollama


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.layer = LLMCallLayer.from_env()
    yield
    await app.state.layer.aclose()


app = FastAPI(title="WarriksAI router", lifespan=lifespan)
# The /router UI runs in the browser on another origin; allow it (override via ROUTER_CORS_ORIGINS).
app.add_middleware(CORSMiddleware, allow_methods=["*"], allow_headers=["*"],
                   allow_origins=os.getenv("ROUTER_CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(","))


@app.get("/health")
async def health():
    return {"ok": True, "claude_budget_remaining": app.state.layer.budget_remaining()}


@app.get("/usage")
async def usage(limit: int = 25):
    layer = app.state.layer
    return {"budget": layer.cfg.daily_claude_token_budget,
            "used_today": layer.store.claude_tokens_today(),
            "remaining": layer.budget_remaining(),
            "recent": layer.store.recent(min(limit, 200))}


@app.get("/v1/models")
async def models():
    return {"object": "list", "data": [{"id": m, "object": "model"} for m in ("auto", "forge", "atlas")]}


@app.post("/v1/chat/completions")
async def chat(req: ChatRequest):
    system_parts = [m.content for m in req.messages if m.role == "system"]
    turns = [{"role": m.role, "content": m.content} for m in req.messages if m.role != "system"]
    if not turns:
        raise HTTPException(400, "no user/assistant messages")

    hint = req.model if req.model.lower() != "auto" else None
    agent = classify(turns[-1]["content"], hint)
    # AGENTS prompt first; any AnythingLLM workspace prompt/doc context is appended.
    system = "\n\n".join([AGENTS[agent]["system"], *system_parts])

    try:
        r = await app.state.layer.complete(turns, system=system, agent=agent,
                                           quality=req.quality, max_tokens=req.max_tokens)
    except LLMError as e:
        raise HTTPException(502, str(e))

    return {
        "id": f"chatcmpl-{uuid.uuid4().hex[:12]}",
        "object": "chat.completion",
        "created": int(time.time()),
        "model": f"{agent.lower()}/{r.provider}:{r.model}",
        "choices": [{"index": 0, "finish_reason": "stop",
                     "message": {"role": "assistant", "content": r.text}}],
        "usage": {"prompt_tokens": r.input_tokens, "completion_tokens": r.output_tokens,
                  "total_tokens": r.input_tokens + r.output_tokens},
        "x_router": {"agent": agent, "provider": r.provider,
                     "fallback_reason": r.fallback_reason, "latency_ms": r.latency_ms},
    }
