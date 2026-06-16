// ============================================================================
// WARRIKS AI — Premium Bottom Analytics Panel
// Performance metrics • Strategy Comparison • Risk Manager • Active Positions
// ============================================================================

import { useMemo } from "react";
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
} from "lucide-react";
import type { TradeRecord, MarketData, MultiStrategyOutput, StrategyType } from "@/engine/types";
import { STRATEGY_LABELS } from "@/engine/types";

interface BottomAnalyticsProps {
  trades: TradeRecord[];
  markets: MarketData[];
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
  const stats = useMemo(() => {
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
    const stdDev = Math.sqrt(
      returns.reduce((s, r) => s + (r - avgReturn) ** 2, 0) / Math.max(returns.length, 1),
    );
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

    const dailyPnl = closed.filter((t) => t.timestamp > Date.now() - 86400000).reduce((s, t) => s + t.pnl, 0);
    const weeklyPnl = closed.filter((t) => t.timestamp > Date.now() - 604800000).reduce((s, t) => s + t.pnl, 0);
    const monthlyPnl = closed.filter((t) => t.timestamp > Date.now() - 2592000000).reduce((s, t) => s + t.pnl, 0);

    return {
      winRate, totalPnl, avgRR, profitFactor, bestTrade, worstTrade, sharpe,
      maxDD, dailyPnl, weeklyPnl, monthlyPnl, total: closed.length,
      wins: wins.length, losses: losses.length,
    };
  }, [trades]);

