"use client";

import React from "react";
import Link from "next/link";
import {
  TrendingUp,
  DollarSign,
  Receipt,
  Boxes,
  AlertTriangle,
  Store,
  ArrowUpRight,
  PlusCircle,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { KpiCard } from "@/components/shared/KpiCard";
import { MoneyText } from "@/components/shared/MoneyText";
import { DateTimeText } from "@/components/shared/DateTimeText";
import { SalesTrendChart } from "@/components/dashboard/DashboardCharts";
import { useHydratedLanguage } from "@/stores/language";
import { toBnDigits } from "@/lib/bangla-numbers";
import { cn } from "@/lib/utils";

export interface DashboardViewProps {
  data: {
    kpis: {
      revenue: number;
      grossProfit: number;
      operatingExpenses: number;
      operatingProfit: number;
      stockValue: number;
      receivables: number;
      orders: number;
      cogs: number;
    };
    lowStock: Array<{
      id: string;
      name: string;
      sku: string;
      stockQty: number;
      reorderLevel: number;
    }>;
    salesByDay: Array<{
      day: string;
      revenue: number;
      orders: number;
    }>;
    topProducts: Array<{
      name: string;
      qty: number;
      revenue: number;
    }>;
    expensesByCategory: Array<{
      category: string;
      amount: number;
    }>;
    recentTransactions: Array<{
      id: string;
      type: "INCOME" | "EXPENSE";
      amount: number;
      accountName: string;
      categoryName: string;
      description: string;
      occurredAt: string;
    }>;
  };
}

export const DashboardView: React.FC<DashboardViewProps> = ({ data }) => {
  const { language } = useHydratedLanguage();
  const isBn = language === "bn";
  const { kpis, lowStock, salesByDay, topProducts, expensesByCategory, recentTransactions } = data;
  const marginPercent = kpis.revenue > 0 ? Math.round((kpis.operatingProfit / kpis.revenue) * 100) : 0;
  const grossMarginPercent = kpis.revenue > 0 ? Math.round((kpis.grossProfit / kpis.revenue) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Store Dashboard"
        description="Real-time retail metrics, profit analytics, and stock health"
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/pos"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-lg shadow-sm transition-colors"
            >
              <Store className="w-4 h-4" />
              <span>{isBn ? "পিওএস টার্মিনাল খুলুন" : "Open POS Terminal"}</span>
            </Link>
          </div>
        }
      />

      {/* 1. Hallmark Asymmetric Financial Anchor */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Dominant Profit & Revenue Anchor (8 cols on lg) */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-lg p-5 sm:p-6 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {isBn ? "আর্থিক কর্মক্ষমতা সারসংক্ষেপ" : "Financial Performance Engine"}
                </span>
              </div>
              <span className="text-xs font-semibold text-slate-500 tabular-nums">
                {isBn ? `${toBnDigits(kpis.orders)} টি সফল অর্ডার` : `${kpis.orders} completed orders`}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-5">
              {/* Primary Revenue Anchor */}
              <div>
                <span className="text-xs font-semibold text-slate-500 block mb-1">
                  {isBn ? "মোট বিক্রয় আয়" : "Total Revenue"}
                </span>
                <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 tabular-nums tracking-tight">
                  <MoneyText amount={kpis.revenue} />
                </div>
                <p className="text-xs text-slate-600 mt-2 flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-slate-700">{isBn ? "গ্রস লাভ:" : "Gross Margin:"}</span>
                  <span className="font-bold text-emerald-700 tabular-nums">৳{toBnDigits(kpis.grossProfit.toLocaleString())} ({toBnDigits(grossMarginPercent)}%)</span>
                </p>
              </div>

              {/* Dominant Operating Profit Anchor */}
              <div className="sm:border-l sm:border-slate-100 sm:pl-6">
                <span className="text-xs font-semibold text-slate-500 block mb-1">
                  {isBn ? "প্রকৃত নিট অপারেটিং লাভ" : "Net Operating Profit"}
                </span>
                <div className="text-3xl sm:text-4xl font-extrabold text-blue-700 tabular-nums tracking-tight">
                  <MoneyText amount={kpis.operatingProfit} />
                </div>
                <p className="text-xs text-slate-600 mt-2 flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-slate-700">{isBn ? "নিট মার্জিন:" : "Net Margin:"}</span>
                  <span className="px-2 py-0.5 rounded text-xs font-bold tabular-nums bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {toBnDigits(marginPercent)}% {isBn ? "মুনাফা হার" : "take-home"}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Financial Context Strip */}
          <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-slate-500 block">{isBn ? "উপাদান খরচ (COGS):" : "Material Cost (COGS):"}</span>
              <span className="font-bold text-slate-800 tabular-nums">৳{toBnDigits(kpis.cogs.toLocaleString())}</span>
            </div>
            <div>
              <span className="text-slate-500 block">{isBn ? "পরিচালন ব্যয় (Overhead):" : "Operating Overhead:"}</span>
              <span className="font-bold text-slate-800 tabular-nums">৳{toBnDigits(kpis.operatingExpenses.toLocaleString())}</span>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className="text-slate-500 block">{isBn ? "গড় অর্ডার মূল্য (AOV):" : "Avg Order Value:"}</span>
              <span className="font-bold text-slate-800 tabular-nums">
                ৳{toBnDigits(kpis.orders > 0 ? Math.round(kpis.revenue / kpis.orders).toLocaleString() : 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Working Capital & Liquidity Rail (4 cols on lg) */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          {/* Stock Valuation Rail Card */}
          <div className="flex-1 bg-white border border-slate-200 rounded-lg p-4 flex items-center justify-between shadow-xs">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                {isBn ? "মজুদ পণ্যের মূল্য" : "Stock Valuation"}
              </span>
              <div className="text-xl sm:text-2xl font-extrabold text-slate-900 tabular-nums">
                <MoneyText amount={kpis.stockValue} />
              </div>
              <span className="text-xs text-slate-500 mt-0.5 block">
                {isBn ? "গুদাম ও শোরুমের মোট ইনভেন্টরি" : "Tied capital in stock assets"}
              </span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
              <Boxes className="w-5 h-5" />
            </div>
          </div>

          {/* Receivables Due Rail Card */}
          <div className={cn(
            "flex-1 rounded-lg p-4 flex items-center justify-between border shadow-xs transition-colors",
            kpis.receivables > 0
              ? "bg-amber-50/70 border-amber-300"
              : "bg-white border-slate-200"
          )}>
            <div>
              <span className={cn(
                "text-xs font-bold uppercase tracking-wider block mb-1",
                kpis.receivables > 0 ? "text-amber-800" : "text-slate-500"
              )}>
                {isBn ? "বাকি পাওনা (Receivables)" : "Receivables Due"}
              </span>
              <div className={cn(
                "text-xl sm:text-2xl font-extrabold tabular-nums",
                kpis.receivables > 0 ? "text-amber-900" : "text-slate-900"
              )}>
                <MoneyText amount={kpis.receivables} />
              </div>
              <span className={cn(
                "text-xs mt-0.5 block",
                kpis.receivables > 0 ? "text-amber-800 font-medium" : "text-slate-500"
              )}>
                {isBn ? "কাস্টমার ও পাইকারি ক্রেতার বাকি" : "Uncollected customer credit"}
              </span>
            </div>
            <div className={cn(
              "w-10 h-10 rounded-lg border flex items-center justify-center shrink-0",
              kpis.receivables > 0 ? "bg-amber-100 border-amber-300 text-amber-800" : "bg-slate-50 border-slate-200 text-slate-700"
            )}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
        </div>
      </section>

      {/* Sales Trend Chart */}
      <div className="bg-white border border-slate-200 rounded-md p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              {isBn ? "দৈনিক বিক্রয় ট্রেন্ড (বিগত ৩০ দিন)" : "Sales Trend (Last 30 Days)"}
            </h2>
            <p className="text-xs text-slate-500">
              {isBn ? "ঢাকা স্থানীয় সময় অনুযায়ী দৈনিক মোট বিক্রয়" : "Dhaka timezone daily revenue"}
            </p>
          </div>
          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded">
            ৳ BDT
          </span>
        </div>
        <SalesTrendChart data={salesByDay} />
      </div>

      {/* Two-Column Analytics: Top Products & Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <div className="bg-white border border-slate-200 rounded-md p-5 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 mb-1">
              {isBn ? "সর্বোচ্চ বিক্রিত মিষ্টি ও পণ্য" : "Top Selling Products"}
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              {isBn ? "আয়ের অবদান অনুযায়ী শীর্ষ পণ্যসমূহ" : "Ranked by revenue contribution"}
            </p>
            {topProducts.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">
                {isBn ? "কোন বিক্রয় রেকর্ড পাওয়া যায়নি" : "No sales recorded yet"}
              </p>
            ) : (
              <div className="space-y-3">
                {topProducts.map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-0">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs">
                        {isBn ? toBnDigits(idx + 1) : idx + 1}
                      </span>
                      <span className="font-medium text-slate-800">{p.name}</span>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <span className="text-slate-500">
                        {isBn ? `${toBnDigits(p.qty)} বিক্রিত` : `${p.qty} sold`}
                      </span>
                      <MoneyText amount={p.revenue} className="text-xs font-semibold" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="pt-3 border-t border-slate-100 text-right">
            <Link href="/products" className="text-xs text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1">
              <span>{isBn ? "সকল পণ্য দেখুন" : "View all products"}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Operating Expenses Breakdown */}
        <div className="bg-white border border-slate-200 rounded-md p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-semibold text-slate-900">
                {isBn ? "খাতওয়ারি পরিচালনা খরচ" : "Expenses by Category"}
              </h2>
              <Link href="/finance" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                {isBn ? "+ খরচ লিখুন" : "Add Expense"}
              </Link>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              {isBn ? "ম্যানুয়াল ওভারহেড ও দোকান পরিচালন ব্যয়" : "Manual overhead and operational costs"}
            </p>
            {expensesByCategory.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">
                {isBn ? "কোন খরচের হিসাব নেই" : "No manual expenses logged"}
              </p>
            ) : (
              <div className="space-y-3">
                {expensesByCategory.map((e, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-0">
                    <span className="font-medium text-slate-800">{e.category}</span>
                    <MoneyText amount={e.amount} className="font-semibold text-rose-600" />
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="pt-3 border-t border-slate-100 text-right">
            <Link href="/finance" className="text-xs text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1">
              <span>{isBn ? "পূর্ণ হিসাব ও খতিয়ান" : "View Finance Ledger"}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Two-Column Analytics: Recent Transactions & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions Table (2 cols) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-md p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  {isBn ? "সাম্প্রতিক লেনদেন সমূহ" : "Recent Activity & Transactions"}
                </h2>
                <p className="text-xs text-slate-500">
                  {isBn ? "সর্বশেষ আর্থিক আয় ও খরচের তালিকা" : "Latest income and expense entries across accounts"}
                </p>
              </div>
              <Link href="/finance" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                {isBn ? "সকল লেনদেন" : "View all"}
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500 uppercase text-xs tracking-wider font-semibold">
                    <th className="pb-2 font-semibold">{isBn ? "তারিখ" : "Date"}</th>
                    <th className="pb-2 font-semibold">{isBn ? "অ্যাকাউন্ট" : "Account"}</th>
                    <th className="pb-2 font-semibold">{isBn ? "ক্যাটেগরি" : "Category / Source"}</th>
                    <th className="pb-2 font-semibold">{isBn ? "বিবরণ" : "Description"}</th>
                    <th className="pb-2 font-semibold text-right">{isBn ? "পরিমাণ" : "Amount"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400">
                        {isBn ? "কোন লেনদেন রেকর্ড করা হয়নি" : "No transactions recorded"}
                      </td>
                    </tr>
                  ) : (
                    recentTransactions.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50">
                        <td className="py-2.5">
                          <DateTimeText date={t.occurredAt} />
                        </td>
                        <td className="py-2.5 font-medium text-slate-800">{t.accountName}</td>
                        <td className="py-2.5">
                          <span className="text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded font-medium">
                            {t.categoryName}
                          </span>
                        </td>
                        <td className="py-2.5 text-slate-600 truncate max-w-xs">{t.description}</td>
                        <td className="py-2.5 text-right font-medium">
                          <span className={t.type === "INCOME" ? "text-emerald-600" : "text-slate-800"}>
                            {t.type === "INCOME" ? "+" : "-"}
                            <MoneyText amount={t.amount} className="text-inherit" />
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Low Stock Alerts (1 col) */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>{isBn ? "স্বল্প স্টক সতর্কতা" : "Low Stock Risk Monitor"}</span>
                </h2>
                <p className="text-xs text-slate-500">
                  {isBn ? "রি-অর্ডার সীমার নিচে থাকা পণ্যসমূহ" : "Critical reorder thresholds"}
                </p>
              </div>
              <Link href="/inventory" className="text-xs font-bold text-blue-600 hover:text-blue-700">
                {isBn ? "ইনভেন্টরি →" : "Manage →"}
              </Link>
            </div>

            {lowStock.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block mr-1.5" />
                {isBn ? "সকল পণ্যের স্টক সন্তোষজনক" : "All product stock levels healthy"}
              </div>
            ) : (
              <div className="space-y-3">
                {lowStock.map((p) => (
                  <div key={p.id} className="p-2.5 rounded-lg bg-amber-50/50 border border-amber-200/60 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-slate-900 block truncate">{p.name}</span>
                      <span className="text-2xs text-slate-500 font-mono">SKU: {p.sku}</span>
                      <div className="w-full bg-amber-200/60 rounded-full h-1.5 overflow-hidden mt-1.5">
                        <div
                          className="bg-amber-600 h-full rounded-full"
                          style={{
                            width: `${Math.min(100, Math.max(15, (p.stockQty / (p.reorderLevel || 1)) * 50))}%`
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0">
                      <div className="text-right">
                        <span className="text-amber-900 font-extrabold block tabular-nums">
                          {isBn ? `${toBnDigits(p.stockQty)} বাকি` : `${p.stockQty} left`}
                        </span>
                        <span className="text-2xs text-slate-500">
                          {isBn ? `সীমা: ${toBnDigits(p.reorderLevel)}` : `Min: ${p.reorderLevel}`}
                        </span>
                      </div>
                      <Link
                        href={`/inventory?restock=${p.id}`}
                        className="px-2.5 py-1.5 bg-blue-600 text-white hover:bg-blue-700 font-bold text-xs rounded-md shadow-xs transition-colors"
                        title={isBn ? "পুনরায় স্টক ইন করুন" : "Restock this product"}
                      >
                        {isBn ? "স্টক ইন" : "Restock"}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="pt-3 border-t border-slate-100 text-right mt-4">
            <Link href="/inventory" className="text-xs text-slate-600 hover:text-slate-900 font-semibold inline-flex items-center gap-1">
              <span>{isBn ? "ইনভেন্টরি লেজার দেখুন" : "View Inventory Ledger"}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
