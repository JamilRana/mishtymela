import React from "react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
  withBeam?: boolean; // kept so existing callers compile; the effect was removed on purpose
}

export const KpiCard: React.FC<KpiCardProps> = ({ label, value, subtitle, icon, badge, className }) => (
  <div className={cn("bg-surface border border-slate-200 rounded-lg p-4 flex flex-col gap-1", className)}>
    <div className="flex items-center justify-between gap-2 text-slate-600">
      <span className="text-sm">{label}</span>
      {icon && <span className="shrink-0 [&_svg]:w-4 [&_svg]:h-4">{icon}</span>}
    </div>
    <div className="flex items-baseline justify-between gap-2">
      <div className="text-xl font-semibold text-slate-900 tabular-nums">{value}</div>
      {badge}
    </div>
    {subtitle && <div className="text-xs text-slate-600 flex items-center gap-1.5">{subtitle}</div>}
  </div>
);
