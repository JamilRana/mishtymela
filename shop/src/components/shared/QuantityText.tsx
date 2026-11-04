import React from "react";
import { cn } from "@/lib/utils";

interface QuantityTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  quantity: number | string | { toString(): string };
  unit?: string;
}

export function formatQuantity(val: number | string | { toString(): string }, unit: string = "pcs"): string {
  const num = typeof val === "number" ? val : parseFloat(val.toString() || "0");
  if (isNaN(num)) return `0 ${unit}`;
  // If unit is pcs or discrete, format as integer if no decimal
  const isDiscrete = ["pcs", "piece", "pieces", "item", "box"].includes(unit.toLowerCase());
  const formatted = isDiscrete && Number.isInteger(num)
    ? num.toString()
    : num.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 3 });
  return `${formatted} ${unit}`;
}

export const QuantityText: React.FC<QuantityTextProps> = ({
  quantity,
  unit = "pcs",
  className,
  ...props
}) => {
  return (
    <span className={cn("tabular-nums text-slate-800", className)} {...props}>
      {formatQuantity(quantity, unit)}
    </span>
  );
};
