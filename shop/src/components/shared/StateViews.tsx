import React from "react";
import { cn } from "@/lib/utils";
import { FolderX } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  action,
  icon = <FolderX className="w-10 h-10 text-slate-400 stroke-1" />,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-12 text-center bg-white border border-dashed border-slate-200 rounded-md my-4",
        className
      )}
    >
      <div className="mb-3">{icon}</div>
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      {description && (
        <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 5,
  cols = 5,
}) => {
  return (
    <div className="w-full bg-white border border-slate-200 rounded-md overflow-hidden animate-pulse">
      <div className="h-10 bg-slate-100 border-b border-slate-200 flex items-center px-4 gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-4 bg-slate-200 rounded flex-1" />
        ))}
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="h-12 flex items-center px-4 gap-4">
            {Array.from({ length: cols }).map((_, c) => (
              <div
                key={c}
                className="h-4 bg-slate-100 rounded"
                style={{ width: `${60 + ((r * 13 + c * 17) % 35)}%` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white border border-slate-200 rounded-md p-5 animate-pulse flex flex-col justify-between h-28"
        >
          <div className="h-3.5 bg-slate-200 rounded w-1/3" />
          <div className="h-7 bg-slate-200 rounded w-2/3 mt-2" />
          <div className="h-3 bg-slate-100 rounded w-1/2 mt-2" />
        </div>
      ))}
    </div>
  );
};
