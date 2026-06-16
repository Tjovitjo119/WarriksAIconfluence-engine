// ============================================================================
// WARRIKS AI — Premium Right Side Panel
// Tabbed interface: AI Signals • Order Entry • Trading Journal
// ============================================================================

import { useState, useMemo } from "react";
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
  GitBranch,
  Layers,
  BookOpen,
  DollarSign,
} from "lucide-react";
import type { Signal, Direction, MultiStrategyOutput, StrategyType, TradeDecision } from "@/engine/types";
import { STRATEGY_LABELS } from "@/engine/types";
import TradeExecution from "./TradeExecution";
import TradeJournal from "./TradeJournal";

type RightPanelTab = "signals" | "orders" | "journal";

interface RightPanelProps {
  signals: Signal[];
  multiStrategy?: MultiStrategyOutput | null;
  strategySummary?: { label: string; consensus: string; agreement: string; strategyBreakdown: { type: string; dir: string; conf: number }[] } | null;
  activeSymbol?: string;
  currentPrice?: number;
  decision?: TradeDecision | null;
  onTradeExecuted?: () => void;
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

function StrategyCard({ strategy }: { strategy: { type: string; dir: string; conf: number } }) {
  const isBuy = strategy.dir === "▲";
  const isSell = strategy.dir === "▼";
  const isActive = strategy.conf >= 60;
  return (
    <div className={`flex items-center justify-between px-2 py-1.5 border border-[#1e2d3d] bg-[#111d2e]/50 ${isActive ? (isBuy ? "border-l-[#10b981]" : isSell ? "border-l-[#ef4444]" : "") : "opacity-60"}`}>
      <div className="flex items-center gap-1.5">
        <span className={`text-[9px] font-medium ${isActive ? "text-[#e2e8f0]" : "text-[#64748b]"}`}>
          {STRATEGY_LABELS[strategy.type as StrategyType] || strategy.type}
        </span>
        {isActive && (
          <span className={`text-[8px] font-bold ${isBuy ? "text-[#10b981]" : isSell ? "text-[#ef4444]" : "text-[#64748b]"}`}>
            {strategy.dir}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1">
        <div className="w-14 h-1.5 bg-[#0a0e17] overflow-hidden">
          <div
            className={`h-full ${isBuy ? "bg-[#10b981]" : isSell ? "bg-[#ef4444]" : "bg-[#64748b]"}`}
            style={{ width: `${strategy.conf}%` }}
          />
        </div>
        <span className={`text-[9px] font-bold w-5 text-right ${strategy.conf >= 60 ? (isBuy ? "text-[#10b981]" : isSell ? "text-[#ef4444]" : "text-[#64748b]") : "text-[#475569]"}`}>
          {strategy.conf}
        </span>
      </div>
    </div>
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

const TABS: { id: RightPanelTab; label: string; icon: typeof Brain }[] = [
  { id: "signals", label: "Signals", icon: Brain },
  { id: "orders", label: "Orders", icon: DollarSign },
  { id: "journal", label: "Journal", icon: BookOpen },
];

export default function RightPanel({
  signals,
  multiStrategy,
  strategySummary,
  activeSymbol = "NAS100",
  currentPrice = 0,
  decision = null,
  onTradeExecuted,
}: RightPanelProps) {
  const [activeTab, setActiveTab] = useState<RightPanelTab>("signals");

  const mainSignal = signals[0];
  const hasSignal = !!mainSignal && mainSignal.status === "Active";
  const isBuy = mainSignal?.direction === "BUY";

  const consensusColor =
    strategySummary?.consensus === "BUY" ? "text-[#10b981]" :
    strategySummary?.consensus === "SELL" ? "text-[#ef4444]" :
    "text-[#64748b]";

  return (
    <div className="h-full flex flex-col bg-[#0a0e17] overflow-hidden">
      {/* Tab Navigation */}
      <div className="flex border-b border-[#1e2d3d] shrink-0">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[9px] font-semibold transition-all border-b-2 ${
                isActive
                  ? "text-[#06b6d4] border-b-[#06b6d4] bg-[#06b6d4]/6"
                  : "text-[#64748b] border-b-transparent hover:text-[#e2e8f0] hover:bg-[#111d2e]/50"
              }`}
            >
              <Icon className="w-3 h-3" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "orders" ? (
          <TradeExecution
            activeSymbol={activeSymbol}
            currentPrice={currentPrice}
            decision={decision}
            onTradeExecuted={onTradeExecuted}
          />
        ) : activeTab === "journal" ? (
          <TradeJournal activeSymbol={activeSymbol} />
        ) : (
          <div className="h-full overflow-y-auto">
            {/* AI Signal */}
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

                  <div className="flex items-center justify-between py-1.5 border-t border-[#1e2d3d]">
                    <span className="text-[9px] text-[#64748b]">Risk:Reward</span>
                    <span className={`text-[11px] font-bold trading-mono ${
                      mainSignal.riskReward >= 2 ? "text-[#10b981]" : "text-[#f59e0b]"
                    }`}>
                      1:{mainSignal.riskReward.toFixed(1)}
                    </span>
                  </div>

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

            {/* Multi-Strategy Panel */}
            <div className="glass-card mx-2 mb-2 rounded-sm">
              <div className="px-3 py-2 border-b border-[#1e2d3d] flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Layers className="w-3 h-3 text-[#f59e0b]" />
                  <span className="text-[10px] font-semibold text-[#e2e8f0] uppercase tracking-wider">Strategies</span>
                </div>
                {multiStrategy && (
                  <div className={`flex items-center gap-1 text-[8px] font-bold ${consensusColor}`}>
                    <span>{multiStrategy.buyVotes}▲</span>
                    <span>/</span>
                    <span>{multiStrategy.sellVotes}▼</span>
                    <span className="w-px h-2.5 bg-[#1e2d3d] mx-0.5" />
                    <span className="text-[#64748b]">{multiStrategy.agreement}</span>
                  </div>
                )}
              </div>
              <div className="p-2 space-y-1">
                {strategySummary?.strategyBreakdown.map((s, i) => (
                  <StrategyCard key={i} strategy={s} />
                ))}
              </div>
              {multiStrategy && (
                <div className="px-3 py-2 border-t border-[#1e2d3d]">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-[#64748b]">Consensus</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold ${consensusColor}`}>
                        {multiStrategy.consensusDirection === "NEUTRAL" ? "MIXED" : multiStrategy.consensusDirection}
                      </span>
                      <span className={`text-[8px] px-1 py-0.5 border font-semibold ${
                        multiStrategy.agreement === "STRONG" ? "text-[#10b981] border-[#10b981]/30 bg-[#10b981]/10" :
                        multiStrategy.agreement === "MODERATE" ? "text-[#f59e0b] border-[#f59e0b]/30 bg-[#f59e0b]/10" :
                        multiStrategy.agreement === "CONFLICT" ? "text-[#ef4444] border-[#ef4444]/30 bg-[#ef4444]/10" :
                        "text-[#64748b] border-[#1e2d3d]"
                      }`}>
                        {multiStrategy.agreement}
                      </span>
                    </div>
                  </div>
                  <div className="mt-1">
                    <span className="text-[8px] text-[#475569]">
                      Best: {STRATEGY_LABELS[multiStrategy.topStrategy] || multiStrategy.topStrategy}
                      <span className="mx-1">·</span>
                      Avg confidence: {multiStrategy.avgConfidence}%
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Strategy Probability */}
            <div className="glass-card mx-2 mb-2 rounded-sm">
              <div className="px-3 py-2 border-b border-[#1e2d3d] flex items-center gap-1.5">
                <BarChart3 className="w-3 h-3 text-[#f59e0b]" />
                <span className="text-[10px] font-semibold text-[#e2e8f0] uppercase tracking-wider">Probability</span>
              </div>
              <div className="p-3 space-y-2">
                <ProbabilityBar label="Bullish Scenario" value={multiStrategy ? Math.round(multiStrategy.buyVotes * 25) : 72} color="#10b981" />
                <ProbabilityBar label="Bearish Scenario" value={multiStrategy ? Math.round(multiStrategy.sellVotes * 25) : 18} color="#ef4444" />
                <ProbabilityBar label="Avg Confidence" value={multiStrategy?.avgConfidence || 50} color="#06b6d4" />
              </div>
            </div>

            {/* News Feed */}
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
        )}
      </div>
    </div>
  );
}
