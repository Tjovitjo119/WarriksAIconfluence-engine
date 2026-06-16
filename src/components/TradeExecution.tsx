// ============================================================================
// WARRIKS AI — Trade Execution Panel
// Professional order entry form with quick execution controls
// ============================================================================

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Zap,
  ArrowUp,
  ArrowDown,
  DollarSign,
  Target,
  Percent,
  Activity,
  Check,
  X,
  AlertTriangle,
} from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Direction, Killzone, OrderFlowModel, TradeDecision } from "@/engine/types";

interface TradeExecutionProps {
  activeSymbol: string;
  currentPrice: number;
  decision?: TradeDecision | null;
  onTradeExecuted?: () => void;
}

export default function TradeExecution({ activeSymbol, currentPrice, decision, onTradeExecuted }: TradeExecutionProps) {
  const openTrade = useMutation(api.trades.openTrade);

  const [direction, setDirection] = useState<Direction>("BUY");
  const [entryPrice, setEntryPrice] = useState(currentPrice.toString());
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [quantity, setQuantity] = useState("1.0");
  const [isExecuting, setIsExecuting] = useState(false);
  const [executed, setExecuted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill from AI decision when available
  const fillFromDecision = useCallback(() => {
    if (!decision || decision.status !== "TRADE") return;
    setDirection(decision.direction);
    setEntryPrice(decision.entryZone.midpoint.toFixed(activeSymbol === "XAUUSD" ? 1 : 2));
    setStopLoss(decision.stopLoss.toFixed(activeSymbol === "XAUUSD" ? 1 : 2));
    setTakeProfit(decision.takeProfit.tp1.toFixed(activeSymbol === "XAUUSD" ? 1 : 2));
  }, [decision, activeSymbol]);

  // Calculate risk
  const entry = parseFloat(entryPrice) || 0;
  const sl = parseFloat(stopLoss) || 0;
  const tp = parseFloat(takeProfit) || 0;
  const qty = parseFloat(quantity) || 0;

  const riskAmount = entry > 0 && sl > 0
    ? Math.abs(entry - sl) * qty
    : 0;
  const rewardAmount = entry > 0 && tp > 0
    ? Math.abs(tp - entry) * qty
    : 0;
  const riskReward = riskAmount > 0
    ? Math.round((rewardAmount / riskAmount) * 10) / 10
    : 0;

  const handleExecute = async () => {
    if (!entry || !sl || !tp || !qty) {
      setError("Fill in all required fields");
      return;
    }

    if (direction === "BUY" && sl >= entry) {
      setError("Stop loss must be below entry for BUY");
      return;
    }
    if (direction === "SELL" && sl <= entry) {
      setError("Stop loss must be above entry for SELL");
      return;
    }

    setIsExecuting(true);
    setError(null);

    try {
      await openTrade({
        symbol: activeSymbol,
        direction: direction as "BUY" | "SELL",
        entryPrice: entry,
        stopLoss: sl,
        takeProfit: tp,
        quantity: qty,
        riskReward,
        entryModel: decision?.orderFlowModel,
        killzone: undefined,
        confluenceScore: decision?.confluenceScore,
      });

      setExecuted(true);
      setTimeout(() => setExecuted(false), 2000);
      onTradeExecuted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Execution failed");
    } finally {
      setIsExecuting(false);
    }
  };

  const quickSizes = [0.1, 0.25, 0.5, 1.0, 2.0];

  return (
    <div className="h-full flex flex-col bg-[#0a0e17] overflow-y-auto">
      {/* Header */}
      <div className="px-3 py-2 border-b border-[#1e2d3d] flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Zap className="w-3 h-3 text-[#f59e0b]" />
          <span className="text-[10px] font-semibold text-[#e2e8f0] uppercase tracking-wider">Order Entry</span>
        </div>
        <span className="text-[9px] text-[#475569]">{activeSymbol}</span>
      </div>

      {/* Direction toggle */}
      <div className="p-3 space-y-3">
        <div className="grid grid-cols-2 gap-1">
          <button
            onClick={() => setDirection("BUY")}
            className={`flex items-center justify-center gap-1.5 py-2 text-[11px] font-bold transition-all border ${
              direction === "BUY"
                ? "bg-[#10b981]/15 border-[#10b981]/40 text-[#10b981]"
                : "bg-[#111d2e]/50 border-[#1e2d3d] text-[#64748b] hover:text-[#e2e8f0]"
            }`}
          >
            <ArrowUp className="w-3.5 h-3.5" />
            BUY
          </button>
          <button
            onClick={() => setDirection("SELL")}
            className={`flex items-center justify-center gap-1.5 py-2 text-[11px] font-bold transition-all border ${
              direction === "SELL"
                ? "bg-[#ef4444]/15 border-[#ef4444]/40 text-[#ef4444]"
                : "bg-[#111d2e]/50 border-[#1e2d3d] text-[#64748b] hover:text-[#e2e8f0]"
            }`}
          >
            <ArrowDown className="w-3.5 h-3.5" />
            SELL
          </button>
        </div>

        {/* AI Fill Button */}
        {decision?.status === "TRADE" && (
          <button
            onClick={fillFromDecision}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[9px] font-medium text-[#06b6d4] bg-[#06b6d4]/8 border border-[#06b6d4]/20 hover:bg-[#06b6d4]/15 transition-all"
          >
            <Zap className="w-3 h-3" />
            Fill from AI Signal ({decision.direction} @ {decision.entryZone.midpoint.toFixed(1)})
          </button>
        )}

        {/* Entry Price */}
        <div className="space-y-1">
          <label className="flex items-center justify-between text-[9px] text-[#64748b]">
            <span>Entry Price</span>
            <span className="text-[#475569]">Current: {currentPrice.toFixed(activeSymbol === "XAUUSD" ? 1 : 2)}</span>
          </label>
          <div className="relative">
            <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#475569]" />
            <input
              type="number"
              step={activeSymbol === "NAS100" ? "0.1" : activeSymbol === "XAUUSD" ? "0.01" : "0.0001"}
              value={entryPrice}
              onChange={(e) => setEntryPrice(e.target.value)}
              className="w-full bg-[#111d2e] border border-[#1e2d3d] text-[11px] text-[#e2e8f0] px-6 py-1.5 font-mono focus:outline-none focus:border-[#06b6d4]/50 transition-colors"
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Stop Loss */}
        <div className="space-y-1">
          <label className="flex items-center justify-between text-[9px] text-[#64748b]">
            <span>Stop Loss</span>
            <span className="text-[#ef4444]">Risk</span>
          </label>
          <div className="relative">
            <Target className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#ef4444]/60" />
            <input
              type="number"
              step={activeSymbol === "NAS100" ? "0.1" : activeSymbol === "XAUUSD" ? "0.01" : "0.0001"}
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
              className="w-full bg-[#111d2e] border border-[#1e2d3d] text-[11px] text-[#ef4444] px-6 py-1.5 font-mono focus:outline-none focus:border-[#06b6d4]/50 transition-colors"
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Take Profit */}
        <div className="space-y-1">
          <label className="flex items-center justify-between text-[9px] text-[#64748b]">
            <span>Take Profit (TP1)</span>
            <span className="text-[#10b981]">Reward</span>
          </label>
          <div className="relative">
            <Target className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#10b981]/60" />
            <input
              type="number"
              step={activeSymbol === "NAS100" ? "0.1" : activeSymbol === "XAUUSD" ? "0.01" : "0.0001"}
              value={takeProfit}
              onChange={(e) => setTakeProfit(e.target.value)}
              className="w-full bg-[#111d2e] border border-[#1e2d3d] text-[11px] text-[#10b981] px-6 py-1.5 font-mono focus:outline-none focus:border-[#06b6d4]/50 transition-colors"
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Quantity */}
        <div className="space-y-1">
          <label className="flex items-center justify-between text-[9px] text-[#64748b]">
            <span>Quantity</span>
            <span className="text-[#475569]">Position size</span>
          </label>
          <div className="relative">
            <Activity className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#475569]" />
            <input
              type="number"
              step="0.01"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full bg-[#111d2e] border border-[#1e2d3d] text-[11px] text-[#e2e8f0] px-6 py-1.5 font-mono focus:outline-none focus:border-[#06b6d4]/50 transition-colors"
              placeholder="1.0"
            />
          </div>
          {/* Quick size buttons */}
          <div className="flex gap-0.5 mt-1">
            {quickSizes.map((size) => (
              <button
                key={size}
                onClick={() => setQuantity(size.toString())}
                className={`flex-1 py-1 text-[8px] font-medium transition-all border ${
                  parseFloat(quantity) === size
                    ? "bg-[#06b6d4]/10 border-[#06b6d4]/30 text-[#06b6d4]"
                    : "bg-[#111d2e]/30 border-[#1e2d3d] text-[#64748b] hover:text-[#e2e8f0]"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Risk Summary */}
        {entry > 0 && sl > 0 && (
          <div className="border border-[#1e2d3d] bg-[#111d2e]/50 p-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] text-[#64748b]">Risk Amount</span>
              <span className="text-[10px] font-bold trading-mono text-[#ef4444]">
                ${riskAmount.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] text-[#64748b]">Reward Amount</span>
              <span className="text-[10px] font-bold trading-mono text-[#10b981]">
                ${rewardAmount.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-[#1e2d3d] pt-1">
              <span className="text-[9px] text-[#64748b]">Risk:Reward</span>
              <span className={`text-[11px] font-bold trading-mono ${
                riskReward >= 2 ? "text-[#10b981]" : riskReward >= 1 ? "text-[#f59e0b]" : "text-[#ef4444]"
              }`}>
                1:{riskReward.toFixed(1)}
              </span>
            </div>
          </div>
        )}

        {/* Execute Button */}
        <button
          onClick={handleExecute}
          disabled={isExecuting || executed}
          className={`w-full py-2 text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${
            executed
              ? "bg-[#10b981] text-black"
              : direction === "BUY"
              ? "bg-[#10b981] text-black hover:bg-[#059669] active:bg-[#047857]"
              : "bg-[#ef4444] text-white hover:bg-[#dc2626] active:bg-[#b91c1c]"
          } disabled:opacity-50`}
        >
          {isExecuting ? (
            <>
              <div className="w-3 h-3 border border-black/30 border-t-transparent rounded-full animate-spin" />
              Executing...
            </>
          ) : executed ? (
            <>
              <Check className="w-3.5 h-3.5" />
              Position Opened
            </>
          ) : (
            <>
              <Zap className="w-3.5 h-3.5" />
              {direction === "BUY" ? "BUY" : "SELL"} {activeSymbol}
            </>
          )}
        </button>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-1.5 text-[9px] text-[#ef4444] bg-[#ef4444]/10 border border-[#ef4444]/20 px-2 py-1.5"
          >
            <AlertTriangle className="w-3 h-3 shrink-0" />
            {error}
          </motion.div>
        )}
      </div>

      {/* Quick Close Section */}
      <div className="mt-auto border-t border-[#1e2d3d]">
        <div className="px-3 py-2">
          <div className="flex items-center gap-1.5 mb-2">
            <X className="w-3 h-3 text-[#64748b]" />
            <span className="text-[8px] text-[#64748b] uppercase tracking-wider font-semibold">Quick Close</span>
          </div>
          <div className="text-[8px] text-[#475569] leading-relaxed">
            Use the <span className="text-[#06b6d4]">Active Positions</span> panel below to close open trades with updated exit prices.
          </div>
        </div>
      </div>
    </div>
  );
}
