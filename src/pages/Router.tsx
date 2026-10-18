// ============================================================================
// WARRIKS AI — LLM Router console
// Chat against the FastAPI router (router/app.py): shows which agent
// (FORGE/ATLAS) and provider (Claude/Ollama) answered, the Claude token
// budget, and the request log.
// ============================================================================

import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Bot, Cpu, Gauge, RefreshCw, Send, Zap } from "lucide-react";

type Quality = "auto" | "high" | "local";
type Model = "auto" | "forge" | "atlas";

interface RouterMeta {
  agent: string;
  provider: "claude" | "ollama";
  model: string;
  fallback_reason: string | null;
  latency_ms: number;
}
interface ChatMsg {
  role: "user" | "assistant" | "error";
  content: string;
  meta?: RouterMeta;
}
interface UsageRow {
  ts: string;
  agent: string | null;
  provider: string | null;
  model: string | null;
  input_tokens: number;
  output_tokens: number;
  latency_ms: number;
  fallback_reason: string | null;
  error: string | null;
}
interface Usage {
  budget: number;
  used_today: number;
  remaining: number;
  recent: UsageRow[];
}

const DEFAULT_URL = "http://localhost:8000";
const AGENT_COLOR: Record<string, string> = { FORGE: "#06b6d4", ATLAS: "#f59e0b" };
const PROVIDER_COLOR: Record<string, string> = { claude: "#8b5cf6", ollama: "#10b981" };

function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span
      className="px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider border"
      style={{ color, borderColor: `${color}55`, background: `${color}12` }}
    >
      {children}
    </span>
  );
}

