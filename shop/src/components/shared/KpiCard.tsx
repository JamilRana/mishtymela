import React from "react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  subtitle,
  icon,
  badge,
  className,
}) => {
  return (
    <div
      className={cn(
        "bg-surface border border-slate-200 rounded-md p-5 flex flex-col justify-between hover:border-slate-300 transition-colors",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</span>
        {icon && <div className="text-slate-400">{icon}</div>}
      </div>
      <div className="mt-3 flex items-baseline justify-between">
        <div className="text-2xl font-semibold text-slate-900 tabular-nums tracking-tight">
          {value}
        </div>
        {badge}
      </div>
      {subtitle && (
        <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
          {subtitle}
        </div>
      )}
    </div>
  );
};
