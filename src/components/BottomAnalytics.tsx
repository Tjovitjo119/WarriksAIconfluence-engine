// ============================================================================
// WARRIKS AI — Premium Bottom Analytics Panel
// Performance Metrics • Strategy Comparison • Risk Manager • Active Positions
// ============================================================================

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Shield,
  BarChart3,
  Activity,
  ArrowUp,
  ArrowDown,
  LineChart,
  Layers,
  X,
  Check,
  Edit3,
} from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import type { TradeRecord, MultiStrategyOutput, StrategyType } from "@/engine/types";
import { STRATEGY_LABELS } from "@/engine/types";

interface BottomAnalyticsProps {
  trades: TradeRecord[];
  markets: import("@/engine/types").MarketData[];
  multiStrategy?: MultiStrategyOutput | null;
  strategySummary?: { label: string; consensus: string; agreement: string; strategyBreakdown: { type: string; dir: string; conf: number }[] } | null;
}

function MetricCard({
  icon: Icon,
  label,
  value,
  color,
  subValue,
}: {
  icon: typeof TrendingUp;
  label: string;
  value: string;
  color: string;
  subValue?: string;
}) {
  return (
    <div className="glass-card rounded-sm p-2.5">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3 h-3" style={{ color }} />
        <span className="text-[8px] text-[#64748b] uppercase tracking-wider font-semibold">{label}</span>
      </div>
      <div className="text-sm font-bold trading-mono" style={{ color }}>{value}</div>
      {subValue && <div className="text-[8px] text-[#475569] mt-0.5">{subValue}</div>}
    </div>
  );
}

