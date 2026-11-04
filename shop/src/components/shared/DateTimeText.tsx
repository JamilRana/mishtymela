import React from "react";
import { cn } from "@/lib/utils";

interface DateTimeTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  date: Date | string;
  showTime?: boolean;
}

export function formatDhakaDate(date: Date | string, showTime: boolean = true): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";

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
  className,
  ...props
}) => {
  return (
    <span className={cn("text-slate-600 tabular-nums text-xs", className)} {...props}>
      {formatDhakaDate(date, showTime)}
    </span>
  );
};
