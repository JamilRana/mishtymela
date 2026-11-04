import React from "react";
import { cn } from "@/lib/utils";

interface MoneyTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  amount: number | string | { toString(): string };
  negative?: boolean;
}

export function formatMoney(val: number | string | { toString(): string }): string {
  const num = typeof val === "number" ? val : parseFloat(val.toString() || "0");
  if (isNaN(num)) return "৳ 0.00";
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .format(num)
    .replace("BDT", "৳");
}

export const MoneyText: React.FC<MoneyTextProps> = ({
  amount,
  negative,
  className,
  ...props
}) => {
  const num = typeof amount === "number" ? amount : parseFloat(amount.toString() || "0");
  const isNeg = negative || num < 0;

  return (
    <span
      className={cn(
        "tabular-nums font-medium text-slate-900 inline-block text-right",
        isNeg && "text-danger",
        className
      )}
      {...props}
    >
      {formatMoney(amount)}
    </span>
  );
};
