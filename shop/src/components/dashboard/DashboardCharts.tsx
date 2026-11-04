"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { formatMoney } from "@/components/shared/MoneyText";

interface SalesChartProps {
  data: Array<{ day: string; revenue: number; orders: number }>;
}

export const SalesTrendChart: React.FC<SalesChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-slate-400">
        No sales recorded in this period
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis
            dataKey="day"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#64748b", fontSize: 11 }}
            tickFormatter={(val) => {
              const parts = val.split("-");
              return `${parts[2]}/${parts[1]}`;
            }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#64748b", fontSize: 11 }}
            tickFormatter={(val) => `৳${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                return (
                  <div className="bg-slate-900 text-white p-2.5 rounded-md shadow-md text-xs">
                    <p className="font-medium text-slate-300">{item.day}</p>
                    <p className="font-semibold text-white mt-1">
                      Revenue: {formatMoney(item.revenue)}
                    </p>
                    <p className="text-slate-400">Orders: {item.orders}</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
