import React from "react";
import { cn } from "@/lib/utils";
import { toBnDigits } from "@/lib/bangla-numbers";

interface MoneyTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  amount: number | string | { toString(): string };
  negative?: boolean;
  lang?: "bn" | "en";
}

export function formatMoney(
  val: number | string | { toString(): string },
  lang: "bn" | "en" = "bn"
): string {
  const num = typeof val === "number" ? val : parseFloat(val?.toString() || "0");
  if (isNaN(num)) return lang === "bn" ? "৳ ০.০০" : "৳ 0.00";
  
  const formattedEn = new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .format(num)
    .replace("BDT", "৳");

  if (lang === "bn") {
    return toBnDigits(formattedEn);
  }
  return formattedEn;
}

export const MoneyText: React.FC<MoneyTextProps> = ({
  amount,
  negative,
  lang = "bn",
  className,
  ...props
}) => {
  const num = typeof amount === "number" ? amount : parseFloat(amount?.toString() || "0");
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
      {formatMoney(amount, lang)}
    </span>
  );
};
