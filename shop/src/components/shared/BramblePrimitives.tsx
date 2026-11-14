"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { toBnDigits } from "@/lib/bangla-numbers";

// ============================================================================
// 1. Stock Indicator Tube (Mini Glass Cylinder with Liquid Wave & Threshold)
// ============================================================================
export interface BrambleStockTubeProps {
  stock: number;
  reorderLevel: number;
  maxCapacity?: number;
  name?: string;
  className?: string;
  isBn?: boolean;
}

export function BrambleStockTube({
  stock,
  reorderLevel,
  maxCapacity,
  name,
  className = "",
  isBn = true,
}: BrambleStockTubeProps) {
  const max = Math.max(stock, reorderLevel * 2, maxCapacity || 10, 1);
  const fillPct = Math.min(100, Math.max(0, (stock / max) * 100));
  const markPct = Math.min(100, Math.max(0, (reorderLevel / max) * 100));
  const status = stock <= 0 ? "out" : stock <= reorderLevel ? "low" : "";

  const label = isBn
    ? `${name || "মজুদ"}: ${toBnDigits(stock)} অবশিষ্ট (পুনরায় অর্ডার সীমা ${toBnDigits(reorderLevel)})`
    : `${name || "Stock"}: ${stock} in stock (reorder at ${reorderLevel})`;

  return (
    <div
      className={`tube ${status} ${className}`}
      role="meter"
      aria-label={label}
      aria-valuenow={stock}
      aria-valuemin={0}
      aria-valuemax={max}
      title={label}
      style={
        {
          "--f": `${fillPct.toFixed(1)}%`,
          "--r": `${markPct.toFixed(1)}%`,
        } as React.CSSProperties
      }
    >
      <span className="tube-liquid">
        <i className="tube-wave" />
      </span>
      <span className="tube-mark" title={isBn ? "পুনরায় অর্ডার সীমা" : "Reorder threshold"} />
    </div>
  );
}

