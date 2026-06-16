// ============================================================================
// WARRIKS AI — Premium Left Navigation Sidebar
// Main navigation + quick engine indicators
// ============================================================================

import { useState } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  TrendingUp,
  Star,
  Zap,
  BarChart3,
  RefreshCcw,
  Shield,
  Activity,
  Calendar,
  Newspaper,
  BookOpen,
  GitBranch,
  Settings,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

interface EngineStatus {
  name: string;
  status: "online" | "offline" | "warning";
}

const engines: EngineStatus[] = [
  { name: "Structure Engine", status: "online" },
  { name: "Liquidity Engine", status: "online" },
  { name: "FVG Engine", status: "online" },
  { name: "MSS Engine", status: "online" },
  { name: "News Filter", status: "online" },
  { name: "Probability Engine", status: "online" },
  { name: "WebSocket Feed", status: "online" },
];

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", id: "dashboard" },
  { icon: TrendingUp, label: "Markets", id: "markets" },
  { icon: Star, label: "Watchlist", id: "watchlist" },
  { icon: Zap, label: "AI Signals", id: "signals" },
  { icon: BarChart3, label: "Multi-Chart", id: "multichart" },
  { icon: RefreshCcw, label: "Backtesting", id: "backtesting" },
  { icon: Shield, label: "Risk Manager", id: "risk" },
  { icon: Activity, label: "Performance", id: "performance" },
  { icon: Calendar, label: "Calendar", id: "calendar" },
  { icon: Newspaper, label: "News", id: "news" },
  { icon: BookOpen, label: "Journal", id: "journal" },
  { icon: GitBranch, label: "Strategy Builder", id: "strategy" },
  { icon: Settings, label: "Settings", id: "settings" },
];

interface LeftSidebarProps {
  activeNav: string;
  onNavChange: (id: string) => void;
}

export default function LeftSidebar({ activeNav, onNavChange }: LeftSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`h-full flex flex-col bg-[#0a0e17] border-r border-[#1e2d3d] transition-all duration-200 shrink-0 ${
      collapsed ? "w-[42px]" : "w-[200px]"
    }`}>
      {/* Nav Items */}
      <div className="flex-1 overflow-y-auto py-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeNav === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavChange(item.id)}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-[10px] transition-all border-l-2 ${
                isActive
                  ? "text-[#06b6d4] bg-[#06b6d4]/6 border-l-[#06b6d4]"
                  : "text-[#64748b] hover:text-[#e2e8f0] hover:bg-[#111d2e]/50 border-l-transparent"
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-[#06b6d4]" : ""}`} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div className="border-t border-[#1e2d3d] my-1" />

      {/* Engine Indicators */}
      {!collapsed && (
        <div className="px-3 py-2">
          <div className="text-[8px] text-[#475569] tracking-[0.12em] mb-2 uppercase font-semibold">
            Engine Status
          </div>
          <div className="space-y-1">
            {engines.map((engine) => (
              <div key={engine.name} className="flex items-center justify-between">
                <span className="text-[9px] text-[#64748b]">{engine.name}</span>
                <span className={`status-dot ${engine.status}`} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Collapse toggle */}
      {collapsed && (
        <div className="px-2 py-2">
          <div className="space-y-1.5 flex flex-col items-center">
            {engines.map((engine) => (
              <div key={engine.name} title={engine.name}>
                <span className={`status-dot ${engine.status}`} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Collapse button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full py-2 border-t border-[#1e2d3d] flex items-center justify-center text-[#64748b] hover:text-[#e2e8f0] hover:bg-[#111d2e]/50 transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="w-3.5 h-3.5" />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  );
}
