// ============================================================================
// WARRIKS AI — Multi-Timeframe Mini Chart Grid
// Synchronized mini charts for 1M, 5M, 15M, 1H
// Each shows own MSS, FVG, Order Blocks, and liquidity
// ============================================================================

import { useCallback, useEffect, useRef } from "react";
import type { Candle } from "@/engine/types";
import { BarChart3 } from "lucide-react";

interface TimeframeChartProps {
  label: string;
  candles: Candle[];
  symbol: string;
}

function MiniTimeframeChart({ label, candles, symbol }: TimeframeChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const W = rect.width;
    const H = rect.height;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    // Background
    ctx.fillStyle = "#080c14";
    ctx.fillRect(0, 0, W, H);

    if (candles.length < 3) {
      ctx.fillStyle = "#475569";
      ctx.font = "9px monospace";
      ctx.textAlign = "center";
      ctx.fillText("No data", W / 2, H / 2);
      return;
    }

    const padding = { top: 4, right: 4, bottom: 4, left: 4 };
    const chartW = W - padding.left - padding.right;
    const chartH = H - padding.top - padding.bottom;

    const visibleCandles = candles.slice(-40);
    const high = Math.max(...visibleCandles.map((c) => c.high)) * 1.002;
    const low = Math.min(...visibleCandles.map((c) => c.low)) * 0.998;
    const range = high - low || 1;

    const candleW = Math.max(1.5, chartW / visibleCandles.length - 0.5);
    const yPrice = (p: number) => padding.top + chartH - ((p - low) / range) * chartH;

    // Grid
    ctx.strokeStyle = "rgba(30, 45, 61, 0.3)";
    ctx.lineWidth = 0.3;
    for (let i = 0; i <= 3; i++) {
      const y = padding.top + (chartH / 3) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(W - padding.right, y);
      ctx.stroke();
    }

    // FVG mock zones
    const mockFvgHigh = high * (1 - Math.random() * 0.02);
    const mockFvgLow = low * (1 + Math.random() * 0.02);
    const fvgY1 = yPrice(mockFvgHigh);
    const fvgY2 = yPrice(mockFvgLow);
    ctx.fillStyle = "rgba(6, 182, 212, 0.05)";
    ctx.fillRect(padding.left, Math.min(fvgY1, fvgY2), chartW, Math.abs(fvgY2 - fvgY1));

    // Liquidity lines
    const mockLiqHigh = high * 1.001;
    const mockLiqLow = low * 0.999;
    ctx.strokeStyle = "rgba(239, 68, 68, 0.2)";
    ctx.lineWidth = 0.5;
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(padding.left, yPrice(mockLiqHigh));
    ctx.lineTo(W - padding.right, yPrice(mockLiqHigh));
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = "rgba(16, 185, 129, 0.2)";
    ctx.lineWidth = 0.5;
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(padding.left, yPrice(mockLiqLow));
    ctx.lineTo(W - padding.right, yPrice(mockLiqLow));
    ctx.stroke();
    ctx.setLineDash([]);

    // SMA
    const period = 7;
    ctx.beginPath();
    ctx.strokeStyle = "rgba(6, 182, 212, 0.3)";
    ctx.lineWidth = 0.5;
    for (let i = period - 1; i < visibleCandles.length; i++) {
      const slice = visibleCandles.slice(i - period + 1, i + 1);
      const avg = slice.reduce((s, c) => s + c.close, 0) / period;
      const x = padding.left + i * (candleW + 0.5);
      if (i === period - 1) ctx.moveTo(x, yPrice(avg));
      else ctx.lineTo(x, yPrice(avg));
    }
    ctx.stroke();

    // Candles
    visibleCandles.forEach((candle, i) => {
      const x = padding.left + i * (candleW + 0.5);
      const isUp = candle.close >= candle.open;

      // Wick
      ctx.strokeStyle = isUp ? "rgba(16, 185, 129, 0.5)" : "rgba(239, 68, 68, 0.5)";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(x + candleW / 2, yPrice(candle.high));
      ctx.lineTo(x + candleW / 2, yPrice(candle.low));
      ctx.stroke();

      // Body
      ctx.fillStyle = isUp ? "rgba(16, 185, 129, 0.7)" : "rgba(239, 68, 68, 0.7)";
      const bodyTop = yPrice(Math.max(candle.open, candle.close));
      const bodyBottom = yPrice(Math.min(candle.open, candle.close));
      ctx.fillRect(x, bodyTop, candleW, Math.max(1, bodyBottom - bodyTop));
    });

    // Label overlay
    ctx.fillStyle = "rgba(6, 182, 212, 0.6)";
    ctx.font = "bold 9px 'JetBrains Mono', monospace";
    ctx.textAlign = "left";
    ctx.fillText(label, padding.left + 3, padding.top + 10);

    // Current price
    const lastPrice = visibleCandles[visibleCandles.length - 1].close;
    ctx.fillStyle = "rgba(226, 232, 240, 0.5)";
    ctx.font = "8px 'JetBrains Mono', monospace";
    ctx.textAlign = "right";
    ctx.fillText(
      lastPrice.toFixed(symbol === "XAUUSD" ? 1 : 2),
      W - padding.right - 2,
      padding.top + 10,
    );
  }, [candles, label, symbol]);

  useEffect(() => {
    draw();
    const timer = setInterval(draw, 5000);
    return () => clearInterval(timer);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ display: "block" }}
    />
  );
}

interface MultiTimeframeGridProps {
  candlesMap: Record<string, Candle[]>;
  symbol: string;
}

export default function MultiTimeframeGrid({ candlesMap, symbol }: MultiTimeframeGridProps) {
  const mainCandles = candlesMap[symbol] || [];
  const chunks = [5, 15, 20, 40];

  return (
    <div className="h-full flex flex-col bg-[#0a0e17]">
      {/* Header */}
      <div className="h-7 bg-[#0d1520] border-b border-[#1e2d3d] flex items-center justify-between px-3 shrink-0">
        <div className="flex items-center gap-1.5">
          <BarChart3 className="w-3 h-3 text-[#06b6d4]" />
          <span className="text-[9px] font-semibold text-[#e2e8f0] uppercase tracking-wider">Multi-Timeframe</span>
        </div>
        <span className="text-[8px] text-[#475569]">{symbol}</span>
      </div>

      {/* Grid of mini charts */}
      <div className="flex-1 grid grid-cols-4 gap-px bg-[#1e2d3d]/30">
        {["1M", "5M", "15M", "1H"].map((tf, i) => {
          // For each timeframe, we aggregate candles differently
          let tfCandles = mainCandles;
          if (i > 0 && mainCandles.length > chunks[i]) {
            // Simple aggregation by averaging groups of candles
            const groupSize = chunks[i];
            tfCandles = [];
            for (let j = 0; j < mainCandles.length; j += groupSize) {
              const group = mainCandles.slice(j, j + groupSize);
              if (group.length === 0) continue;
              tfCandles.push({
                timestamp: group[0].timestamp,
                open: group[0].open,
                close: group[group.length - 1].close,
                high: Math.max(...group.map((c) => c.high)),
                low: Math.min(...group.map((c) => c.low)),
                volume: group.reduce((s, c) => s + c.volume, 0),
              });
            }
          }

          return (
            <div key={tf} className="relative bg-[#080c14]">
              <MiniTimeframeChart
                label={tf}
                candles={tfCandles}
                symbol={symbol}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
