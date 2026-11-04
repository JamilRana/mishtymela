import React from "react";
import { cn } from "@/lib/utils";

export const Skeleton: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-slate-200/80", className)}
      {...props}
    />
  );
};

export const KpiCardSkeleton: React.FC = () => {
  return (
    <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-xs space-y-3">
      <Skeleton className="h-3 w-24" />
      <div className="flex items-baseline justify-between">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-12" />
      </div>
      <Skeleton className="h-2.5 w-20" />
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 5,
  cols = 5,
}) => {
  return (
    <div className="w-full bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-48" />
      </div>
      <div className="divide-y divide-slate-100">
        <div className="px-4 py-3 bg-slate-50 flex gap-4">
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} className="h-3 flex-1" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="px-4 py-3.5 flex items-center gap-4">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton
                key={c}
                className={cn(
                  "h-4 flex-1",
                  c === 0 && "w-1/3",
                  c === cols - 1 && "w-16"
                )}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
