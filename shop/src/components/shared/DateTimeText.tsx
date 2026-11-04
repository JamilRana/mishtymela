import React from "react";
import { cn } from "@/lib/utils";
import { formatDhakaDateBangla } from "@/lib/bangla-numbers";

interface DateTimeTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  date: Date | string;
  showTime?: boolean;
  lang?: "bn" | "en";
}

export function formatDhakaDate(
  date: Date | string,
  showTime: boolean = true,
  lang: "bn" | "en" = "bn"
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";

  if (lang === "bn") {
    return formatDhakaDateBangla(d, showTime);
  }

  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dhaka",
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(showTime && {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
  }).format(d);
}

export const DateTimeText: React.FC<DateTimeTextProps> = ({
  date,
  showTime = true,
  lang = "bn",
  className,
  ...props
}) => {
  return (
    <span className={cn("text-slate-600 tabular-nums text-xs", className)} {...props}>
      {formatDhakaDate(date, showTime, lang)}
    </span>
  );
};
