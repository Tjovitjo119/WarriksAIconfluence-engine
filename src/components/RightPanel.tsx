// ============================================================================
// WARRIKS AI — Premium Right Side Panel
// AI Signal Card • Probability Panel • Higher TF Bias • News • Calendar
// ============================================================================

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Zap,
  TrendingUp,
  TrendingDown,
  Target,
  Shield,
  Newspaper,
  Calendar,
  Clock,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  BarChart3,
  Brain,
} from "lucide-react";
import type { Signal, Direction } from "@/engine/types";

interface RightPanelProps {
  signals: Signal[];
}

// Mock news data
const newsItems = [
  { title: "FOMC Minutes: Dovish Tone on Rate Cuts", impact: "HIGH", time: "14:30", currency: "USD", type: "FOMC" },
  { title: "UK CPI Rises to 3.2%, Above Expectations", impact: "HIGH", time: "08:15", currency: "GBP", type: "CPI" },
  { title: "NFP Report: 228K Jobs Added vs 200K Expected", impact: "HIGH", time: "Yesterday", currency: "USD", type: "NFP" },
  { title: "ECB's Lagarde: Data-Dependent Approach", impact: "MEDIUM", time: "Yesterday", currency: "EUR", type: "SPEECH" },
  { title: "China GDP Growth Slows to 4.6%", impact: "MEDIUM", time: "Yesterday", currency: "CNY", type: "GDP" },
  { title: "Oil Prices Surge on Middle East Tensions", impact: "HIGH", time: "2 days ago", currency: "ALL", type: "GEOPOLITICAL" },
];

// Mock economic calendar
const calendarEvents = [
  { event: "FOMC Rate Decision", date: "2026-06-18", impact: "HIGH", forecast: "5.00%", previous: "5.25%" },
  { event: "US CPI (MoM)", date: "2026-06-12", impact: "HIGH", forecast: "0.2%", previous: "0.3%" },
  { event: "UK Unemployment Rate", date: "2026-06-11", impact: "MEDIUM", forecast: "4.3%", previous: "4.3%" },
  { event: "ECB Interest Rate", date: "2026-06-06", impact: "HIGH", forecast: "3.75%", previous: "4.00%" },
  { event: "US NFP", date: "2026-06-05", impact: "HIGH", forecast: "210K", previous: "228K" },
];

function ImpactBadge({ impact }: { impact: string }) {
  const colors: Record<string, string> = {
    HIGH: "text-[#ef4444] bg-[#ef4444]/10 border-[#ef4444]/20",
    MEDIUM: "text-[#f59e0b] bg-[#f59e0b]/10 border-[#f59e0b]/20",
    LOW: "text-[#64748b] bg-[#64748b]/10 border-[#64748b]/20",
  };
  return (
    <span className={`text-[8px] px-1 py-0.5 border font-semibold tracking-wider ${colors[impact] || colors.MEDIUM}`}>
      {impact}
    </span>
  );
}

function ProbabilityBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between">
        <span className="text-[9px] text-[#64748b]">{label}</span>
        <span className="text-[9px] font-bold trading-mono" style={{ color }}>{value}%</span>
      </div>
      <div className="h-1.5 bg-[#111d2e] overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full"
          style={{
            background: `linear-gradient(90deg, ${color}88, ${color})`,
          }}
        />
      </div>
    </div>
  );
}

