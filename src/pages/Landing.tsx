// ============================================================================
// WARRIKS AI — Institutional Trading Landing Page
// Neobrutalism Minimalism dark theme with strong typography and CTAs
// ============================================================================

import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import {
  Zap,
  ArrowRight,
  BarChart3,
  Shield,
  GitPullRequest,
  TrendingUp,
  Activity,
  Timer,
  Sparkles,
} from "lucide-react";
import logo from "@/assets/logo.svg";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0a0c10] flex flex-col">
      {/* Top bar */}
      <div className="h-9 bg-[#0c0e12] border-b border-border neo-border flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#22c55e]" />
          <span className="text-xs font-bold text-white tracking-widest">WARRIKS AI</span>
          <span className="text-[9px] text-muted-foreground ml-2">v5.1</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[9px] text-muted-foreground">Institutional Multi-Strategy Engine</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-blink" />
        </div>
      </div>

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="flex-1 flex flex-col"
      >
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <div className="max-w-4xl mx-auto text-center">
            {/* Logo & badge */}
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center justify-center gap-3 mb-6"
            >
              <img src={logo} alt="WARRIKS" className="w-10 h-10" />
              <span className="text-[10px] px-2 py-1 bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/30">
                ● LIVE
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4"
            >
              Multi-Strategy{" "}
              <span className="text-[#22c55e]">Execution</span>
              <br />
              Machine
            </motion.h1>

            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-sm text-muted-foreground max-w-lg mx-auto mb-8 leading-relaxed"
            >
              Institutional-grade confluence engine combining Market Structure,
              Liquidity, Order Flow, and Session analysis — only executing
              when all conditions align.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center justify-center gap-3"
            >
              <button
                onClick={() => navigate("/auth")}
                className="h-9 px-5 bg-[#22c55e] text-black text-xs font-bold hover:bg-[#22c55e]/90 transition-all flex items-center gap-2 neo-border"
              >
                Launch Terminal
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button className="h-9 px-5 bg-transparent text-[#8a92a4] text-xs border border-border hover:bg-[#15181e] transition-all flex items-center gap-2">
                <GitPullRequest className="w-3.5 h-3.5" />
                View Documentation
              </button>
            </motion.div>

            {/* Features Grid */}
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-2 max-w-3xl mx-auto"
            >
              {[
                {
                  icon: BarChart3,
                  label: "Market Structure",
                  desc: "D1/4H/1H trend analysis",
                  color: "#22c55e",
                },
                {
                  icon: Activity,
                  label: "Liquidity Sweeps",
                  desc: "Stop hunt & pool detection",
                  color: "#3b82f6",
                },
                {
                  icon: TrendingUp,
                  label: "Order Flow",
                  desc: "FVG/OB/Breaker entry models",
                  color: "#eab308",
                },
                {
                  icon: Timer,
                  label: "Killzone Timing",
                  desc: "London/NY session only",
                  color: "#ef4444",
                },
              ].map((f, i) => (
                <div
                  key={i}
                  className="bg-[#0c0e12] border border-border p-3 text-left"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <f.icon className="w-3.5 h-3.5" style={{ color: f.color }} />
                    <span className="text-xs font-bold text-white">{f.label}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{f.desc}</p>
                </div>
              ))}
            </motion.div>

            {/* Rules */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-8 flex flex-wrap items-center justify-center gap-1.5 text-[9px] text-muted-foreground"
            >
              <span className="px-2 py-0.5 bg-[#111318] border border-border">≥75 Confluence</span>
              <span className="px-2 py-0.5 bg-[#111318] border border-border">3/4 Engines</span>
              <span className="px-2 py-0.5 bg-[#111318] border border-border">Killzone Only</span>
              <span className="px-2 py-0.5 bg-[#111318] border border-border">No Single-Strategy</span>
            </motion.div>
          </div>
        </div>

        {/* Footer */}
        <footer className="h-8 bg-[#0c0e12] border-t border-border flex items-center justify-center px-4">
          <span className="text-[9px] text-muted-foreground">
            WARRIKS AI © 2026 • Institutional Multi-Strategy Decision Engine • v5.1
          </span>
        </footer>
      </motion.div>
    </div>
  );
}
