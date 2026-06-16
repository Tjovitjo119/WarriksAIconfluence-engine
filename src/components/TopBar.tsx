// ============================================================================
// WARRIKS AI — Premium Top Navigation Bar
// Logo, engine status, time, user profile, live price cards
// ============================================================================

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import {
  Zap,
  Search,
  Bell,
  Settings,
  User,
  ChevronDown,
  LogOut,
  RefreshCw,
  Timer,
  BarChart3,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import type { MarketData } from "@/engine/types";

interface TopBarProps {
  markets: MarketData[];
  dataSource: "live" | "synthetic";
  onRefresh: () => void;
  refreshing: boolean;
}

function MiniPriceCard({ market }: { market: MarketData }) {
  const isUp = market.change >= 0;
  const prevPrice = useRef(market.price);
  const [flash, setFlash] = useState<"up" | "down" | null>(null);

  useEffect(() => {
    if (market.price > prevPrice.current) setFlash("up");
    else if (market.price < prevPrice.current) setFlash("down");
    prevPrice.current = market.price;
    const t = setTimeout(() => setFlash(null), 400);
    return () => clearTimeout(t);
  }, [market.price]);

  return (
    <div className={`flex items-center gap-2.5 px-2.5 py-1 border-r border-[#1e2d3d]/50 last:border-r-0 ${
      flash === "up" ? "price-flash-up" : flash === "down" ? "price-flash-down" : ""
    }`}>
      <span className="text-[10px] font-semibold text-[#94a3b8] min-w-[52px]">{market.symbol}</span>
      <span className="text-[11px] font-bold trading-mono text-[#e2e8f0] min-w-[60px] text-right">
        {market.price.toFixed(market.symbol === "NAS100" || market.symbol === "XAUUSD" ? 1 : 4)}
      </span>
      <div className={`flex items-center gap-1 min-w-[50px] justify-end ${
        isUp ? "text-[#10b981]" : "text-[#ef4444]"
      }`}>
        <span className="text-[9px] font-mono">
          {isUp ? "+" : ""}{market.changePercent.toFixed(2)}%
        </span>
      </div>
    </div>
  );
}

export default function TopBar({ markets, dataSource, onRefresh, refreshing }: TopBarProps) {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const utcTime = currentTime.toUTCString().slice(17, 25);
  const localTime = currentTime.toLocaleTimeString("en-US", { hour12: false });

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  return (
    <div className="h-11 bg-[#0a0e17] border-b border-[#1e2d3d] flex items-center justify-between px-3 shrink-0 glow-topbar z-20">
      {/* Left: Logo + Engine Status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 pr-3 border-r border-[#1e2d3d]/50">
          <div className="w-5 h-5 rounded-sm gradient-cyan flex items-center justify-center">
            <Zap className="w-3 h-3 text-white" />
          </div>
          <span className="text-[11px] font-bold text-white tracking-[0.12em]">
            WARRIKS
          </span>
          <span className="text-[8px] text-[#06b6d4] font-bold bg-[#06b6d4]/10 px-1 border border-[#06b6d4]/20">
            AI
          </span>
        </div>

        {/* Live engine status */}
        <div className="flex items-center gap-3 text-[9px]">
          <div className="flex items-center gap-1.5">
            <span className="status-dot online" />
            <span className="text-[#10b981] font-medium">Engine Live</span>
          </div>
          <div className="h-3 w-px bg-[#1e2d3d]" />
          <div className="flex items-center gap-1.5 text-[#64748b]">
            <Timer className="w-3 h-3" />
            <span className="trading-mono">{localTime}</span>
            <span className="text-[#475569]">UTC</span>
            <span className="trading-mono text-[#475569]">{utcTime}</span>
          </div>
        </div>
      </div>

      {/* Center: Mini price cards */}
      <div className="flex items-center h-full">
        {markets.slice(0, 6).map((market) => (
          <MiniPriceCard key={market.symbol} market={market} />
        ))}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5">
        {/* Data feed status */}
        <div className={`flex items-center gap-1.5 px-2 py-1 text-[9px] border border-[#1e2d3d] mr-1 ${
          dataSource === "live" ? "text-[#10b981]" : "text-[#f59e0b]"
        }`}>
          <span className={`status-dot ${dataSource === "live" ? "online" : "warning"}`} />
          <span>{dataSource === "live" ? "LIVE FEED" : "SYNTHETIC"}</span>
        </div>

        {/* Market status */}
        <div className="flex items-center gap-1 px-2 py-1 text-[9px] text-[#64748b] border border-[#1e2d3d]">
          <BarChart3 className="w-3 h-3" />
          <span>ACTIVE</span>
        </div>

        {/* Refresh */}
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="btn-ghost p-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-[#06b6d4]" : ""}`} />
        </button>

        {/* Search */}
        <button className="btn-ghost p-1.5">
          <Search className="w-3.5 h-3.5" />
        </button>

        {/* Notifications */}
        <button className="btn-ghost p-1.5 relative">
          <Bell className="w-3.5 h-3.5" />
          <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-[#ef4444] border border-[#0a0e17]" />
        </button>

        {/* Settings */}
        <button className="btn-ghost p-1.5">
          <Settings className="w-3.5 h-3.5" />
        </button>

        {/* User Profile */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-1.5 px-2 py-1 ml-1 border-l border-[#1e2d3d]/50 hover:bg-[#111d2e]/50 transition-colors"
          >
            <div className="w-5 h-5 rounded-sm bg-gradient-to-br from-[#06b6d4] to-[#0891b2] flex items-center justify-center">
              <User className="w-3 h-3 text-white" />
            </div>
            <span className="text-[10px] text-[#94a3b8] max-w-[80px] truncate">
              {user?.name || user?.email || "Trader"}
            </span>
            <ChevronDown className="w-3 h-3 text-[#64748b]" />
          </button>

          {showUserMenu && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute right-0 top-full mt-1 w-48 bg-[#0d1520] border border-[#1e2d3d] shadow-xl z-50 glass-panel"
            >
              <div className="px-3 py-2 border-b border-[#1e2d3d]">
                <div className="text-[11px] font-medium text-[#e2e8f0]">{user?.name || "Trader"}</div>
                <div className="text-[9px] text-[#64748b]">{user?.email || ""}</div>
              </div>
              <button
                onClick={() => { setShowUserMenu(false); navigate("/dashboard"); }}
                className="nav-item w-full text-left"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Dashboard
              </button>
              <button
                onClick={() => { setShowUserMenu(false); navigate("/"); }}
                className="nav-item w-full text-left"
              >
                <Zap className="w-3.5 h-3.5" />
                Landing
              </button>
              <div className="border-t border-[#1e2d3d]" />
              <button
                onClick={handleSignOut}
                className="nav-item w-full text-left text-[#ef4444]"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