export default function BottomAnalytics({ trades, multiStrategy, strategySummary }: BottomAnalyticsProps) {
  const openTrades = useQuery(api.trades.getMyTrades, { status: "OPEN", limit: 20 });
  const tradeStats = useQuery(api.trades.getTradeStats);
  const closeTrade = useMutation(api.trades.closeTrade);

  const [closingId, setClosingId] = useState<string | null>(null);
  const [exitPrices, setExitPrices] = useState<Record<string, string>>({});
  const [closeSuccess, setCloseSuccess] = useState<string | null>(null);

  // Stats from mock trades as fallback, or from Convex
  const stats = useMemo(() => {
    if (tradeStats && tradeStats.total > 0) {
      return {
        winRate: tradeStats.winRate,
        totalPnl: tradeStats.totalPnl,
        avgRR: tradeStats.avgRR,
        profitFactor: tradeStats.profitFactor,
        bestTrade: tradeStats.bestTrade,
        worstTrade: tradeStats.worstTrade,
        sharpe: tradeStats.sharpe,
        maxDD: tradeStats.maxDD,
        total: tradeStats.total,
        wins: tradeStats.wins,
        losses: tradeStats.losses,
      };
    }

    // Fallback: mock data
    const closed = trades.filter((t) => t.status !== "OPEN");
    const wins = closed.filter((t) => t.status === "WIN");
    const losses = closed.filter((t) => t.status === "LOSS");

    const winRate = closed.length > 0 ? (wins.length / closed.length) * 100 : 0;
    const totalPnl = closed.reduce((s, t) => s + t.pnl, 0);
    const avgRR = closed.length > 0 ? closed.reduce((s, t) => s + t.riskReward, 0) / closed.length : 0;

    const totalWins = wins.reduce((s, t) => s + t.pnl, 0);
    const totalLosses = losses.reduce((s, t) => s + Math.abs(t.pnl), 0);
    const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0;

    const bestTrade = closed.length > 0 ? Math.max(...closed.map((t) => t.pnl)) : 0;
    const worstTrade = closed.length > 0 ? Math.min(...closed.map((t) => t.pnl)) : 0;

    const returns = closed.map((t) => t.pnlPercent);
    const avgReturn = returns.reduce((s, r) => s + r, 0) / Math.max(returns.length, 1);
    const stdDev = Math.sqrt(returns.reduce((s, r) => s + (r - avgReturn) ** 2, 0) / Math.max(returns.length, 1));
    const sharpe = stdDev > 0 ? avgReturn / stdDev * Math.sqrt(252) : 0;

    let peak = -Infinity;
    let maxDD = 0;
    let runningPnl = 0;
    for (const t of closed) {
      runningPnl += t.pnl;
      if (runningPnl > peak) peak = runningPnl;
      const dd = ((peak - runningPnl) / Math.max(Math.abs(peak), 1)) * 100;
      if (dd > maxDD) maxDD = dd;
    }

    return {
      winRate, totalPnl, avgRR, profitFactor, bestTrade, worstTrade, sharpe,
      maxDD, total: closed.length, wins: wins.length, losses: losses.length,
    };
  }, [trades, tradeStats]);

  const handleCloseTrade = async (tradeId: string, symbol: string) => {
    const exitPrice = parseFloat(exitPrices[tradeId]);
    if (!exitPrice || isNaN(exitPrice)) return;

    setClosingId(tradeId);
    try {
      const result = await closeTrade({ tradeId: tradeId as any, exitPrice });
      setCloseSuccess(tradeId);
      setTimeout(() => setCloseSuccess(null), 2000);
    } catch (err) {
      console.error("Failed to close trade:", err);
    } finally {
      setClosingId(null);
    }
  };

  const displayPositions = openTrades && openTrades.length > 0
    ? openTrades.map((t) => ({
        id: t._id,
        symbol: t.symbol,
        dir: t.direction,
        entry: t.entryPrice,
        current: t.entryPrice, // approximate - would need live price
        sl: t.stopLoss,
        tp: t.takeProfit,
        rr: t.riskReward,
        qty: t.quantity,
        status: "Active" as const,
        isConvex: true,
      }))
    : []; // No mock fallback for open positions - use the trader view

  return (
    <div className="h-full flex bg-[#0a0e17]">
      {/* Performance Metrics */}
      <div className="w-[280px] p-2 border-r border-[#1e2d3d] shrink-0 overflow-y-auto">
        <div className="flex items-center gap-1.5 mb-2 px-1">
          <Activity className="w-3 h-3 text-[#06b6d4]" />
          <span className="text-[9px] font-semibold text-[#e2e8f0] uppercase tracking-wider">Performance</span>
          <span className="text-[8px] text-[#475569] ml-auto">Live</span>
        </div>
        <div className="grid grid-cols-6 gap-2">
          <MetricCard icon={Target} label="Win Rate" value={`${stats.winRate.toFixed(1)}%`} color="#10b981" subValue={`${stats.wins}W / ${stats.losses}L`} />
          <MetricCard icon={TrendingUp} label="Profit Factor" value={stats.profitFactor === Infinity ? "∞" : stats.profitFactor.toFixed(2)} color="#06b6d4" subValue={`Avg R:R ${stats.avgRR.toFixed(2)}`} />
          <MetricCard icon={BarChart3} label="Sharpe" value={stats.sharpe.toFixed(2)} color="#f59e0b" />
          <MetricCard icon={TrendingDown} label="Max DD" value={`${stats.maxDD.toFixed(1)}%`} color="#ef4444" />
          <MetricCard icon={DollarSign} label="Best / Worst" value={`+${stats.bestTrade.toFixed(0)}`} color="#10b981" subValue={`$${Math.abs(stats.worstTrade).toFixed(0)}`} />
          <MetricCard icon={Activity} label="Total" value={`${stats.total}`} color="#64748b" />
        </div>
      </div>

      {/* Multi-Strategy Comparison */}
      <div className="w-[260px] p-2 border-r border-[#1e2d3d] shrink-0 overflow-y-auto">
        <div className="flex items-center gap-1.5 mb-2 px-1">
          <Layers className="w-3 h-3 text-[#06b6d4]" />
          <span className="text-[9px] font-semibold text-[#e2e8f0] uppercase tracking-wider">Strategy Comparison</span>
          {multiStrategy && (
            <span className={`text-[8px] ml-auto font-bold ${
              multiStrategy.agreement === "STRONG" ? "text-[#10b981]" :
              multiStrategy.agreement === "CONFLICT" ? "text-[#ef4444]" : "text-[#f59e0b]"
            }`}>
              {multiStrategy.agreement}
            </span>
          )}
        </div>

        {strategySummary && multiStrategy ? (
          <div className="space-y-1">
            {multiStrategy.strategies.map((strategy, i) => {
              const isBuy = strategy.direction === "BUY";
              const isSell = strategy.direction === "SELL";
              const color = isBuy ? "#10b981" : isSell ? "#ef4444" : "#64748b";
              return (
                <div key={i} className="px-2 py-1.5 bg-[#111d2e]/70 border border-[#1e2d3d]">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[9px] font-medium text-[#e2e8f0]">
                      {STRATEGY_LABELS[strategy.type as StrategyType] || strategy.type}
                    </span>
                    <div className="flex items-center gap-1">
                      {strategy.direction !== "NEUTRAL" && (
                        <span className={`text-[9px] font-bold`} style={{ color }}>
                          {strategy.direction}
                        </span>
                      )}
                      <span className="text-[9px] font-bold trading-mono" style={{ color }}>
                        {strategy.confidence}%
                      </span>
                    </div>
                  </div>
                  <div className="h-1 bg-[#0a0e17] overflow-hidden mb-0.5">
                    <div
                      className="h-full transition-all duration-500"
                      style={{
                        width: `${strategy.confidence}%`,
                        background: isBuy
                          ? "linear-gradient(90deg, #10b981, #059669)"
                          : isSell
                          ? "linear-gradient(90deg, #ef4444, #dc2626)"
                          : "linear-gradient(90deg, #64748b, #475569)",
                      }}
                    />
                  </div>
                  <span className="text-[7px] text-[#475569] leading-tight block truncate">
                    {strategy.reason.length > 80 ? strategy.reason.slice(0, 80) + "..." : strategy.reason}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-2 py-4 text-center">
            <span className="text-[8px] text-[#475569]">Running strategy analysis...</span>
          </div>
        )}
      </div>

      {/* Risk Manager */}
      <div className="w-[220px] p-2 border-r border-[#1e2d3d] shrink-0">
        <div className="flex items-center gap-1.5 mb-2 px-1">
          <Shield className="w-3 h-3 text-[#f59e0b]" />
          <span className="text-[9px] font-semibold text-[#e2e8f0] uppercase tracking-wider">Risk Manager</span>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-2 py-1.5 bg-[#111d2e]/70 border border-[#1e2d3d]">
            <span className="text-[9px] text-[#64748b]">Account Balance</span>
            <span className="text-[10px] font-bold trading-mono text-[#e2e8f0]">$12,847.50</span>
          </div>
          <div className="flex items-center justify-between px-2 py-1.5 bg-[#111d2e]/70 border border-[#1e2d3d]">
            <span className="text-[9px] text-[#64748b]">Open Positions</span>
            <span className="text-[10px] font-bold trading-mono text-[#f59e0b]">{displayPositions.length}</span>
          </div>
          <div className="flex items-center justify-between px-2 py-1.5 bg-[#111d2e]/70 border border-[#1e2d3d]">
            <span className="text-[9px] text-[#64748b]">Total P&L</span>
            <span className={`text-[10px] font-bold trading-mono ${stats.totalPnl >= 0 ? "text-[#10b981]" : "text-[#ef4444]"}`}>
              {stats.totalPnl >= 0 ? "+" : ""}${stats.totalPnl.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between px-2 py-1.5 bg-[#111d2e]/70 border border-[#1e2d3d]">
            <span className="text-[9px] text-[#64748b]">Risk Per Trade</span>
            <span className="text-[10px] font-bold trading-mono text-[#06b6d4]">1.5%</span>
          </div>
          <div className="flex items-center justify-between px-2 py-1.5 bg-[#111d2e]/70 border border-[#1e2d3d]">
            <span className="text-[9px] text-[#64748b]">Win Rate</span>
            <span className="text-[10px] font-bold trading-mono text-[#10b981]">{stats.winRate.toFixed(0)}%</span>
          </div>
        </div>

        <div className="mt-3 px-2">
          <div className="flex items-center gap-1.5 mb-1.5">
            <LineChart className="w-3 h-3 text-[#06b6d4]" />
            <span className="text-[8px] text-[#64748b] uppercase tracking-wider font-semibold">Equity Curve</span>
          </div>
          <div className="h-12 bg-[#111d2e] border border-[#1e2d3d] flex items-end gap-[1px] px-1 py-1">
            {[60, 62, 58, 65, 70, 68, 72, 78, 75, 82, 80, 85, 88, 84, 90, 92, 88, 95, 98, 100].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col justify-end">
                <div
                  className="w-full"
                  style={{
                    height: `${h}%`,
                    background: i % 5 === 4 ? "rgba(6, 182, 212, 0.4)" : "rgba(16, 185, 129, 0.25)",
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active Positions with Close Controls */}
      <div className="flex-[1.5] p-2 shrink-0 min-w-0 overflow-y-auto">
        <div className="flex items-center gap-1.5 mb-2 px-1">
          <BarChart3 className="w-3 h-3 text-[#10b981]" />
          <span className="text-[9px] font-semibold text-[#e2e8f0] uppercase tracking-wider">Open Positions</span>
          <span className="text-[8px] text-[#475569] ml-auto">
            {displayPositions.length} position{displayPositions.length !== 1 ? "s" : ""}
          </span>
        </div>

        {displayPositions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-4 text-center">
            <BarChart3 className="w-5 h-5 text-[#475569] mb-1.5 opacity-50" />
            <span className="text-[9px] text-[#64748b]">No open positions</span>
            <span className="text-[8px] text-[#475569] mt-0.5">Use the Orders panel to open a trade</span>
          </div>
        ) : (
          <div>
            {/* Table Header */}
            <div className="grid grid-cols-10 gap-px px-2 py-1 text-[8px] text-[#475569] uppercase tracking-wider font-semibold bg-[#111d2e] border border-[#1e2d3d] mb-px">
              <span className="col-span-1">Symbol</span>
              <span className="col-span-1">Dir</span>
              <span className="col-span-1 text-right">Entry</span>
              <span className="col-span-1 text-right">SL</span>
              <span className="col-span-1 text-right">TP</span>
              <span className="col-span-1 text-right">Qty</span>
              <span className="col-span-1 text-right">R:R</span>
              <span className="col-span-1 text-right">Exit</span>
              <span className="col-span-2 text-right">Action</span>
            </div>

            {displayPositions.map((pos) => {
              const exitPrice = exitPrices[pos.id] || "";
              const isClosing = closingId === pos.id;
              const isClosed = closeSuccess === pos.id;

              return (
                <div
                  key={pos.id}
                  className="grid grid-cols-10 gap-px px-2 py-1.5 text-[10px] border-b border-[#1e2d3d]/50 hover:bg-[#111d2e]/40 transition-colors items-center"
                >
                  <span className="col-span-1 font-semibold text-[#e2e8f0]">{pos.symbol}</span>
                  <span className={`col-span-1 font-bold ${pos.dir === "BUY" ? "text-[#10b981]" : "text-[#ef4444]"}`}>
                    {pos.dir === "BUY" ? <ArrowUp className="w-3 h-3 inline" /> : <ArrowDown className="w-3 h-3 inline" />}
                  </span>
                  <span className="col-span-1 text-right trading-mono text-[#64748b]">{pos.entry.toFixed(pos.symbol === "XAUUSD" ? 1 : 2)}</span>
                  <span className="col-span-1 text-right trading-mono text-[#ef4444]/70">{pos.sl.toFixed(1)}</span>
                  <span className="col-span-1 text-right trading-mono text-[#10b981]/70">{pos.tp.toFixed(1)}</span>
                  <span className="col-span-1 text-right trading-mono text-[#64748b]">{pos.qty}</span>
                  <span className="col-span-1 text-right trading-mono text-[#06b6d4]">{pos.rr.toFixed(1)}</span>
                  <span className="col-span-1">
                    <input
                      type="number"
                      step="0.01"
                      value={exitPrice}
                      onChange={(e) => setExitPrices({ ...exitPrices, [pos.id]: e.target.value })}
                      className="w-full bg-[#111d2e] border border-[#1e2d3d] text-[9px] text-[#e2e8f0] px-1 py-0.5 font-mono text-right focus:outline-none focus:border-[#06b6d4]/50"
                      placeholder="Exit"
                    />
                  </span>
                  <span className="col-span-2 text-right">
                    <button
                      onClick={() => handleCloseTrade(pos.id, pos.symbol)}
                      disabled={isClosing || isClosed || !exitPrice}
                      className={`px-2 py-0.5 text-[8px] font-bold transition-all ${
                        isClosed
                          ? "bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30"
                          : "bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/20 hover:bg-[#ef4444]/20"
                      } disabled:opacity-30 disabled:cursor-not-allowed`}
                    >
                      {isClosing ? (
                        <span className="flex items-center gap-1">
                          <div className="w-2 h-2 border border-[#ef4444]/50 border-t-transparent rounded-full animate-spin" />
                          ...
                        </span>
                      ) : isClosed ? (
                        <span className="flex items-center gap-1">
                          <Check className="w-2.5 h-2.5" /> Done
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <X className="w-2.5 h-2.5" /> Close
                        </span>
                      )}
                    </button>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
