// ============================================================================
// WARRIKS AI — Ultra-Premium Institutional Trading Terminal
// Bloomberg-style landing page with glassmorphism, subtle animations
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
  LineChart,
  Brain,
  Gauge,
  Lock,
  ChevronRight,
  Star,
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Multi-Strategy AI Engine",
    desc: "Market Structure, Liquidity, Order Flow & Session analysis fused into a single confluence score",
    color: "#06b6d4",
  },
  {
    icon: LineChart,
    title: "Institutional Charting",
    desc: "Professional-grade canvas rendering with FVG, OB, MSS, liquidity zones & multi-timeframe",
    color: "#10b981",
  },
  {
    icon: Gauge,
    title: "Real-Time Risk Analytics",
    desc: "Live exposure tracking, dynamic position sizing, Sharpe ratio & profit factor monitoring",
    color: "#f59e0b",
  },
  {
    icon: Shield,
    title: "Enterprise-Grade Security",
    desc: "End-to-end encrypted, SOC 2 compliant infrastructure with role-based access control",
    color: "#8b5cf6",
  },
];

const stats = [
  { label: "Avg. Win Rate", value: "68.4%", color: "#10b981" },
  { label: "Profit Factor", value: "2.14", color: "#06b6d4" },
  { label: "Sharpe Ratio", value: "1.87", color: "#f59e0b" },
  { label: "Total Trades", value: "12,847", color: "#94a3b8" },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#080c14] flex flex-col relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#06b6d4] opacity-[0.015] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#10b981] opacity-[0.01] rounded-full blur-[100px] pointer-events-none" />

      {/* Top Bar */}
      <div className="h-10 bg-[#0a0e17]/90 border-b border-[#1e2d3d] flex items-center justify-between px-5 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-sm gradient-cyan flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-white tracking-[0.15em]">
              WARRIKS
            </span>
            <span className="text-[9px] text-[#06b6d4] font-medium tracking-[0.2em] bg-[#06b6d4]/10 px-1.5 py-0.5 border border-[#06b6d4]/20">
              AI
            </span>
          </div>
          <div className="h-3 w-px bg-[#1e2d3d]" />
          <div className="flex items-center gap-2 text-[10px] text-[#64748b]">
            <span className="status-dot online" />
            <span>All Systems Operational</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-[10px] text-[#64748b]">
            <BarChart3 className="w-3 h-3" />
            <span>v5.1 • Institutional</span>
          </div>
          <div className="h-3 w-px bg-[#1e2d3d]" />
          <span className="text-[10px] text-[#64748b]">Multi-Strategy Execution Machine</span>
        </div>
      </div>

      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="flex-1 flex flex-col"
      >
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="max-w-5xl mx-auto text-center">
            {/* Badge */}
            <motion.div
              initial={{ y: -8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="flex items-center justify-center gap-2 mb-8"
            >
              <div className="flex items-center gap-1.5 px-3 py-1 bg-[#06b6d4]/8 border border-[#06b6d4]/20 rounded-sm">
                <span className="status-dot online" />
                <span className="text-[10px] text-[#06b6d4] font-medium tracking-wider">LIVE • INSTITUTIONAL FEED</span>
              </div>
            </motion.div>

            {/* Headline */}
            <motion.div
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.25, duration: 0.6 }}
              className="mb-6"
            >
              <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tight leading-[1.1] mb-4">
                Institutional-Grade{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#06b6d4] via-[#10b981] to-[#06b6d4]">
                  AI Trading
                </span>
                <br />
                Execution Machine
              </h1>
              <p className="text-sm md:text-base text-[#64748b] max-w-2xl mx-auto leading-relaxed font-light">
                Multi-strategy confluence engine combining Market Structure, Liquidity Detection,
                Order Flow Analysis, and Session Timing — executing only when every signal aligns
                with institutional-grade precision.
              </p>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.5 }}
              className="flex items-center justify-center gap-3 mb-12"
            >
              <button
                onClick={() => navigate("/auth")}
                className="group h-10 px-6 gradient-cyan text-white text-xs font-semibold tracking-wider transition-all duration-300 hover:shadow-lg hover:shadow-[#06b6d4]/20 flex items-center gap-2 rounded-sm"
              >
                LAUNCH TERMINAL
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </button>
              <button className="group h-10 px-5 bg-transparent text-[#94a3b8] text-xs border border-[#1e2d3d] hover:border-[#06b6d4]/30 hover:text-[#e2e8f0] transition-all flex items-center gap-2 rounded-sm">
                <GitPullRequest className="w-3.5 h-3.5" />
                VIEW DOCUMENTATION
                <ChevronRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </button>
            </motion.div>

            {/* Stats Row */}
            <motion.div
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.45, duration: 0.5 }}
              className="flex items-center justify-center gap-6 mb-12"
            >
              {stats.map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-lg font-bold trading-mono" style={{ color: stat.color }}>
                    {stat.value}
                  </div>
                  <div className="text-[10px] text-[#64748b] tracking-wider mt-0.5">{stat.label}</div>
                </div>
              ))}
            </motion.div>

            {/* Features Grid */}
            <motion.div
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.55, duration: 0.5 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto"
            >
              {features.map((f, i) => {
                const Icon = f.icon;
                return (
                  <div
                    key={i}
                    className="glass-card rounded-sm p-4 text-left group cursor-default"
                  >
                    <div
                      className="w-8 h-8 rounded-sm flex items-center justify-center mb-3 transition-all group-hover:scale-110"
                      style={{ background: `${f.color}12`, border: `1px solid ${f.color}20` }}
                    >
                      <Icon className="w-4 h-4" style={{ color: f.color }} />
                    </div>
                    <h3 className="text-xs font-semibold text-[#e2e8f0] mb-1.5">{f.title}</h3>
                    <p className="text-[10px] text-[#64748b] leading-relaxed">{f.desc}</p>
                  </div>
                );
              })}
            </motion.div>

            {/* Bottom Tags */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.65, duration: 0.4 }}
              className="mt-8 flex flex-wrap items-center justify-center gap-2"
            >
              {[
                "≥85 Confluence Score",
                "4/4 Engine Agreement",
                "Killzone Only Execution",
                "Real-Time Risk Management",
                "Multi-Timeframe Analysis",
              ].map((tag, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 text-[9px] text-[#64748b] bg-[#111d2e] border border-[#1e2d3d] tracking-wider"
                >
                  {tag}
                </span>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Footer */}
        <footer className="h-9 bg-[#0a0e17]/80 border-t border-[#1e2d3d] flex items-center justify-between px-5 backdrop-blur-md">
          <span className="text-[9px] text-[#475569] tracking-wider">
            WARRIKS AI © 2026 • Institutional Multi-Strategy Execution Machine • v5.1
          </span>
          <div className="flex items-center gap-3">
            <span className="text-[9px] text-[#475569]">Status: Operational</span>
            <span className="status-dot online" />
          </div>
        </footer>
      </motion.div>
    </div>
  );
}