  return (
    <div className="h-full flex bg-[#0a0e17]">
      {/* Performance Metrics */}
      <div className="w-[280px] p-2 border-r border-[#1e2d3d] shrink-0 overflow-y-auto">
        <div className="flex items-center gap-1.5 mb-2 px-1">
          <Activity className="w-3 h-3 text-[#06b6d4]" />
          <span className="text-[9px] font-semibold text-[#e2e8f0] uppercase tracking-wider">Performance</span>
          <span className="text-[8px] text-[#475569] ml-auto">Updated Live</span>
        </div>
        <div className="grid grid-cols-6 gap-2">
          <MetricCard icon={Target} label="Win Rate" value={`${stats.winRate.toFixed(1)}%`} color="#10b981" subValue={`${stats.wins}W / ${stats.losses}L`} />
          <MetricCard icon={TrendingUp} label="Profit Factor" value={stats.profitFactor === Infinity ? "∞" : stats.profitFactor.toFixed(2)} color="#06b6d4" subValue={`Avg R:R ${stats.avgRR.toFixed(2)}`} />
          <MetricCard icon={BarChart3} label="Sharpe Ratio" value={stats.sharpe.toFixed(2)} color="#f59e0b" />
          <MetricCard icon={TrendingDown} label="Max DD" value={`${stats.maxDD.toFixed(1)}%`} color="#ef4444" />
          <MetricCard icon={DollarSign} label="Best / Worst" value={`+${stats.bestTrade.toFixed(0)}`} color="#10b981" subValue={`$${Math.abs(stats.worstTrade).toFixed(0)}`} />
          <MetricCard icon={Activity} label="Total Trades" value={`${stats.total}`} color="#64748b" />
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <MetricCard icon={DollarSign} label="Daily P&L" value={`${stats.dailyPnl >= 0 ? "+" : ""}$${stats.dailyPnl.toFixed(0)}`} color={stats.dailyPnl >= 0 ? "#10b981" : "#ef4444"} />
          <MetricCard icon={DollarSign} label="Weekly P&L" value={`${stats.weeklyPnl >= 0 ? "+" : ""}$${stats.weeklyPnl.toFixed(0)}`} color={stats.weeklyPnl >= 0 ? "#10b981" : "#ef4444"} />
          <MetricCard icon={DollarSign} label="Monthly P&L" value={`${stats.monthlyPnl >= 0 ? "+" : ""}$${stats.monthlyPnl.toFixed(0)}`} color={stats.monthlyPnl >= 0 ? "#10b981" : "#ef4444"} />
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
            <span className="text-[9px] text-[#64748b]">Current Exposure</span>
            <span className="text-[10px] font-bold trading-mono text-[#f59e0b]">$3,250.00</span>
          </div>
          <div className="flex items-center justify-between px-2 py-1.5 bg-[#111d2e]/70 border border-[#1e2d3d]">
            <span className="text-[9px] text-[#64748b]">Open Risk</span>
            <span className="text-[10px] font-bold trading-mono text-[#ef4444]">$480.00</span>
          </div>
          <div className="flex items-center justify-between px-2 py-1.5 bg-[#111d2e]/70 border border-[#1e2d3d]">
            <span className="text-[9px] text-[#64748b]">Risk Per Trade</span>
            <span className="text-[10px] font-bold trading-mono text-[#06b6d4]">1.5%</span>
          </div>
          <div className="flex items-center justify-between px-2 py-1.5 bg-[#111d2e]/70 border border-[#1e2d3d]">
            <span className="text-[9px] text-[#64748b]">Position Sizing</span>
            <span className="text-[10px] font-bold trading-mono text-[#10b981]">0.25 units</span>
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

      {/* Active Positions Table */}
      <div className="flex-[1.5] p-2 shrink-0 min-w-0">
        <div className="flex items-center gap-1.5 mb-2 px-1">
          <BarChart3 className="w-3 h-3 text-[#10b981]" />
          <span className="text-[9px] font-semibold text-[#e2e8f0] uppercase tracking-wider">Active Positions</span>
          <span className="text-[8px] text-[#475569] ml-auto">3 positions</span>
        </div>

        <div className="grid grid-cols-10 gap-px px-2 py-1 text-[8px] text-[#475569] uppercase tracking-wider font-semibold bg-[#111d2e] border border-[#1e2d3d] mb-px">
          <span className="col-span-1">Symbol</span>
          <span className="col-span-1">Dir</span>
          <span className="col-span-1 text-right">Entry</span>
          <span className="col-span-1 text-right">Current</span>
          <span className="col-span-1 text-right">SL</span>
          <span className="col-span-1 text-right">TP1</span>
          <span className="col-span-1 text-right">TP2</span>
          <span className="col-span-1 text-right">TP3</span>
          <span className="col-span-1 text-right">R:R</span>
          <span className="col-span-1 text-right">Status</span>
        </div>

        {[
          { symbol: "NAS100", dir: "BUY" as const, entry: 19520, current: 19578, sl: 19380, tp1: 19620, tp2: 19700, tp3: 19850, rr: 2.4, status: "Active" },
          { symbol: "XAUUSD", dir: "SELL" as const, entry: 2347, current: 2338, sl: 2360, tp1: 2330, tp2: 2320, tp3: 2305, rr: 2.0, status: "Active" },
          { symbol: "GBPUSD", dir: "SELL" as const, entry: 1.2682, current: 1.2645, sl: 1.2730, tp1: 1.2630, tp2: 1.2590, tp3: 1.2530, rr: 2.1, status: "Active" },
        ].map((pos, i) => {
          const isUp = pos.dir === "BUY" ? pos.current >= pos.entry : pos.current <= pos.entry;
          return (
            <div
              key={i}
              className="grid grid-cols-10 gap-px px-2 py-1.5 text-[10px] border-b border-[#1e2d3d]/50 hover:bg-[#111d2e]/40 transition-colors"
            >
              <span className="col-span-1 font-semibold text-[#e2e8f0]">{pos.symbol}</span>
              <span className={`col-span-1 font-bold ${pos.dir === "BUY" ? "text-[#10b981]" : "text-[#ef4444]"}`}>
                {pos.dir === "BUY" ? <ArrowUp className="w-3 h-3 inline" /> : <ArrowDown className="w-3 h-3 inline" />}
              </span>
              <span className="col-span-1 text-right trading-mono text-[#64748b]">{pos.entry.toFixed(pos.symbol === "XAUUSD" ? 1 : 2)}</span>
              <span className={`col-span-1 text-right trading-mono font-medium ${isUp ? "text-[#10b981]" : "text-[#ef4444]"}`}>
                {pos.current.toFixed(pos.symbol === "XAUUSD" ? 1 : 2)}
              </span>
              <span className="col-span-1 text-right trading-mono text-[#ef4444]">{pos.sl.toFixed(1)}</span>
              <span className="col-span-1 text-right trading-mono text-[#10b981]">{pos.tp1.toFixed(1)}</span>
              <span className="col-span-1 text-right trading-mono text-[#10b981]">{pos.tp2.toFixed(1)}</span>
              <span className="col-span-1 text-right trading-mono text-[#10b981]">{pos.tp3.toFixed(1)}</span>
              <span className="col-span-1 text-right trading-mono text-[#06b6d4]">1:{pos.rr.toFixed(1)}</span>
              <span className="col-span-1 text-right text-[9px] text-[#10b981]">{pos.status}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