// ============================================================================
// 2. Product Swatch (Vibrant Radial Squircle with Dynamic Hue Glow)
// ============================================================================
export interface BrambleSwatchProps {
  hue?: number;
  icon?: React.ReactNode;
  category?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function BrambleSwatch({
  hue = 245,
  icon,
  category,
  className = "",
  size = "lg",
}: BrambleSwatchProps) {
  const sizeClasses = {
    sm: "w-10 h-10 rounded-xl text-xs",
    md: "w-14 h-14 rounded-2xl text-sm",
    lg: "w-[84px] h-[84px] rounded-[20px] text-base",
  }[size];

  // Default sweet glyphs by category
  const renderGlyph = () => {
    if (icon) return icon;
    const cat = (category || "").toLowerCase();
    if (cat.includes("দই") || cat.includes("curd") || cat.includes("doi")) return "🥣";
    if (cat.includes("চমচম") || cat.includes("chomchom")) return "🍯";
    if (cat.includes("লাড্ডু") || cat.includes("laddu")) return "🟡";
    if (cat.includes("রসমালাই") || cat.includes("rasmalai")) return "✨";
    return "🍬";
  };

  return (
    <div
      className={`swatch ${sizeClasses} ${className}`}
      style={{ "--h": hue } as React.CSSProperties}
      aria-hidden="true"
    >
      <span className="text-2xl select-none filter drop-shadow-sm">{renderGlyph()}</span>
    </div>
  );
}

// ============================================================================
// 3. SVG Sparkline (Smooth Bezier sales trend curve)
// ============================================================================
export interface BrambleSparklineProps {
  data?: number[];
  width?: number;
  height?: number;
  color?: string;
  fill?: boolean;
  className?: string;
}

export function BrambleSparkline({
  data = [12, 19, 14, 25, 22, 30, 28, 35, 42],
  width = 76,
  height = 24,
  color = "currentColor",
  fill = false,
  className = "",
}: BrambleSparklineProps) {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 2;
  const h = height - padding * 2;

  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - padding - ((val - min) / range) * h;
    return [x, y];
  });

  // Build SVG path with smooth cubic beziers
  let pathD = `M ${points[0][0]},${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];
    const controlX = (current[0] + next[0]) / 2;
    pathD += ` C ${controlX},${current[1]} ${controlX},${next[1]} ${next[0]},${next[1]}`;
  }

  const fillD = fill ? `${pathD} L ${width},${height} L 0,${height} Z` : "";

  return (
    <svg
      className={`overflow-visible ${className}`}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
    >
      {fill && <path d={fillD} fill={color} fillOpacity="0.12" />}
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ============================================================================
// 4. Unified 4-Column Metric Stat Strip (From Screenshot)
// ============================================================================
export interface StatStripItem {
  label: string;
  value: React.ReactNode;
  badge?: {
    text: string;
    isPositive?: boolean;
  };
  sparklineData?: number[];
  sparklineColor?: string;
}

export interface BrambleStatStripProps {
  items: StatStripItem[];
  className?: string;
}

export function BrambleStatStrip({ items, className = "" }: BrambleStatStripProps) {
  return (
    <div className={`stat-strip ${className}`}>
      {items.map((item, idx) => (
        <div key={idx} className="flex flex-col justify-between gap-2">
          <span className="text-xs font-medium text-[var(--ink-3)]">{item.label}</span>
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-2xl font-bold tracking-tight text-[var(--ink)] tabular-nums">
              {item.value}
            </span>
            {item.sparklineData && (
              <BrambleSparkline
                data={item.sparklineData}
                width={70}
                height={22}
                color={item.sparklineColor || "#0a93c4"}
              />
            )}
          </div>
          {item.badge && (
            <div className="flex items-center gap-1.5 pt-0.5">
              <span
                className={`bramble-tag ${
                  item.badge.isPositive !== false ? "good" : "bad"
                } text-[11px] font-semibold py-0.5 px-1.5`}
              >
                {item.badge.text}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// 5. Goal Progress Radial Gauge (From Screenshot "November Goal")
// ============================================================================
export interface BrambleGoalRingProps {
  title?: string;
  subtitle?: string;
  percentage: number; // e.g. 84
  targetText?: string; // e.g. "৳ ৪২,০০০"
  facts?: Array<{ label: string; value: string }>;
  className?: string;
}

export function BrambleGoalRing({
  title = "মাসিক লক্ষ্য",
  subtitle = "১৬ দিন বাকি",
  percentage = 84,
  targetText = "৪২,০০০",
  facts = [
    { label: "বুকড বিক্রয়", value: "৳ ৩৫,২৯৮" },
    { label: "দৈনিক প্রয়োজন", value: "৳ ৩৯৪" },
    { label: "প্রজেক্টেড মোট", value: "৳ ৭৭,০১৩" },
  ],
  className = "",
}: BrambleGoalRingProps) {
  // Arc parameters for semi-circle
  const cx = 90;
  const cy = 95;
  const radius = 68;
  const strokeWidth = 10;
  const circumference = Math.PI * radius; // 180 degree semi-circle
  const progress = Math.min(100, Math.max(0, percentage));
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // Calculate coordinates for the glowing end-point indicator
  const progressAngle = Math.PI * (1 - progress / 100);
  const dotX = cx + radius * Math.cos(progressAngle);
  const dotY = cy - radius * Math.sin(progressAngle);

  return (
    <div className={`bramble-card p-6 flex flex-col justify-between ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-2">
        <div>
          <h3 className="text-base font-semibold text-[var(--ink)] tracking-tight">{title}</h3>
          <p className="text-xs text-[var(--ink-3)] mt-0.5">{subtitle}</p>
        </div>
        <button
          type="button"
          aria-label="Edit Goal"
          className="p-1 rounded-lg text-[var(--ink-3)] hover:text-[var(--ink)] hover:bg-[var(--well)] transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
      </div>

      {/* Radial Arc Gauge */}
      <div className="flex flex-col items-center justify-center my-4 relative">
        <svg width="180" height="110" viewBox="0 0 180 110" className="overflow-visible">
          <defs>
            <linearGradient id="goalGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#5b48f0" />
              <stop offset="100%" stopColor="#0a93c4" />
            </linearGradient>
            <filter id="goalGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#0a93c4" floodOpacity="0.75" />
            </filter>
          </defs>

          {/* Background Track Arc */}
          <path
            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            fill="none"
            stroke="var(--rule-strong)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Needle tick mark at 50% target milestone */}
          <line
            x1={cx}
            y1={cy - radius - 6}
            x2={cx}
            y2={cy - radius + 6}
            stroke="var(--ink)"
            strokeWidth={2}
            strokeLinecap="round"
          />

          {/* Progress Arc */}
          <path
            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            fill="none"
            stroke="url(#goalGradient)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />

          {/* Glowing End Indicator Dot */}
          {progress > 2 && (
            <circle
              cx={dotX}
              cy={dotY}
              r={strokeWidth / 2 + 1}
              fill="#ffffff"
              stroke="#0a93c4"
              strokeWidth={2.5}
              filter="url(#goalGlow)"
              className="transition-all duration-1000 ease-out"
            />
          )}
        </svg>

        {/* Center Percentage Text */}
        <div className="absolute top-[40px] text-center">
          <div className="text-3xl font-extrabold text-[var(--ink)] tracking-tight tabular-nums">
            {toBnDigits(progress)}%
          </div>
          <div className="text-xs text-[var(--ink-3)] font-medium">
            মোট {targetText} এর মধ্যে
          </div>
        </div>
      </div>

      {/* Breakdown Facts */}
      <div className="space-y-2.5 pt-3 border-t border-[var(--rule)]">
        {facts.map((fact, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <span className="text-[var(--ink-3)]">{fact.label}</span>
            <span className="font-semibold text-[var(--ink)] tabular-nums">{fact.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// 6. Ambient Background Stage with Multi-color Light Shafts
// ============================================================================
export function BrambleStage() {
  return (
    <div className="stage" aria-hidden="true">
      <span className="ray r1" />
      <span className="ray r2" />
      <span className="ray r3" />
      <span className="floor" />
    </div>
  );
}

// ============================================================================
// 7. Bramble Theme Switcher (Light / Dark)
// ============================================================================
export function BrambleThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("bramble-theme");
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const initial = saved === "dark" || (!saved && prefersDark) ? "dark" : "light";
      setTheme(initial);
      document.documentElement.dataset.theme = initial;
      if (initial === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } catch {
      // ignore
    }

    const handleSync = () => {
      const current = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
      setTheme(current);
    };

    window.addEventListener("themechange", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("themechange", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    try {
      localStorage.setItem("bramble-theme", next);
      document.documentElement.dataset.theme = next;
      if (next === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      window.dispatchEvent(new Event("themechange"));
    } catch {
      // ignore
    }
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`p-2 rounded-xl text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--hover)] transition-colors ${className}`}
      title={theme === "light" ? "ডার্ক মোড চালু করুন" : "লাইট মোড চালু করুন"}
      aria-label="Toggle theme"
    >
      {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
    </button>
  );
}
