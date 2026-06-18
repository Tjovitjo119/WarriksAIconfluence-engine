// ============================================================================
// WARRIKS AI — Live AI Signals Feed (Right Panel)
// Displays active trading signals with engine agreement, killzone, and status
// ============================================================================

import { motion } from "framer-motion";
import type { Signal as SignalType } from "@/engine/types";
import { ArrowUp, ArrowDown, Sparkles } from "lucide-react";
import SignalPulse from "./SignalPulse";

interface SignalFeedProps {
  signals: SignalType[];
}

function KillzoneTag({ killzone }: { killzone: string }) {
  const isLondon = killzone === "LONDON";
  return (
    <span className={`text-[10px] px-1.5 py-0.5 font-medium rounded-none ${
      isLondon ? "killzone-london" : "killzone-newyork"
    }`}>
      {killzone === "LONDON" ? "🇬🇧 LDN" : "🗽 NY"}
    </span>
  );
}

function EngineBadge({ agreed }: { agreed: number }) {
  const colorClass = agreed >= 4 ? "text-[#10b981]" : agreed >= 3 ? "text-[#f59e0b]" : "text-[#64748b]";
  return (
    <span className={`text-[10px] font-bold ${colorClass}`}>
      {agreed}/4
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    Active: { color: "green" as const },
    Waiting: { color: "gold" as const },
    Invalid: { color: "red" as const },
  };
  const c = config[status as keyof typeof config] || config.Waiting;

  return (
    <span className="flex items-center gap-1.5">
      <SignalPulse.LiveDot color={c.color} />
      <span className="text-[10px] text-muted-foreground">{status}</span>
    </span>
  );
}

export default function SignalFeed({ signals }: SignalFeedProps) {
  return (
    <div className="h-full flex flex-col bg-[#0c0e12] neo-border">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-border bg-[#111318] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SignalPulse color="cyan" size="sm" />
          <span className="text-xs font-bold text-[#b0b8c8] tracking-wider uppercase">SIGNALS</span>
        </div>
        <div className="flex items-center gap-2">
          <SignalPulse.LiveDot color={signals.length > 0 ? "green" : "neutral"} />
          <span className="text-[10px] text-muted-foreground">
            {signals.length} active
          </span>
        </div>
      </div>

      {/* Signals List */}
      <div className="flex-1 overflow-y-auto">          {signals.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
            <div className="flex flex-col items-center gap-2">
              <SignalPulse color="neutral" size="lg" active={false} />
              <span>No active signals</span>
            </div>
          </div>
        ) : (
          signals.map((signal, idx) => {
            const isBuy = signal.direction === "BUY";
            const isActive = signal.status === "Active";
            const entryPrice = signal.entryZone.midpoint;
            const pulseColor = isBuy ? "green" : "red";

            return (
              <motion.div
                key={signal.id}
                initial={{ opacity: 0, x: 5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.08 }}
                className={`signal-card-glow ${!isBuy ? "bearish" : ""} px-3 py-2.5 border-b border-border/50 hover:bg-[#15181e] transition-colors ${
                  isActive && isBuy ? "border-l-2 border-l-[#10b981]" :
                  isActive && !isBuy ? "border-l-2 border-l-[#ef4444]" : ""
                } ${isBuy ? "glow-green" : "glow-red"}`}
              >
                {/* Top row */}
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <SignalPulse color={pulseColor} size="md" active={isActive} />
                    <span className="text-xs font-bold text-white">{signal.symbol}</span>
                    {isBuy ? (
                      <motion.span
                        className="text-xs font-bold text-[#10b981] flex items-center gap-0.5"
                        animate={isActive ? { scale: [1, 1.05, 1] } : {}}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <ArrowUp className="w-3 h-3" /> BUY
                      </motion.span>
                    ) : (
                      <motion.span
                        className="text-xs font-bold text-[#ef4444] flex items-center gap-0.5"
                        animate={isActive ? { scale: [1, 1.05, 1] } : {}}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <ArrowDown className="w-3 h-3" /> SELL
                      </motion.span>
                    )}
                  </div>
                  <KillzoneTag killzone={signal.killzone} />
                </div>

                {/* Entry zone with shimmer */}
                <div className={`flex items-center justify-between mb-1.5 ${isActive ? (isBuy ? "zone-shimmer" : "zone-shimmer bearish") : ""}`}>
                  <span className="text-[10px] text-muted-foreground">
                    Zone: {entryPrice.toFixed(signal.symbol === "NAS100" ? 1 : 2)}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    ⏹ {signal.stopLoss.toFixed(signal.symbol === "NAS100" ? 1 : 2)}
                  </span>
                </div>

                {/* TP Levels */}
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex gap-2">
                    {[signal.takeProfit.tp1, signal.takeProfit.tp2, signal.takeProfit.tp3].map((tp, i) => (
                      <motion.span
                        key={i}
                        className="text-[9px] text-[#10b981]/70"
                        animate={isActive ? { opacity: [0.5, 1, 0.5] } : {}}
                        transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
                      >
                        TP{i + 1}: {tp.toFixed(signal.symbol === "NAS100" ? 1 : 2)}
                      </motion.span>
                    ))}
                  </div>
                </div>

                {/* Bottom meta */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <EngineBadge agreed={signal.enginesAgreed} />
                    <span className="text-[10px] font-mono text-muted-foreground">
                      R:R {signal.riskReward.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <StatusBadge status={signal.status} />
                    <SignalPulse.Badge value={signal.confidence} />
                  </div>
                </div>

                {/* Entry model tag */}
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className="text-[9px] px-1 py-0.5 bg-[#1a1d26] text-[#4a5060] border border-border">
                    {signal.entryModel}
                  </span>
                  {isActive && signal.confidence >= 85 && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-[8px] text-[#10b981] flex items-center gap-0.5"
                    >
                      <Sparkles className="w-2.5 h-2.5" />
                      HIGH CONVICTION
                    </motion.span>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
