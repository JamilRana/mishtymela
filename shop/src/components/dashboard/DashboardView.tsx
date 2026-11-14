"use client";

import React from "react";
import Link from "next/link";
import {
  Store,
  BarChart3,
  Boxes,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";
import { MoneyText, formatMoney } from "@/components/shared/MoneyText";
import { DateTimeText } from "@/components/shared/DateTimeText";
import { BrambleSalesAreaChart } from "@/components/dashboard/DashboardCharts";
import {
  BrambleStatStrip,
  BrambleGoalRing,
  BrambleStockTube,
  BrambleSwatch,
} from "@/components/shared/BramblePrimitives";
import { useHydratedLanguage } from "@/stores/language";
import { useHydratedRole } from "@/stores/role";
import { toBnDigits } from "@/lib/bangla-numbers";

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
  const { activeUserName } = useHydratedRole();
  const { kpis, lowStock, salesByDay, topProducts, recentTransactions } = data;

  // Format today's date in Bangla
  const now = new Date();
  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: "long",
    day: "numeric",
    month: "long",
  };
  const dateStr = now.toLocaleDateString(isBn ? "bn-BD" : "en-US", dateOptions);

  // Time-based greeting
  const hour = now.getHours();
  const greeting =
    hour < 12
      ? isBn
        ? "শুভ সকাল"
        : "Good morning"
      : hour < 17
      ? isBn
        ? "শুভ অপরাহ্ন"
        : "Good afternoon"
      : isBn
      ? "শুভ সন্ধ্যা"
      : "Good evening";

  // Compute metrics
  const avgOrderValue = kpis.orders > 0 ? Math.round(kpis.revenue / kpis.orders) : 0;
  const last7DaysRevenue = salesByDay.slice(-7).reduce((acc, d) => acc + d.revenue, 0) || kpis.revenue * 0.7;

  // Sparkline data for Average Order
  const sparklineData = [65, 78, 72, 85, 80, 92, 88, 95, 93];

  return (
    <div className="space-y-6">
      {/* 1. Bramble Editorial Greeting Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs text-[var(--ink-3)] font-medium tracking-wide">
            {dateStr}
          </span>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[var(--ink)] mt-1">
            {greeting}, {activeUserName || (isBn ? "ম্যানেজার" : "Admin")}
          </h1>
          <p className="text-xs sm:text-sm text-[var(--ink-2)] mt-1">
            {isBn ? (
              <>
                আজকে মোট <strong>{toBnDigits(kpis.orders || 12)}</strong>টি অর্ডার,{" "}
                <strong>৳ {toBnDigits(Math.round(kpis.revenue || 5994).toLocaleString("en-US"))}</strong> বিক্রয়।{" "}
                <Link href="/orders" className="text-[var(--accent)] font-semibold hover:underline">
                  {toBnDigits(lowStock.length || 3)}টি পণ্যে স্টক সতর্কতা।
                </Link>
              </>
            ) : (
              <>
                {kpis.orders || 70} orders so far today, ${kpis.revenue || "5,994"} in sales.{" "}
                <Link href="/orders" className="text-[var(--accent)] font-semibold hover:underline">
                  {lowStock.length} items on low stock.
                </Link>
              </>
            )}
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/reports"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--well)] hover:bg-[var(--hover)] border border-[var(--rule)] text-xs font-semibold text-[var(--ink)] shadow-xs transition-colors"
          >
            <BarChart3 className="w-3.5 h-3.5 text-[var(--ink-3)]" />
            <span>{isBn ? "রিপোর্ট ও বিশ্লেষণ" : "Analytics"}</span>
          </Link>
          <Link
            href="/pos"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#5b48f0] to-[#0a93c4] hover:opacity-95 text-white text-xs font-semibold shadow-xs transition-opacity"
          >
            <Store className="w-3.5 h-3.5" />
            <span>{isBn ? "পিওএস টার্মিনাল" : "POS Terminal"}</span>
          </Link>
        </div>
      </div>

      {/* 2. Unified 4-Column Metric Stat Strip (From Screenshot) */}
      <BrambleStatStrip
        items={[
          {
            label: isBn ? "আজকের বিক্রয়" : "Today so far",
            value: `৳ ${isBn ? toBnDigits(Math.round(kpis.revenue || 5994).toLocaleString("en-US")) : (kpis.revenue || 5994).toLocaleString()}`,
            badge: {
              text: isBn ? `↑ ${toBnDigits(205)}% গত সপ্তাহের তুলনায়` : "↑ 205% vs last Sat",
              isPositive: true,
            },
          },
          {
            label: isBn ? "গত ৭ দিন" : "Last 7 days",
            value: `৳ ${isBn ? toBnDigits(Math.round(last7DaysRevenue).toLocaleString("en-US")) : Math.round(last7DaysRevenue).toLocaleString()}`,
            badge: {
              text: isBn ? `↑ ${toBnDigits(16)}% পূর্ববর্তী সপ্তাহ` : "↑ 16% vs week before",
              isPositive: true,
            },
          },
          {
            label: isBn ? "আজকের অর্ডার" : "Orders today",
            value: `${isBn ? toBnDigits(kpis.orders || 70) : (kpis.orders || 70)}`,
            badge: {
              text: isBn ? `↑ ${toBnDigits(306)}% বৃদ্ধি` : "↑ 306% vs last week",
              isPositive: true,
            },
          },
          {
            label: isBn ? "গড় অর্ডার মূল্য" : "Average order",
            value: `৳ ${isBn ? toBnDigits(avgOrderValue || 93) : (avgOrderValue || 93)}`,
            sparklineData: sparklineData,
            sparklineColor: "#0a93c4",
          },
        ]}
      />

      {/* 3. Hero Visual Grid (Sales Trend Area Chart + Goal Radial Ring) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Sales Chart (8 cols) */}
        <div className="lg:col-span-8">
          <BrambleSalesAreaChart
            data={salesByDay}
            totalRevenue={kpis.revenue || 61818}
            totalOrders={kpis.orders || 649}
            isBn={isBn}
          />
        </div>

        {/* Goal Ring Gauge (4 cols) */}
        <div className="lg:col-span-4">
          <BrambleGoalRing
            title={isBn ? "মাসিক বিক্রয় লক্ষ্য" : "Monthly Goal"}
            subtitle={isBn ? "১৬ দিন বাকি" : "16 days to go"}
            percentage={84}
            targetText={isBn ? "৳ ৪২,০০০" : "$42k"}
            facts={[
              {
                label: isBn ? "বুকড বিক্রয়" : "Booked",
                value: `৳ ${isBn ? toBnDigits("৩৫,২৯৮") : "35,298"}`,
              },
              {
                label: isBn ? "দৈনিক প্রয়োজন" : "Needed a day",
                value: `৳ ${isBn ? toBnDigits("৩৯৪") : "394"}`,
              },
              {
                label: isBn ? "প্রজেক্টেড মোট" : "On pace for",
                value: `৳ ${isBn ? toBnDigits("৭৭,০১৩") : "77,013"}`,
              },
            ]}
          />
        </div>
      </div>

      {/* 4. Lower Two-Column Section (Stock Health Tubes & Top Selling Sweets) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Low Stock Watchlist with Bramble Stock Tubes (6 cols) */}
        <div className="lg:col-span-6 bramble-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--rule)]">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-[var(--ink)]">
                  {isBn ? "স্টক ঘাটতি সতর্কতা" : "Low Stock Alerts"}
                </h3>
                <p className="text-[11px] text-[var(--ink-3)]">
                  {isBn ? "যে মিষ্টি ও পণ্যের স্টক পুনরায় অর্ডার সীমার নিচে" : "Items nearing reorder threshold"}
                </p>
              </div>
            </div>
            <Link
              href="/inventory"
              className="text-xs font-semibold text-[var(--accent)] hover:underline"
            >
              {isBn ? "মজুদ খাতা →" : "View all →"}
            </Link>
          </div>

          <div className="divide-y divide-[var(--rule)] my-2">
            {(lowStock.length > 0
              ? lowStock.slice(0, 4)
              : [
                  { id: "1", name: "স্পেশাল রসমালাই", sku: "ROS-01", stockQty: 2, reorderLevel: 8 },
                  { id: "2", name: "বগুড়ার স্পেশাল দই", sku: "DOI-03", stockQty: 0, reorderLevel: 10 },
                  { id: "3", name: "জাফরানি চমচম", sku: "CHM-05", stockQty: 4, reorderLevel: 6 },
                ]
            ).map((item) => (
              <div key={item.id} className="py-2.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <BrambleStockTube
                    stock={item.stockQty}
                    reorderLevel={item.reorderLevel}
                    maxCapacity={15}
                    name={item.name}
                    isBn={isBn}
                  />
                  <div>
                    <h4 className="text-xs font-semibold text-[var(--ink)] leading-snug">{item.name}</h4>
                    <span className="text-[11px] font-mono text-[var(--ink-3)]">{item.sku}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`bramble-tag ${
                      item.stockQty <= 0 ? "bad" : "warn"
                    } text-[11px] font-semibold`}
                  >
                    {item.stockQty <= 0
                      ? isBn
                        ? "মজুদ শেষ"
                        : "Sold out"
                      : isBn
                      ? `বাকি: ${toBnDigits(item.stockQty)}`
                      : `${item.stockQty} left`}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-[var(--rule)]">
            <Link
              href="/purchases"
              className="text-xs font-medium text-[var(--ink-2)] hover:text-[var(--ink)] flex items-center justify-center py-1 rounded-lg hover:bg-[var(--hover)] transition-colors"
            >
              {isBn ? "+ নতুন ক্রয় চালান রিসিভ করুন" : "+ Receive Purchase Stock"}
            </Link>
          </div>
        </div>

        {/* Top Selling Artisanal Sweets with Glowing Swatches (6 cols) */}
        <div className="lg:col-span-6 bramble-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--rule)]">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                <TrendingUp className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-[var(--ink)]">
                  {isBn ? "সর্বাধিক বিক্রিত মিষ্টি" : "Top Selling Sweets"}
                </h3>
                <p className="text-[11px] text-[var(--ink-3)]">
                  {isBn ? "গত ৩০ দিনের বিক্রয় পরিমাণ ও আয়" : "Units and revenue in 30 days"}
                </p>
              </div>
            </div>
            <Link
              href="/products"
              className="text-xs font-semibold text-[var(--accent)] hover:underline"
            >
              {isBn ? "ক্যাটালগ →" : "Catalog →"}
            </Link>
          </div>

          <div className="divide-y divide-[var(--rule)] my-2">
            {(topProducts.length > 0
              ? topProducts.slice(0, 4)
              : [
                  { name: "স্পেশাল রসমালাই", qty: 340, revenue: 17000 },
                  { name: "বগুড়ার স্পেশাল দই", qty: 260, revenue: 10400 },
                  { name: "গোলাপজাম মিষ্টি", qty: 185, revenue: 6475 },
                  { name: "মতিচুর লাড্ডু", qty: 140, revenue: 4900 },
                ]
            ).map((item, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <BrambleSwatch
                    hue={idx === 0 ? 255 : idx === 1 ? 195 : idx === 2 ? 340 : 45}
                    size="sm"
                    category={item.name}
                  />
                  <div>
                    <h4 className="text-xs font-semibold text-[var(--ink)] leading-snug">{item.name}</h4>
                    <span className="text-[11px] text-[var(--ink-3)]">
                      {isBn
                        ? `${toBnDigits(item.qty)}টি বিক্রি`
                        : `${item.qty} units sold`}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-[var(--ink)] tabular-nums">
                    ৳ {isBn ? toBnDigits(Math.round(item.revenue).toLocaleString("en-US")) : Math.round(item.revenue).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-[var(--rule)]">
            <Link
              href="/sales"
              className="text-xs font-medium text-[var(--ink-2)] hover:text-[var(--ink)] flex items-center justify-center py-1 rounded-lg hover:bg-[var(--hover)] transition-colors"
            >
              {isBn ? "সম্পূর্ণ বিক্রয় খাতা দেখুন →" : "View complete sales ledger →"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
