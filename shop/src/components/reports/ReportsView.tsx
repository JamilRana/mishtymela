"use client";

import React, { useState } from "react";
import {
  Download,
  Calendar,
  BarChart3,
  TrendingUp,
  Boxes,
  Users,
  FileSpreadsheet,
} from "lucide-react";
import { MoneyText, formatMoney } from "@/components/shared/MoneyText";
import { formatDhakaDate } from "@/components/shared/DateTimeText";

interface ReportsDataProps {
  kpis: {
    revenue: number;
    cogs: number;
    grossProfit: number;
    operatingExpenses: number;
    operatingProfit: number;
    orders: number;
    discounts: number;
    stockValue: number;
    receivables: number;
  };
  topProducts: Array<{
    name: string;
    qty: number;
    revenue: number;
    profit: number;
  }>;
  expensesByCategory: Array<{
    category: string;
    amount: number;
  }>;
  salesByDay: Array<{
    day: string;
    revenue: number;
    orders: number;
  }>;
}

export const ReportsView: React.FC<{ data: ReportsDataProps }> = ({ data }) => {
  const { kpis, topProducts, expensesByCategory, salesByDay } = data;

  const exportCsv = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.map(val => `"${val}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPL = () => {
    exportCsv(
      "profit-and-loss",
      ["Metric", "Amount (BDT)"],
      [
        ["Gross Revenue", kpis.revenue],
        ["Cost of Goods Sold (COGS)", kpis.cogs],
        ["Gross Profit", kpis.grossProfit],
        ["Operating Expenses", kpis.operatingExpenses],
        ["Net Operating Profit", kpis.operatingProfit],
        ["Total Discounts Given", kpis.discounts],
        ["Completed Orders Count", kpis.orders],
        ["Current Inventory Valuation", kpis.stockValue],
        ["Outstanding Receivables (Credit Due)", kpis.receivables],
      ]
    );
  };

  const handleExportProducts = () => {
    exportCsv(
      "product-sales-performance",
      ["Product Name", "Quantity Sold", "Gross Revenue (BDT)", "Gross Profit (BDT)"],
      topProducts.map((p) => [p.name, p.qty, p.revenue, p.profit])
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 border border-slate-200 rounded-md">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span>Accounting Period: <strong>Last 30 Days (Dhaka Timezone)</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportPL}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export P&L (CSV)
          </button>
          <button
            onClick={handleExportProducts}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded text-xs font-semibold transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Export Products (CSV)
          </button>
        </div>
      </div>

      {/* Profit & Loss Statement Card */}
      <div className="bg-white border border-slate-200 rounded-md p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Profit & Loss Summary</h2>
            <p className="text-xs text-slate-500">Calculated strictly from itemized cost snapshots & manual expenses</p>
          </div>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded">
            Net Margin: {kpis.revenue > 0 ? ((kpis.operatingProfit / kpis.revenue) * 100).toFixed(1) : 0}%
          </span>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex justify-between py-1 text-slate-700">
            <span>Sales Revenue ({kpis.orders} orders)</span>
            <span className="font-bold text-slate-900"><MoneyText amount={kpis.revenue} /></span>
          </div>

          <div className="flex justify-between py-1 text-slate-600">
            <span>Less: Cost of Goods Sold (COGS snapshot)</span>
            <span className="font-medium text-rose-600">-<MoneyText amount={kpis.cogs} /></span>
          </div>

          <div className="flex justify-between py-2 border-t border-b border-slate-200 font-bold text-sm text-slate-900 bg-slate-50 px-2 rounded">
            <span>Gross Profit</span>
            <span className="text-blue-700"><MoneyText amount={kpis.grossProfit} /></span>
          </div>

          <div className="flex justify-between py-1 text-slate-600">
            <span>Less: Operational Overhead & Expenses</span>
            <span className="font-medium text-rose-600">-<MoneyText amount={kpis.operatingExpenses} /></span>
          </div>

          <div className="flex justify-between py-2.5 border-t-2 border-slate-900 font-bold text-base text-slate-900 bg-emerald-50/50 px-2 rounded">
            <span>Operating Net Profit</span>
            <span className={kpis.operatingProfit >= 0 ? "text-emerald-700" : "text-rose-600"}>
              <MoneyText amount={kpis.operatingProfit} />
            </span>
          </div>
        </div>
      </div>

      {/* Two Column Breakdown: Product Performance & Category Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Products Profitability */}
        <div className="bg-white border border-slate-200 rounded-md p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900">Product Sales & Profitability</h3>
            <span className="text-xs text-slate-400">Top 10 items</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[380px] text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase text-xs tracking-wider font-semibold">
                  <th className="pb-2">Product</th>
                  <th className="pb-2 text-right">Units</th>
                  <th className="pb-2 text-right">Revenue</th>
                  <th className="pb-2 text-right">Gross Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topProducts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400">No sales data</td>
                  </tr>
                ) : (
                  topProducts.map((p, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="py-2.5 font-medium text-slate-800">{p.name}</td>
                      <td className="py-2.5 text-right font-semibold text-slate-600 tabular-nums">{p.qty}</td>
                      <td className="py-2.5 text-right font-bold text-slate-900"><MoneyText amount={p.revenue} /></td>
                      <td className="py-2.5 text-right font-bold text-emerald-600"><MoneyText amount={p.profit} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Expenses by Category */}
        <div className="bg-white border border-slate-200 rounded-md p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900">Expense Allocation</h3>
            <span className="text-xs text-slate-400">By category</span>
          </div>
          <div className="space-y-3">
            {expensesByCategory.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">No operational expenses recorded</p>
            ) : (
              expensesByCategory.map((e, idx) => {
                const pct = kpis.operatingExpenses > 0 ? (e.amount / kpis.operatingExpenses) * 100 : 0;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-800">{e.category}</span>
                      <span className="font-bold text-slate-900">
                        {formatMoney(e.amount)} <span className="text-xs text-slate-400 font-normal">({pct.toFixed(0)}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full"
                        style={{ width: `${Math.min(100, Math.max(5, pct))}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
