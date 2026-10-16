import sys
from pathlib import Path

import httpx
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import app as appmod  # noqa: E402
from agents import classify  # noqa: E402
from llm_layer import Config, LLMCallLayer, UsageStore  # noqa: E402


def test_classify():
    assert classify("splice the OLT to the ODF") == "ATLAS"
    assert classify("fix this python bug") == "FORGE"
    assert classify("hello") == "FORGE"
    assert classify("fix this python bug", hint="atlas") == "ATLAS"


def test_endpoint_failover(tmp_path):
    def handler(req):
        if "anthropic" in req.url.host:
            return httpx.Response(429)
        return httpx.Response(200, json={"model": "q", "message": {"content": "hi"},
                                         "prompt_eval_count": 1, "eval_count": 1})
    cfg = Config(anthropic_api_key="k", db_path=str(tmp_path / "u.db"))
    layer = LLMCallLayer(cfg, UsageStore(cfg.db_path),
                         httpx.AsyncClient(transport=httpx.MockTransport(handler)))
    with TestClient(appmod.app) as c:
        appmod.app.state.layer = layer
        j = c.post("/v1/chat/completions", json={
            "model": "auto", "quality": "high",
            "messages": [{"role": "user", "content": "route the fibre trench"}]}).json()
    assert j["x_router"]["agent"] == "ATLAS"
    assert j["x_router"]["provider"] == "ollama"
    assert j["x_router"]["fallback_reason"] == "claude_http_429"
    assert j["choices"][0]["message"]["content"] == "hi"
