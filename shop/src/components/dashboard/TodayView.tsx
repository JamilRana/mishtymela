"use client";

import React from "react";
import Link from "next/link";
import {
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Wallet,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Package,
  Layers,
  ChevronRight,
} from "lucide-react";
import { useHydratedLanguage } from "@/stores/language";
import { formatMoney } from "@/components/shared/MoneyText";
import { toBnDigits } from "@/lib/bangla-numbers";
import type { getTodayOverviewAction } from "@/actions/dashboard";
import { cn } from "@/lib/utils";

type Data = Awaited<ReturnType<typeof getTodayOverviewAction>>;

export const TodayView: React.FC<{ data: Data }> = ({ data }) => {
  const { language } = useHydratedLanguage();
  const bn = language === "bn";
  const locale = bn ? "bn-BD" : "en-GB";
  const money = (v: number) => formatMoney(v, language);
  const num = (v: number) => (bn ? toBnDigits(v) : String(v));

  const day = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Dhaka",
  }).format(new Date(data.nowISO));

  const when = (iso: string) =>
    new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Dhaka",
    }).format(new Date(iso));

  const change =
    data.yesterdayRevenue > 0
      ? Math.round(((data.revenue - data.yesterdayRevenue) / data.yesterdayRevenue) * 100)
      : null;

  const grossMargin =
    data.revenue > 0 ? Math.round((data.grossProfit / data.revenue) * 100) : 0;

  const collectionRate =
    data.revenue > 0 ? Math.min(100, Math.round((data.collected / data.revenue) * 100)) : 100;

  return (
    <div className="space-y-6">
      {/* Executive Command Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {bn ? "লাইভ কাউন্টার" : "Live Terminal"}
            </span>
            <span className="text-xs text-slate-500 font-mono" suppressHydrationWarning>
              {day}
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 mt-1">
            {bn ? "আজকের ব্যবসায়িক হিসাব" : "Today's Business Overview"}
          </h1>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/sales"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors shadow-2xs"
          >
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>{bn ? "সকল ইনভয়েস" : "All Invoices"}</span>
          </Link>
          <Link
            href="/pos"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{bn ? "নতুন পিওএস বিক্রি" : "New Sale (POS)"}</span>
          </Link>
        </div>
      </div>

      {/* Primary Financial Performance Engine - Asymmetric Split Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Dominant 8-Column Financial Hub */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {bn ? "আজকের মোট বিক্রয় • REVENUE" : "TODAY'S REVENUE"}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
                {data.orders === 0
                  ? (bn ? "০টি অর্ডার" : "0 orders")
                  : bn ? `${num(data.orders)}টি সম্পন্ন অর্ডার` : `${data.orders} completed orders`}
              </span>
            </div>

            <div className="mt-3 flex items-baseline gap-4 flex-wrap">
              <span className="text-4xl sm:text-5xl font-black text-slate-900 tabular-nums tracking-tight">
                {money(data.revenue)}
              </span>

              {change !== null && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold",
                    change >= 0
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-rose-50 text-rose-700 border border-rose-200"
                  )}
                >
                  {change >= 0 ? (
                    <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5 stroke-[2.5]" />
                  )}
                  {bn ? `${num(Math.abs(change))}% গতদিনের তুলনায়` : `${change >= 0 ? "+" : ""}${change}% vs yesterday`}
                </span>
              )}
            </div>
          </div>

          {/* High-Density Ledger Sub-Metrics */}
          <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <div className="text-xs font-medium text-slate-500">
                {bn ? "আজকের ক্যাশ সংগ্রহ" : "Collected Today"}
              </div>
              <div className="text-lg font-bold text-slate-900 tabular-nums">
                {money(data.collected)}
              </div>
              <div className="text-xs text-slate-500 font-medium">
                {bn ? `সংগ্রহের হার: ${num(collectionRate)}%` : `Collection: ${collectionRate}%`}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-medium text-slate-500">
                {bn ? "আজকের আনুমানিক লাভ" : "Estimated Profit"}
              </div>
              <div className="text-lg font-bold text-emerald-700 tabular-nums">
                {money(data.grossProfit)}
              </div>
              <div className="text-xs text-slate-500 font-medium">
                {bn ? `গ্রস মার্জিন: ${num(grossMargin)}%` : `Gross Margin: ${grossMargin}%`}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-medium text-slate-500">
                {bn ? "গড় অর্ডার ভ্যালু" : "Avg Order Value"}
              </div>
              <div className="text-lg font-bold text-slate-900 tabular-nums">
                {money(data.orders > 0 ? Math.round(data.revenue / data.orders) : 0)}
              </div>
              <div className="text-xs text-slate-500 font-medium">
                {bn ? "প্রতি বিক্রয়ে" : "per transaction"}
              </div>
            </div>
          </div>
        </div>

        {/* 4-Column Working Capital Rail */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Stock Valuation */}
          <div className="flex-1 bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-blue-600" />
                {bn ? "মজুদ পণ্যের মূল্য" : "Stock Valuation"}
              </span>
              <Link
                href="/inventory"
                className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center"
              >
                {bn ? "মজুদ" : "View"}
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="my-2">
              <div className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums">
                {money(data.stockValue)}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {bn ? "দোকানের সকল কাঁচামাল ও মিষ্টির মোট কেনা দর" : "Total inventory asset at cost"}
              </p>
            </div>
          </div>

          {/* Customer Receivables Due */}
          <div className={cn(
            "flex-1 border rounded-xl p-4 shadow-xs flex flex-col justify-between",
            data.receivables > 0 ? "bg-amber-50/50 border-amber-200" : "bg-white border-slate-200"
          )}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <AlertTriangle className={cn("w-3.5 h-3.5", data.receivables > 0 ? "text-amber-600" : "text-slate-400")} />
                {bn ? "বাকি পাওনা (কাস্টমার)" : "Receivables Due"}
              </span>
              <Link
                href="/finance"
                className="text-xs font-bold text-slate-600 hover:text-slate-900 inline-flex items-center"
              >
                {bn ? "খতিয়ান" : "Ledger"}
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="my-2">
              <div className={cn(
                "text-2xl sm:text-3xl font-black tabular-nums",
                data.receivables > 0 ? "text-amber-900" : "text-slate-900"
              )}>
                {money(data.receivables)}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {data.receivables > 0
                  ? (bn ? "বাকিতে যাওয়া টাকার মোট পাওনা সংগ্রহ করুন" : "Uncollected credit sales")
                  : (bn ? "কোনো অপরিশোধিত বাকি নেই" : "No pending customer credit")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Operations Grid: 7-col Recent Sales + 5-col Working Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* 7-Column Recent Invoices Stream */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {bn ? "সর্বশেষ বিক্রয় চালান" : "Recent Sales Ledger"}
              </h2>
              <p className="text-xs text-slate-500">
                {bn ? "আজকের রিয়েলটাইম লেনদেন তালিকা" : "Realtime sales log"}
              </p>
            </div>
            <Link
              href="/sales"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-0.5"
            >
              <span>{bn ? "সব চালান দেখুন" : "View All"}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {data.recentSales.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <Clock className="w-8 h-8 mx-auto text-slate-300 stroke-1 mb-2" />
              <p className="text-xs font-medium text-slate-500">
                {bn ? "আজ এখনো কোনো বিক্রয় সম্পন্ন হয়নি।" : "No sales recorded yet today."}
              </p>
              <Link
                href="/pos"
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{bn ? "পিওএস টার্মিনাল চালু করুন" : "Open POS"}</span>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {data.recentSales.map((sale) => (
                <div
                  key={sale.id}
                  className="p-3.5 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">
                        {sale.invoiceNo}
                      </span>
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {sale.customerName || (bn ? "সাধারণ ক্রেতা" : "Walk-in Customer")}
                      </span>
                      {sale.voided ? (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <XCircle className="w-3 h-3" />
                          {bn ? "বাতিল" : "Voided"}
                        </span>
                      ) : sale.due > 0 ? (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          {bn ? "আংশিক বাকি" : "Partial Due"}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          {bn ? "পরিশোধিত" : "Paid"}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500" suppressHydrationWarning>
                      {when(sale.createdAt)}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div
                      className={cn(
                        "text-sm font-black tabular-nums",
                        sale.voided ? "text-slate-400 line-through" : "text-slate-900"
                      )}
                    >
                      {money(sale.total)}
                    </div>
                    {sale.due > 0 && !sale.voided && (
                      <div className="text-[11px] font-bold text-amber-700 tabular-nums">
                        {bn ? "বাকি: " : "Due: "}{money(sale.due)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 5-Column Operational Ledger: Liquidity & Stock Risk */}
        <div className="lg:col-span-5 space-y-5">
          {/* Liquidity Matrix */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-slate-700" />
                <h2 className="text-sm font-bold text-slate-900">
                  {bn ? "ক্যাশ ও অ্যাকাউন্ট ব্যালেন্স" : "Cash & Accounts"}
                </h2>
              </div>
              <Link
                href="/finance"
                className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-0.5"
              >
                <span>{bn ? "বিস্তারিত" : "Finance"}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {data.accounts.map((acc) => (
                <div
                  key={acc.id}
                  className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-xs font-bold text-slate-800">{acc.name}</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900 tabular-nums">
                    {money(acc.balance)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Depletion Risk Monitor */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-600" />
                <h2 className="text-sm font-bold text-slate-900">
                  {bn ? "স্বল্প স্টক সতর্কতা" : "Low Stock Monitor"}
                </h2>
              </div>
              <Link
                href="/inventory"
                className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-0.5"
              >
                <span>{bn ? "ইনভেন্টরি" : "Inventory"}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {data.lowStock.length === 0 ? (
              <div className="p-6 text-center">
                <CheckCircle2 className="w-7 h-7 mx-auto text-emerald-500 stroke-1 mb-1.5" />
                <p className="text-xs font-medium text-slate-600">
                  {bn ? "সকল পণ্যের মজুদ পর্যাপ্ত রয়েছে।" : "All products are sufficiently stocked."}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {data.lowStock.slice(0, 5).map((prod) => (
                  <div
                    key={prod.id}
                    className="p-3.5 flex items-center justify-between gap-3 hover:bg-amber-50/30 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {prod.name}
                      </div>
                      <div className="text-[11px] font-semibold text-rose-600 tabular-nums">
                        {bn ? `মাত্র ${num(prod.stockQty)} বাকি (সীমা: ${num(prod.reorderLevel)})` : `Only ${prod.stockQty} left (min ${prod.reorderLevel})`}
                      </div>
                    </div>
                    <Link
                      href={`/inventory?restock=${prod.id}`}
                      className="px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors shrink-0"
                    >
                      {bn ? "স্টক যোগ" : "Restock"}
                    </Link>
                  </div>
                ))}
                {data.lowStock.length > 5 && (
                  <div className="p-2.5 bg-slate-50 text-center">
                    <Link
                      href="/inventory"
                      className="text-xs font-bold text-slate-600 hover:text-slate-900"
                    >
                      {bn ? `আরও ${num(data.lowStock.length - 5)}টি স্বল্প স্টক দেখুন →` : `See ${data.lowStock.length - 5} more →`}
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};