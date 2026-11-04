import React from "react";
import { cn } from "@/lib/utils";

export type BadgeType =
  | "completed"
  | "void"
  | "paid"
  | "due"
  | "in_stock"
  | "low_stock"
  | "out_of_stock"
  | "income"
  | "expense";

interface StatusBadgeProps {
  type: BadgeType;
  label?: string;
  className?: string;
}

const BADGE_CONFIG: Record<
  BadgeType,
  { defaultLabel: string; bg: string; text: string; border: string }
> = {
  completed: {
    defaultLabel: "Completed",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
  void: {
    defaultLabel: "Void",
    bg: "bg-slate-100",
    text: "text-slate-500 line-through",
    border: "border-slate-300",
  },
  paid: {
    defaultLabel: "Paid",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
  due: {
    defaultLabel: "Due",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  in_stock: {
    defaultLabel: "In Stock",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
  low_stock: {
    defaultLabel: "Low Stock",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  out_of_stock: {
    defaultLabel: "Out of Stock",
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
  },
  income: {
    defaultLabel: "Income",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  expense: {
    defaultLabel: "Expense",
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-200",
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  type,
  label,
  className,
}) => {
  const conf = BADGE_CONFIG[type];
  if (!conf) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
        conf.bg,
        conf.text,
        conf.border,
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-75" />
      {label ?? conf.defaultLabel}
    </span>
  );
};
