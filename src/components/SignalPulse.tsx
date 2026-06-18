// ============================================================================
// WARRIKS AI — SignalPulse Animated Indicator
// Displays pulsing ring animations for active signals, confidence scores,
// and live feed status indicators throughout the trading terminal
// ============================================================================

import { type ReactNode } from "react";
import { motion } from "framer-motion";

type PulseColor = "green" | "red" | "cyan" | "gold" | "neutral";
type PulseSize = "sm" | "md" | "lg" | "xl";

interface SignalPulseProps {
  /** Color theme for the pulse */
  color?: PulseColor;
  /** Size variant */
  size?: PulseSize;
  /** Whether the pulse is active/animating */
  active?: boolean;
  /** Optional label shown next to the pulse */
  label?: string;
  /** Optional percentage/confidence value */
  value?: number;
  /** Optional children rendered inside the pulse container */
  children?: ReactNode;
  /** Additional class names */
  className?: string;
}

const COLOR_MAP: Record<PulseColor, { ring: string; glow: string; bg: string; text: string }> = {
  green: {
    ring: "rgba(16, 185, 129, 0.25)",
    glow: "rgba(16, 185, 129, 0.08)",
    bg: "rgba(16, 185, 129, 0.12)",
    text: "text-[#10b981]",
  },
  red: {
    ring: "rgba(239, 68, 68, 0.25)",
    glow: "rgba(239, 68, 68, 0.08)",
    bg: "rgba(239, 68, 68, 0.12)",
    text: "text-[#ef4444]",
  },
  cyan: {
    ring: "rgba(6, 182, 212, 0.25)",
    glow: "rgba(6, 182, 212, 0.08)",
    bg: "rgba(6, 182, 212, 0.12)",
    text: "text-[#06b6d4]",
  },
  gold: {
    ring: "rgba(245, 158, 11, 0.25)",
    glow: "rgba(245, 158, 11, 0.08)",
    bg: "rgba(245, 158, 11, 0.12)",
    text: "text-[#f59e0b]",
  },
  neutral: {
    ring: "rgba(100, 116, 139, 0.15)",
    glow: "rgba(100, 116, 139, 0.05)",
    bg: "rgba(100, 116, 139, 0.08)",
    text: "text-[#64748b]",
  },
};

const SIZE_MAP: Record<PulseSize, { outer: number; inner: number; ringSize: number }> = {
  sm: { outer: 18, inner: 6, ringSize: 4 },
  md: { outer: 24, inner: 8, ringSize: 5 },
  lg: { outer: 32, inner: 10, ringSize: 6 },
  xl: { outer: 44, inner: 12, ringSize: 8 },
};

/**
 * SignalPulse — A composable animated pulse indicator.
 *
 * Variants:
 * - <SignalPulse.Pulse /> — Standalone pulsing dot with rings
 * - <SignalPulse.Badge /> — Confidence badge with subtle pulse
 * - <SignalPulse.Bar /> — Animated progress bar with glow
 * - <SignalPulse.LiveDot /> — Small live indicator dot
 */
export default function SignalPulse({
  color = "cyan",
  size = "md",
  active = true,
  label,
  value,
  children,
  className = "",
}: SignalPulseProps) {
  const colors = COLOR_MAP[color];
  const dims = SIZE_MAP[size];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Pulse ring */}
      <div className="relative flex items-center justify-center shrink-0" style={{ width: dims.outer, height: dims.outer }}>
        {active && (
          <>
            <motion.div
              className="absolute rounded-full"
              style={{
                width: dims.outer,
                height: dims.outer,
                border: `${dims.ringSize * 0.4}px solid ${colors.ring}`,
              }}
              animate={{ scale: [1, 1.35, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute rounded-full"
              style={{
                width: dims.outer * 0.8,
                height: dims.outer * 0.8,
                border: `${dims.ringSize * 0.3}px solid ${colors.ring}`,
              }}
              animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.3, 0.1, 0.3] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            />
          </>
        )}
        <motion.div
          className="rounded-full"
          style={{
            width: dims.inner,
            height: dims.inner,
            background: colors.bg,
            boxShadow: active ? `0 0 6px ${colors.glow}` : "none",
          }}
          animate={active ? { scale: [1, 1.15, 1], opacity: [0.8, 1, 0.8] } : {}}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Label + Value */}
      {label && (
        <div className="flex flex-col">
          <span className={`text-[9px] font-medium ${colors.text}`}>
            {label}
          </span>
          {value !== undefined && (
            <span className="text-[11px] font-bold trading-mono text-[#e2e8f0]">
              {value}%
            </span>
          )}
        </div>
      )}

      {children}
    </div>
  );
}

/**
 * Confidence Badge — Shows a pulsing confidence score with color coding.
 */
SignalPulse.Badge = function ConfidenceBadge({
  value,
  size = "sm",
}: {
  value: number;
  size?: PulseSize;
}) {
  const color: PulseColor = value >= 85 ? "green" : value >= 75 ? "gold" : "neutral";
  const dims = SIZE_MAP[size];
  const colors = COLOR_MAP[color];

  return (
    <motion.div
      className="relative inline-flex items-center justify-center rounded-sm font-bold trading-mono cursor-default"
      style={{
        minWidth: dims.outer + 8,
        height: dims.outer + 4,
        background: colors.bg,
        border: `1px solid ${colors.ring}`,
        boxShadow: value >= 85 ? `0 0 8px ${colors.glow}` : "none",
      }}
      animate={value >= 85 ? {
        boxShadow: [
          `0 0 4px ${colors.glow}`,
          `0 0 12px ${colors.glow}`,
          `0 0 4px ${colors.glow}`,
        ],
      } : {}}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    >
      <span className={`text-[10px] ${colors.text}`}>{value}%</span>
      {value >= 85 && (
        <motion.span
          className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full"
          style={{ background: colors.ring }}
          animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0.1, 0.6] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
};

/**
 * Animated Progress Bar — A slim glowing bar for confidence/confluence display.
 */
SignalPulse.Bar = function AnimatedBar({
  value,
  color = "green",
  height = 2,
}: {
  value: number;
  color?: PulseColor;
  height?: number;
}) {
  const colors = COLOR_MAP[color];

  return (
    <div className="w-full relative overflow-hidden" style={{ height }}>
      {/* Background */}
      <div className="absolute inset-0 bg-[#111d2e]" />
      {/* Fill */}
      <motion.div
        className="absolute inset-y-0 left-0"
        style={{
          width: `${value}%`,
          background: `linear-gradient(90deg, ${colors.ring.replace("0.25", "0.6")}, ${colors.ring.replace("0.25", "0.9")})`,
          boxShadow: value > 0 ? `0 0 6px ${colors.glow}` : "none",
        }}
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
      {/* Pulse shimmer overlay */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${colors.glow} 50%, transparent 100%)`,
          backgroundSize: "200% 100%",
        }}
        animate={{ backgroundPosition: ["200% 0", "-200% 0"] }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
};

/**
 * LiveDot — A small always-on indicator, used in status bars and headers.
 */
SignalPulse.LiveDot = function LiveDot({
  color = "green",
  label,
}: {
  color?: PulseColor;
  label?: string;
}) {
  const colors = COLOR_MAP[color];

  return (
    <div className="flex items-center gap-1.5">
      <motion.span
        className="rounded-full"
        style={{
          width: 5,
          height: 5,
          background: colors.ring.replace("0.25", "1"),
          boxShadow: `0 0 6px ${colors.glow}`,
        }}
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      {label && <span className="text-[9px] text-[#64748b]">{label}</span>}
    </div>
  );
};
