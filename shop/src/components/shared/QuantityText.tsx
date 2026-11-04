import React from "react";
import { cn } from "@/lib/utils";
import { toBnDigits, formatUnitBangla } from "@/lib/bangla-numbers";

interface QuantityTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  quantity: number | string | { toString(): string };
  unit?: string;
  lang?: "bn" | "en";
}

export function formatQuantity(
  val: number | string | { toString(): string },
  unit: string = "pcs",
  lang: "bn" | "en" = "bn"
): string {
  const num = typeof val === "number" ? val : parseFloat(val?.toString() || "0");
  if (isNaN(num)) return lang === "bn" ? `০ ${formatUnitBangla(unit)}` : `0 ${unit}`;
  
  // If unit is pcs or discrete, format as integer if no decimal
  const isDiscrete = ["pcs", "piece", "pieces", "item", "box"].includes(unit.toLowerCase());
  const formatted = isDiscrete && Number.isInteger(num)
    ? num.toString()
    : num.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 3 });

  if (lang === "bn") {
    return `${toBnDigits(formatted)} ${formatUnitBangla(unit)}`;
  }
  return `${formatted} ${unit}`;
}

export const QuantityText: React.FC<QuantityTextProps> = ({
  quantity,
  unit = "pcs",
  lang = "bn",
  className,
  ...props
}) => {
  return (
    <span className={cn("tabular-nums text-slate-800", className)} {...props}>
      {formatQuantity(quantity, unit, lang)}
    </span>
  );
};