export default function RouterPage() {
  const navigate = useNavigate();
  const [baseUrl, setBaseUrl] = useState(() => localStorage.getItem("routerUrl") ?? DEFAULT_URL);
  const [model, setModel] = useState<Model>("auto");
  const [quality, setQuality] = useState<Quality>("auto");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [online, setOnline] = useState<boolean | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    try {
      const r = await fetch(`${baseUrl}/usage?limit=12`);
      if (!r.ok) throw new Error(String(r.status));
      setUsage(await r.json());
      setOnline(true);
    } catch {
      setOnline(false);
    }
  }, [baseUrl]);

  useEffect(() => {
    localStorage.setItem("routerUrl", baseUrl);
    const t = setTimeout(refresh, 0);
    return () => clearTimeout(t);
  }, [baseUrl, refresh]);

  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [messages]);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    const history = messages.filter((m) => m.role !== "error");
    const next: ChatMsg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const r = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          quality,
          messages: [...history, { role: "user", content: text }].map(({ role, content }) => ({ role, content })),
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.detail ?? `HTTP ${r.status}`);
      const x = j.x_router;
      setMessages([
        ...next,
        {
          role: "assistant",
          content: j.choices[0].message.content,
          meta: { agent: x.agent, provider: x.provider, model: j.model, fallback_reason: x.fallback_reason, latency_ms: x.latency_ms },
        },
      ]);
    } catch (e) {
      setMessages([...next, { role: "error", content: e instanceof Error ? e.message : "Request failed" }]);
    } finally {
      setBusy(false);
      refresh();
    }
  }

  const pct = usage ? Math.min(100, (usage.used_today / Math.max(1, usage.budget)) * 100) : 0;
  const select = "bg-[#0b111c] border border-[#1b2638] text-slate-200 text-xs font-mono px-2 py-1.5 outline-none focus:border-cyan-500/60";

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-200 flex flex-col">
      <header className="h-11 border-b border-[#141d2d] flex items-center px-4 gap-3">
        <button onClick={() => navigate("/")} className="text-slate-500 hover:text-slate-200" aria-label="Back">
          <ArrowLeft size={16} />
        </button>
        <Zap size={16} className="text-cyan-400" />
        <span className="font-mono text-sm tracking-[0.2em]">WARRIKS</span>
        <span className="text-slate-600">/</span>
        <span className="text-sm text-slate-400">LLM Router</span>
        <span className="ml-auto flex items-center gap-2 text-xs font-mono text-slate-500">
          <span className={`w-2 h-2 rounded-full ${online ? "bg-emerald-500" : online === false ? "bg-red-500" : "bg-slate-600"}`} />
          {online ? "router online" : online === false ? "router offline" : "connecting"}
        </span>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_360px] min-h-0">
        {/* Chat */}
        <main className="flex flex-col min-h-0 border-r border-[#141d2d]">
          <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-[#141d2d]">
            <label className="flex items-center gap-2 text-[11px] font-mono text-slate-500">
              AGENT
              <select className={select} value={model} onChange={(e) => setModel(e.target.value as Model)}>
                <option value="auto">auto-route</option>
                <option value="forge">FORGE (code)</option>
                <option value="atlas">ATLAS (fibre/GIS)</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-[11px] font-mono text-slate-500">
              QUALITY
              <select className={select} value={quality} onChange={(e) => setQuality(e.target.value as Quality)}>
                <option value="auto">auto (save quota)</option>
                <option value="high">high (force Claude)</option>
                <option value="local">local (Ollama only)</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-[11px] font-mono text-slate-500 ml-auto">
              ROUTER URL
              <input className={`${select} w-52`} value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} spellCheck={false} />
            </label>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 gap-2 py-16">
                <Bot size={28} className="text-slate-600" />
                <p className="text-sm">Ask FORGE about code or ATLAS about fibre &amp; GIS.</p>
                <p className="text-xs font-mono text-slate-600">Claude first · automatic Ollama failover</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex"}>
                <div
                  className={`max-w-[85%] px-3 py-2 text-sm whitespace-pre-wrap border ${
                    m.role === "user"
                      ? "bg-cyan-500/10 border-cyan-500/30"
                      : m.role === "error"
                        ? "bg-red-500/10 border-red-500/30 text-red-300"
                        : "bg-[#0b111c] border-[#1b2638]"
                  }`}
                >
                  {m.content}
                  {m.meta && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-2 pt-2 border-t border-[#1b2638]">
                      <Badge color={AGENT_COLOR[m.meta.agent] ?? "#94a3b8"}>{m.meta.agent}</Badge>
                      <Badge color={PROVIDER_COLOR[m.meta.provider]}>{m.meta.provider}</Badge>
                      <span className="text-[10px] font-mono text-slate-500">{m.meta.model.split("/").pop()}</span>
                      <span className="text-[10px] font-mono text-slate-600">{m.meta.latency_ms} ms</span>
                      {m.meta.fallback_reason && <Badge color="#f59e0b">fallback: {m.meta.fallback_reason}</Badge>}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {busy && <div className="text-xs font-mono text-slate-500 animate-pulse">routing…</div>}
            <div ref={endRef} />
          </div>

          <form
            className="flex gap-2 p-3 border-t border-[#141d2d]"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <input
              className="flex-1 bg-[#0b111c] border border-[#1b2638] px-3 py-2 text-sm outline-none focus:border-cyan-500/60"
              placeholder="Message the router…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button
              disabled={busy || !input.trim()}
              className="px-4 bg-cyan-500 text-[#04121a] text-xs font-semibold tracking-wider disabled:opacity-40 flex items-center gap-2"
            >
              SEND <Send size={13} />
            </button>
          </form>
        </main>

        {/* Sidebar */}
        <aside className="p-4 space-y-5 overflow-y-auto">
          <section>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-[11px] font-mono tracking-widest text-slate-500 flex items-center gap-1.5">
                <Gauge size={13} /> CLAUDE TOKEN BUDGET
              </h2>
              <button onClick={refresh} className="text-slate-500 hover:text-slate-200" aria-label="Refresh">
                <RefreshCw size={13} />
              </button>
            </div>
            <div className="h-2 bg-[#0b111c] border border-[#1b2638]">
              <div className="h-full" style={{ width: `${pct}%`, background: pct > 85 ? "#ef4444" : pct > 60 ? "#f59e0b" : "#8b5cf6" }} />
            </div>
            <div className="flex justify-between mt-1.5 text-[11px] font-mono text-slate-500">
              <span>{usage ? usage.used_today.toLocaleString() : "—"} used</span>
              <span>{usage ? usage.remaining.toLocaleString() : "—"} left today</span>
            </div>
          </section>

          <section>
            <h2 className="text-[11px] font-mono tracking-widest text-slate-500 flex items-center gap-1.5 mb-2">
              <Cpu size={13} /> RECENT REQUESTS
            </h2>
            {!usage || usage.recent.length === 0 ? (
              <p className="text-xs text-slate-600 font-mono">{online === false ? "Start the router: uvicorn app:app --port 8000" : "No requests yet."}</p>
            ) : (
              <ul className="space-y-1.5">
                {usage.recent.map((r, i) => (
                  <li key={i} className="border border-[#141d2d] bg-[#0a0f19] px-2 py-1.5">
                    <div className="flex items-center gap-1.5">
                      {r.agent && <Badge color={AGENT_COLOR[r.agent] ?? "#94a3b8"}>{r.agent}</Badge>}
                      {r.provider ? <Badge color={PROVIDER_COLOR[r.provider] ?? "#94a3b8"}>{r.provider}</Badge> : <Badge color="#ef4444">failed</Badge>}
                      <span className="ml-auto text-[10px] font-mono text-slate-600">{new Date(r.ts).toLocaleTimeString()}</span>
                    </div>
                    <div className="mt-1 text-[10px] font-mono text-slate-500">
                      {r.input_tokens}→{r.output_tokens} tok · {r.latency_ms} ms{r.fallback_reason ? ` · ${r.fallback_reason}` : ""}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
