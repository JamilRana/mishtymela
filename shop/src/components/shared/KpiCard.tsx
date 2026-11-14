"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
  withBeam?: boolean;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  subtitle,
  icon,
  badge,
  className,
}) => (
  <div
    className={cn(
      "bramble-card p-4 sm:p-5 flex flex-col justify-between gap-2",
      className
    )}
  >
    <div className="flex items-center justify-between gap-2 text-[var(--ink-3)]">
      <span className="text-xs font-medium">{label}</span>
      {icon && <span className="shrink-0 text-[var(--ink-3)] [&_svg]:w-4 [&_svg]:h-4">{icon}</span>}
    </div>
    <div className="flex items-baseline justify-between gap-2 my-0.5">
      <div className="text-2xl sm:text-3xl font-extrabold text-[var(--ink)] tabular-nums tracking-tight">
        {value}
      </div>
      {badge}
    </div>
    {subtitle && (
      <div className="text-xs text-[var(--ink-2)] flex items-center gap-1.5 pt-1 border-t border-[var(--rule)]">
        {subtitle}
      </div>
    )}
  </div>
);
