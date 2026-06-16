// ============================================================================
// WARRIKS AI — Institutional Trading Dashboard
// Full layout: TopBar • LeftSidebar • Center Chart • MultiTF Grid • RightPanel • BottomAnalytics
// ============================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import { Zap } from "lucide-react";
import { useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";

import TopBar from "@/components/TopBar";
import LeftSidebar from "@/components/LeftSidebar";
import CenterChart from "@/components/CenterChart";
import RightPanel from "@/components/RightPanel";
import BottomAnalytics from "@/components/BottomAnalytics";
import MultiTimeframeGrid from "@/components/MultiTimeframeGrid";

import { analyzeSession } from "@/engine/session";
import { runDecisionEngine } from "@/engine/decision";
import { runMultiStrategy, getStrategySummary } from "@/engine/strategies";
import { generateCandles, getMarketSnapshot, getMockSignals, getMockTradeHistory } from "@/engine/marketData";
import type { MarketData, Signal, TradeRecord, Candle, TradeDecision, MultiStrategyOutput } from "@/engine/types";
import { DEFAULT_SYMBOLS } from "@/engine/types";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, signOut, isLoading, isAuthenticated } = useAuth();
  const fetchLiveCandles = useAction(api.marketData.fetchLiveCandles);

  const [activeSymbol, setActiveSymbol] = useState("NAS100");
  const [activeNav, setActiveNav] = useState("dashboard");
  const [selectedTimeframe, setSelectedTimeframe] = useState("1H");
  const [candlesMap, setCandlesMap] = useState<Record<string, Candle[]>>({});
  const [markets, setMarkets] = useState<MarketData[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [trades] = useState<TradeRecord[]>(getMockTradeHistory);
  const [lastDecision, setLastDecision] = useState<TradeDecision | null>(null);
  const [multiStrategy, setMultiStrategy] = useState<MultiStrategyOutput | null>(null);
  const [sessionInfo, setSessionInfo] = useState(analyzeSession());
  const [refreshing, setRefreshing] = useState(false);
  const [dataSource, setDataSource] = useState<"live" | "synthetic">("synthetic");

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/auth");
    }
  }, [isLoading, isAuthenticated, navigate]);

  // Initialize market data — try live first, fall back to synthetic
  const loadMarketData = useCallback(async (isInitial: boolean) => {
    try {
      const liveData = await fetchLiveCandles();

      const hasLiveData = DEFAULT_SYMBOLS.some((s) => liveData[s] && liveData[s].length > 0);

      if (hasLiveData) {
        const merged: Record<string, Candle[]> = {};
        for (const symbol of [...DEFAULT_SYMBOLS, "USDJPY", "BTCUSD", "ETHUSD"]) {
          if (liveData[symbol] && liveData[symbol].length > 0) {
            merged[symbol] = liveData[symbol];
          } else {
            merged[symbol] = generateCandles(symbol, 120);
          }
        }

        setCandlesMap(merged);
        setDataSource("live");

        const marketData: MarketData[] = [];
        for (const symbol of [...DEFAULT_SYMBOLS, "USDJPY", "BTCUSD", "ETHUSD"]) {
          const candles = merged[symbol];
          if (candles && candles.length > 0) {
            marketData.push(getMarketSnapshot(symbol, candles));
          }
        }
        setMarkets(marketData);

        const activeCandles = merged[activeSymbol];
        if (activeCandles && activeCandles.length > 0) {
          const decision = runDecisionEngine(activeSymbol, activeCandles);
          setLastDecision(decision);
          const multi = runMultiStrategy(activeSymbol, activeCandles);
          setMultiStrategy(multi);
        }

        if (isInitial) {
          setSignals(getMockSignals());
        }
        return;
      }
    } catch (e) {
      console.warn("[Dashboard] Live data fetch failed, using synthetic:", e);
    }

    // Fallback: synthetic data
    const allSymbols = [...DEFAULT_SYMBOLS, "USDJPY", "BTCUSD", "ETHUSD"];
    const initialCandles: Record<string, Candle[]> = {};
    const marketData: MarketData[] = [];

    for (const symbol of allSymbols) {
      const candles = generateCandles(symbol, 120);
      initialCandles[symbol] = candles;
      marketData.push(getMarketSnapshot(symbol, candles));
    }

    setCandlesMap(initialCandles);
    setMarkets(marketData);
    setDataSource("synthetic");

    if (isInitial) {
      setSignals(getMockSignals());
    }

    const decision = runDecisionEngine(activeSymbol, initialCandles[activeSymbol]);
    setLastDecision(decision);

    const multi = runMultiStrategy(activeSymbol, initialCandles[activeSymbol]);
    setMultiStrategy(multi);
  }, [fetchLiveCandles, activeSymbol]);

  // Initial load
  useEffect(() => {
    loadMarketData(true);
  }, []);

  // Periodic refresh
  useEffect(() => {
    const interval = setInterval(() => {
      loadMarketData(false);
    }, 60000);
    return () => clearInterval(interval);
  }, [loadMarketData]);

  // Live tick simulation between API refreshes
  useEffect(() => {
    const interval = setInterval(() => {
      setCandlesMap((prev) => {
        const updated: Record<string, Candle[]> = { ...prev };
        const allSymbols = [...DEFAULT_SYMBOLS, "USDJPY", "BTCUSD", "ETHUSD"];

        for (const symbol of allSymbols) {
          const existing = updated[symbol];
          if (!existing || existing.length === 0) continue;

          const last = existing[existing.length - 1];
          const drift = (Math.random() - 0.49) * 
            (symbol === "NAS100" ? 8 : symbol === "XAUUSD" ? 1.2 : symbol === "BTCUSD" ? 120 : 0.0002);
          const open = last.close;
          const close = open + drift;
          const high = Math.max(open, close) + Math.random() * Math.abs(drift) * 0.8;
          const low = Math.min(open, close) - Math.random() * Math.abs(drift) * 0.8;
          const volume = Math.floor(Math.random() * 1000 + 100);

          const newCandle: Candle = {
            timestamp: Date.now(),
            open: Math.round(open * 10000) / 10000,
            high: Math.round(high * 10000) / 10000,
            low: Math.round(low * 10000) / 10000,
            close: Math.round(close * 10000) / 10000,
            volume,
          };

          updated[symbol] = [...existing.slice(-150), newCandle];
        }

        return updated;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Update market data and decisions when candles change
  useEffect(() => {
    if (!candlesMap[activeSymbol]) return;

    const allSymbols = [...DEFAULT_SYMBOLS, "USDJPY", "BTCUSD", "ETHUSD"];
    const marketData: MarketData[] = [];
    for (const symbol of allSymbols) {
      const candles = candlesMap[symbol];
      if (candles && candles.length > 0) {
        marketData.push(getMarketSnapshot(symbol, candles));
      }
    }
    setMarkets(marketData);
    setSessionInfo(analyzeSession());

    const candles = candlesMap[activeSymbol];
    if (candles && candles.length > 0) {
      const decision = runDecisionEngine(activeSymbol, candles);
      setLastDecision(decision);

      const multi = runMultiStrategy(activeSymbol, candles);
      setMultiStrategy(multi);
    }
  }, [activeSymbol, candlesMap]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    const allSymbols = [...DEFAULT_SYMBOLS, "USDJPY", "BTCUSD", "ETHUSD"];
    const updatedCandles: Record<string, Candle[]> = {};
    for (const symbol of allSymbols) {
      updatedCandles[symbol] = generateCandles(symbol, 120);
    }
    setCandlesMap(updatedCandles);
    setSignals(getMockSignals());
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  const handleSelectSymbol = useCallback((symbol: string) => {
    setActiveSymbol(symbol);
  }, []);

  // Strategy consensus summary
  const strategySummary = useMemo(() => {
    if (!multiStrategy) return null;
    return getStrategySummary(multiStrategy);
  }, [multiStrategy]);

  // Chart overlay data
  const chartData = useMemo(() => {
    const candles = candlesMap[activeSymbol] || [];
    const decision = lastDecision;

    return {
      candles,
      fvgZones: decision?.orderFlowModel === "FVG" && decision?.entryZone ? [decision.entryZone] : [],
      orderBlocks: decision?.orderFlowModel === "OB" && decision?.entryZone ? [decision.entryZone] : [],
      liquidityHighs: decision?.liquiditySweep && decision?.direction === "SELL" ? [decision?.entryZone?.high || 0].filter(Boolean) : [],
      liquidityLows: decision?.liquiditySweep && decision?.direction === "BUY" ? [decision?.entryZone?.low || 0].filter(Boolean) : [],
      sweepPoints: decision?.liquiditySweep ? [{ price: decision?.stopLoss || 0, direction: decision?.direction as "BUY" | "SELL" || "BUY" }] : [],
      activeSymbol,
      currentPrice: candles.length > 0 ? candles[candles.length - 1].close : 0,
      decision,
      multiStrategy,
    };
  }, [candlesMap, activeSymbol, lastDecision, multiStrategy]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#080c14] flex items-center justify-center">
        <div className="flex items-center gap-2.5 text-[#64748b]">
          <div className="w-5 h-5 rounded-sm gradient-cyan flex items-center justify-center">
            <Zap className="w-3 h-3 text-white animate-pulse" />
          </div>
          <span className="trading-mono text-xs">Loading WARRIKS AI Terminal...</span>
          <span className="status-dot online ml-1" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080c14] flex flex-col overflow-hidden">
      {/* Top Navigation Bar */}
      <TopBar
        markets={markets}
        dataSource={dataSource}
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <LeftSidebar
          activeNav={activeNav}
          onNavChange={setActiveNav}
        />

        {/* Center Area: Chart + MultiTF Grid */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Chart */}
          <div className="flex-1 min-h-0">
            <CenterChart
              data={chartData}
              onSymbolChange={handleSelectSymbol}
              selectedTimeframe={selectedTimeframe}
              onTimeframeChange={setSelectedTimeframe}
            />
          </div>

          {/* Multi-Timeframe Grid */}
          <div className="h-[130px] shrink-0 border-t border-[#1e2d3d]">
            <MultiTimeframeGrid
              candlesMap={candlesMap}
              symbol={activeSymbol}
            />
          </div>
        </div>

        {/* Right Panel — Signals, Order Entry, Journal */}
        <div className="w-[300px] shrink-0 border-l border-[#1e2d3d] overflow-hidden">
          <RightPanel
            signals={signals}
            multiStrategy={multiStrategy}
            strategySummary={strategySummary}
            activeSymbol={activeSymbol}
            currentPrice={candlesMap[activeSymbol]?.[candlesMap[activeSymbol]?.length - 1]?.close || 0}
            decision={lastDecision}
            onTradeExecuted={handleRefresh}
          />
        </div>
      </div>

      {/* Bottom Analytics */}
      <div className="h-[155px] shrink-0 border-t border-[#1e2d3d]">
        <BottomAnalytics
          trades={trades}
          markets={markets}
          multiStrategy={multiStrategy}
          strategySummary={strategySummary}
        />
      </div>

      {/* Status Bar */}
      <footer className="h-6 bg-[#0a0e17] border-t border-[#1e2d3d] flex items-center justify-between px-3 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-[8px] text-[#475569] tracking-wider">WARRIKS AI v5.1</span>
          <span className="w-px h-2.5 bg-[#1e2d3d]" />
          <span className="text-[8px] text-[#475569]">Institutional Multi-Strategy Execution Machine</span>
          <span className="w-px h-2.5 bg-[#1e2d3d]" />
          <span className={`text-[8px] ${lastDecision?.confluenceScore && lastDecision.confluenceScore >= 85 ? "text-[#10b981]" : "text-[#475569]"}`}>
            Confluence: {lastDecision?.confluenceScore || 0}/100
          </span>
          <span className="w-px h-2.5 bg-[#1e2d3d]" />
          <span className={`text-[8px] ${multiStrategy?.agreement === "STRONG" ? "text-[#10b981]" : multiStrategy?.agreement === "CONFLICT" ? "text-[#ef4444]" : "text-[#f59e0b]"}`}>
            Strategies: {multiStrategy?.agreement || "—"} ({multiStrategy?.buyVotes || 0}▲/{multiStrategy?.sellVotes || 0}▼)
          </span>
          <span className="w-px h-2.5 bg-[#1e2d3d]" />
          <span className="text-[8px] text-[#475569]">
            {sessionInfo.inKillzone ? (
              <span className="text-[#10b981]">● {sessionInfo.currentKillzone} KILLZONE ACTIVE</span>
            ) : (
              <span>○ {sessionInfo.currentKillzone}</span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[8px] text-[#475569]">{user?.name || user?.email || "Trader"}</span>
          <span className="status-dot online" />
        </div>
      </footer>
    </div>
  );
}
