// ============================================================================
// WARRIKS AI — Main Trading Dashboard
// Institutional 4-panel layout with chart, watchlist, signals, trade history
// ============================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import {
  Zap,
  LogOut,
  GitPullRequest,
  Settings,
  BarChart3,
  RefreshCw,
  Timer,
} from "lucide-react";
import { useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

import TradingChart from "@/components/TradingChart";
import MarketWatchlist from "@/components/MarketWatchlist";
import SignalFeed from "@/components/SignalFeed";
import TradeHistory from "@/components/TradeHistory";

import { analyzeSession } from "@/engine/session";
import { runDecisionEngine } from "@/engine/decision";
import { generateCandles, getMarketSnapshot, getMockSignals, getMockTradeHistory } from "@/engine/marketData";
import type { MarketData, Signal, TradeRecord, Candle, TradeDecision } from "@/engine/types";
import { DEFAULT_SYMBOLS } from "@/engine/types";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, signOut, isLoading, isAuthenticated } = useAuth();
  const fetchLiveCandles = useAction(api.marketData.fetchLiveCandles);

  const [activeSymbol, setActiveSymbol] = useState("NAS100");
  const [candlesMap, setCandlesMap] = useState<Record<string, Candle[]>>({});
  const [markets, setMarkets] = useState<MarketData[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [trades] = useState<TradeRecord[]>(getMockTradeHistory);
  const [lastDecision, setLastDecision] = useState<TradeDecision | null>(null);
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

      // Check if we got any data back
      const hasLiveData = DEFAULT_SYMBOLS.some((s) => liveData[s] && liveData[s].length > 0);

      if (hasLiveData) {
        // Merge live data with synthetic fallback for any symbol that failed
        const merged: Record<string, Candle[]> = {};
        for (const symbol of DEFAULT_SYMBOLS) {
          if (liveData[symbol] && liveData[symbol].length > 0) {
            merged[symbol] = liveData[symbol];
          } else {
            merged[symbol] = generateCandles(symbol, 80);
          }
        }

        setCandlesMap(merged);
        setDataSource("live");

        // Update market snapshots
        const marketData: MarketData[] = [];
        for (const symbol of DEFAULT_SYMBOLS) {
          const candles = merged[symbol];
          if (candles && candles.length > 0) {
            marketData.push(getMarketSnapshot(symbol, candles));
          }
        }
        setMarkets(marketData);

        // Run decision engine
        const activeCandles = merged[activeSymbol];
        if (activeCandles && activeCandles.length > 0) {
          const decision = runDecisionEngine(activeSymbol, activeCandles);
          setLastDecision(decision);
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
    const initialCandles: Record<string, Candle[]> = {};
    const marketData: MarketData[] = [];

    for (const symbol of DEFAULT_SYMBOLS) {
      const candles = generateCandles(symbol, 80);
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
  }, [fetchLiveCandles, activeSymbol]);

  // Initial load
  useEffect(() => {
    loadMarketData(true);
  }, []); // only on mount

  // Periodic refresh from Twelve Data (every 60s to respect rate limits)
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

        for (const symbol of DEFAULT_SYMBOLS) {
          const existing = updated[symbol];
          if (!existing || existing.length === 0) continue;

          const last = existing[existing.length - 1];
          const drift = (Math.random() - 0.49) * 
            (symbol === "NAS100" ? 8 : symbol === "XAUUSD" ? 1.2 : 0.0002);
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

          updated[symbol] = [...existing.slice(-120), newCandle];
        }

        return updated;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Update market data and decisions when candles change
  useEffect(() => {
    if (!candlesMap[activeSymbol]) return;

    const marketData: MarketData[] = [];
    for (const symbol of DEFAULT_SYMBOLS) {
      const candles = candlesMap[symbol];
      if (candles && candles.length > 0) {
        marketData.push(getMarketSnapshot(symbol, candles));
      }
    }
    setMarkets(marketData);
    setSessionInfo(analyzeSession());

    // Run decision engine every 5 candles
    const candles = candlesMap[activeSymbol];
    if (candles && candles.length > 0) {
      const decision = runDecisionEngine(activeSymbol, candles);
      setLastDecision(decision);
    }
  }, [activeSymbol, candlesMap]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    const updatedCandles: Record<string, Candle[]> = {};
    for (const symbol of DEFAULT_SYMBOLS) {
      updatedCandles[symbol] = generateCandles(symbol, 80);
    }
    setCandlesMap(updatedCandles);
    setSignals(getMockSignals());
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  const handleSelectSymbol = useCallback((symbol: string) => {
    setActiveSymbol(symbol);
  }, []);

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
    };
  }, [candlesMap, activeSymbol, lastDecision]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Zap className="w-5 h-5 animate-pulse text-[#22c55e]" />
          <span className="trading-mono text-sm">Loading WARRIKS AI...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0c10] flex flex-col">
      {/* Top Navigation Bar */}
      <header className="h-9 bg-[#0c0e12] border-b border-border flex items-center justify-between px-3 neo-border">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#22c55e]" />
            <span className="text-xs font-bold text-white tracking-widest">
              WARRIKS AI
            </span>
          </div>
          <div className="h-3 w-px bg-border/50" />
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <Timer className="w-3 h-3" />
            <span className={sessionInfo.inKillzone ? "text-[#22c55e]" : "text-[#ef4444]"}>
              {sessionInfo.currentKillzone}
            </span>
            <span className="uppercase">
              {sessionInfo.inKillzone ? "● LIVE" : "○ OFFLINE"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {lastDecision && (
            <div className="flex items-center gap-1.5 text-[10px]">
              <span className="text-muted-foreground">Score:</span>
              <span className={`font-bold ${
                lastDecision.confluenceScore >= 85 ? "text-[#22c55e]" :
                lastDecision.confluenceScore >= 75 ? "text-[#eab308]" : "text-muted-foreground"
              }`}>
                {lastDecision.confluenceScore}
              </span>
              <BarChart3 className="w-3 h-3 text-muted-foreground ml-1" />
              <span className="text-muted-foreground">
                {lastDecision.marketBias !== "NEUTRAL" ? (lastDecision.tradeQuality === "HIGH" ? "4" : "3") : "0"}/4
              </span>
            </div>
          )}

          <span className="text-[9px] text-muted-foreground mr-1">
            {dataSource === "live" ? "● LIVE" : "○ SYNTH"}
          </span>

          <button
            onClick={() => { setRefreshing(true); loadMarketData(false).finally(() => setRefreshing(false)); }}
            disabled={refreshing}
            className="p-1 hover:bg-[#1a1d26] transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${refreshing ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={() => signOut()}
            className="p-1 hover:bg-[#1a1d26] transition-colors"
          >
            <LogOut className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
      </header>

      {/* Main Layout — 4 panels */}
      <div className="flex-1 flex gap-0 overflow-hidden">
        {/* Left: Market Watchlist */}
        <div className="w-[220px] flex-shrink-0 border-r border-border">
          <MarketWatchlist
            markets={markets}
            activeSymbol={activeSymbol}
            onSelectSymbol={handleSelectSymbol}
          />
        </div>

        {/* Center: Chart + Bottom */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Chart */}
          <div className="flex-1 border-b border-border">
            <TradingChart data={chartData} onSymbolChange={handleSelectSymbol} />
          </div>

          {/* Bottom: Trade History */}
          <div className="h-[180px] flex-shrink-0">
            <TradeHistory trades={trades} />
          </div>
        </div>

        {/* Right: Signal Feed */}
        <div className="w-[300px] flex-shrink-0 border-l border-border">
          <SignalFeed signals={signals} />
        </div>
      </div>

      {/* Status Bar */}
      <footer className="h-6 bg-[#0c0e12] border-t border-border flex items-center justify-between px-3">
        <div className="flex items-center gap-3 text-[9px] text-muted-foreground">
          <span>WARRIKS AI v5.1</span>
          <span className="w-px h-3 bg-border/50" />
          <span>Institutional Decision Engine</span>
          <span className="w-px h-3 bg-border/50" />
          <span>Confluence ≥75 • 3/4 Engines</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-muted-foreground">
            {user?.name || user?.email || "Anonymous"}
          </span>
          <span className={`w-1.5 h-1.5 rounded-full ${sessionInfo.inKillzone ? "bg-[#22c55e] animate-blink" : "bg-[#ef4444]"}`} />
        </div>
      </footer>
    </div>
  );
}