export default function RightPanel({ signals }: RightPanelProps) {
  const mainSignal = signals[0];
  const hasSignal = !!mainSignal && mainSignal.status === "Active";
  const isBuy = mainSignal?.direction === "BUY";

  return (
    <div className="h-full flex flex-col bg-[#0a0e17] overflow-y-auto">
      {/* AI Signal Card */}
      <div className="glass-card m-2 rounded-sm">
        <div className="px-3 py-2 border-b border-[#1e2d3d] flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Brain className="w-3 h-3 text-[#06b6d4]" />
            <span className="text-[10px] font-semibold text-[#e2e8f0] uppercase tracking-wider">AI Signal</span>
          </div>
          <span className="text-[8px] text-[#475569]">
            {new Date().toLocaleTimeString()}
          </span>
        </div>

        {hasSignal ? (
          <div className="p-3">
            {/* Symbol + Direction */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[#e2e8f0]">{mainSignal.symbol}</span>
                <div className={`flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold ${
                  isBuy ? "text-[#10b981] bg-[#10b981]/10" : "text-[#ef4444] bg-[#ef4444]/10"
                }`}>
                  {isBuy ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                  {mainSignal.direction}
                </div>
              </div>
              <div className={`text-lg font-bold trading-mono ${
                mainSignal.confidence >= 85 ? "text-[#10b981]" : mainSignal.confidence >= 75 ? "text-[#f59e0b]" : "text-[#64748b]"
              }`}>
                {mainSignal.confidence}%
              </div>
            </div>

            {/* Confluence bar */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] text-[#64748b]">Strategy Confluence</span>
                <span className="text-[9px] font-bold text-[#06b6d4]">{mainSignal.enginesAgreed}/4</span>
              </div>
              <div className="h-1.5 bg-[#111d2e] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${mainSignal.confidence}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full"
                  style={{
                    background: mainSignal.confidence >= 85
                      ? "linear-gradient(90deg, #10b981, #059669)"
                      : mainSignal.confidence >= 75
                      ? "linear-gradient(90deg, #f59e0b, #d97706)"
                      : "linear-gradient(90deg, #64748b, #475569)",
                  }}
                />
              </div>
            </div>

            {/* Entry / SL / TP */}
            <div className="space-y-1 text-[10px] mb-3">
              <div className="flex items-center justify-between">
                <span className="text-[#64748b]">Entry Zone</span>
                <span className="font-mono text-[#e2e8f0]">
                  {mainSignal.entryZone.low.toFixed(1)} – {mainSignal.entryZone.high.toFixed(1)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#64748b]">Stop Loss</span>
                <span className="font-mono text-[#ef4444]">{mainSignal.stopLoss.toFixed(1)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#64748b]">TP1</span>
                <span className="font-mono text-[#10b981]">{mainSignal.takeProfit.tp1.toFixed(1)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#64748b]">TP2</span>
                <span className="font-mono text-[#10b981]">{mainSignal.takeProfit.tp2.toFixed(1)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#64748b]">TP3</span>
                <span className="font-mono text-[#10b981]">{mainSignal.takeProfit.tp3.toFixed(1)}</span>
              </div>
            </div>

            {/* Risk:Reward */}
            <div className="flex items-center justify-between py-1.5 border-t border-[#1e2d3d]">
              <span className="text-[9px] text-[#64748b]">Risk:Reward</span>
              <span className={`text-[11px] font-bold trading-mono ${
                mainSignal.riskReward >= 2 ? "text-[#10b981]" : "text-[#f59e0b]"
              }`}>
                1:{mainSignal.riskReward.toFixed(1)}
              </span>
            </div>

            {/* Entry model */}
            <div className="mt-2 flex items-center gap-1">
              <span className="px-1 py-0.5 text-[8px] font-mono text-[#06b6d4] bg-[#06b6d4]/8 border border-[#06b6d4]/20">
                {mainSignal.entryModel}
              </span>
              <span className="px-1 py-0.5 text-[8px] font-mono text-[#64748b] bg-[#111d2e] border border-[#1e2d3d]">
                {mainSignal.killzone}
              </span>
            </div>
          </div>
        ) : (
          <div className="p-6 flex flex-col items-center justify-center text-center">
            <Brain className="w-6 h-6 text-[#64748b] mb-2 opacity-50" />
            <span className="text-[10px] text-[#64748b]">No active signals</span>
            <span className="text-[8px] text-[#475569] mt-1">Waiting for confluence ≥ 75</span>
          </div>
        )}
      </div>

      {/* Probability Panel */}
      <div className="glass-card mx-2 mb-2 rounded-sm">
        <div className="px-3 py-2 border-b border-[#1e2d3d] flex items-center gap-1.5">
          <BarChart3 className="w-3 h-3 text-[#f59e0b]" />
          <span className="text-[10px] font-semibold text-[#e2e8f0] uppercase tracking-wider">Probability</span>
        </div>
        <div className="p-3 space-y-2">
          <ProbabilityBar label="Bullish Scenario" value={72} color="#10b981" />
          <ProbabilityBar label="Bearish Scenario" value={18} color="#ef4444" />
          <ProbabilityBar label="Range Scenario" value={10} color="#64748b" />
        </div>
      </div>

      {/* Higher Timeframe Bias Panel */}
      <div className="glass-card mx-2 mb-2 rounded-sm">
        <div className="px-3 py-2 border-b border-[#1e2d3d] flex items-center gap-1.5">
          <TrendingUp className="w-3 h-3 text-[#06b6d4]" />
          <span className="text-[10px] font-semibold text-[#e2e8f0] uppercase tracking-wider">HTF Bias</span>
        </div>
        <div className="p-3 space-y-1.5">
          {[
            { tf: "Weekly", bias: "Bullish" as Direction },
            { tf: "Daily", bias: "Bullish" as Direction },
            { tf: "4H", bias: "Bullish" as Direction },
            { tf: "1H", bias: "Bullish" as Direction },
            { tf: "15M", bias: "Bullish" as Direction },
          ].map((item) => (
            <div key={item.tf} className="flex items-center justify-between">
              <span className="text-[10px] text-[#64748b] font-medium">{item.tf}</span>
              <div className="flex items-center gap-1">
                <span className="text-[9px] font-bold text-[#10b981]">{item.bias}</span>
                <ArrowUp className="w-3 h-3 text-[#10b981]" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* News Panel */}
      <div className="glass-card mx-2 mb-2 rounded-sm">
        <div className="px-3 py-2 border-b border-[#1e2d3d] flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Newspaper className="w-3 h-3 text-[#06b6d4]" />
            <span className="text-[10px] font-semibold text-[#e2e8f0] uppercase tracking-wider">News</span>
          </div>
          <span className="text-[8px] text-[#475569]">Live Feed</span>
        </div>
        <div className="divide-y divide-[#1e2d3d]/50">
          {newsItems.map((news, i) => (
            <div key={i} className="px-3 py-2 hover:bg-[#111d2e]/50 transition-colors">
              <div className="flex items-start justify-between gap-2 mb-0.5">
                <span className="text-[9px] text-[#e2e8f0] leading-tight flex-1">{news.title}</span>
                <ImpactBadge impact={news.impact} />
              </div>
              <div className="flex items-center gap-2 text-[8px] text-[#475569]">
                <span>{news.time}</span>
                <span className="w-px h-2 bg-[#1e2d3d]" />
                <span>{news.currency}</span>
                <span className="w-px h-2 bg-[#1e2d3d]" />
                <span className="text-[#06b6d4]">{news.type}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Economic Calendar */}
      <div className="glass-card mx-2 mb-3 rounded-sm">
        <div className="px-3 py-2 border-b border-[#1e2d3d] flex items-center gap-1.5">
          <Calendar className="w-3 h-3 text-[#f59e0b]" />
          <span className="text-[10px] font-semibold text-[#e2e8f0] uppercase tracking-wider">Economic Calendar</span>
        </div>
        <div className="divide-y divide-[#1e2d3d]/50">
          {calendarEvents.map((ev, i) => (
            <div key={i} className="px-3 py-2 hover:bg-[#111d2e]/50 transition-colors">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <span className="text-[9px] text-[#e2e8f0] flex-1">{ev.event}</span>
                <ImpactBadge impact={ev.impact} />
              </div>
              <div className="flex items-center gap-2 text-[8px] text-[#475569]">
                <Clock className="w-2.5 h-2.5" />
                <span>{ev.date}</span>
                <span className="w-px h-2 bg-[#1e2d3d]" />
                <span>F: {ev.forecast}</span>
                <span>P: {ev.previous}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
