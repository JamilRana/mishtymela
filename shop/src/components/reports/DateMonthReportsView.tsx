"use client";

import React, { useState, useTransition } from "react";
import {
  Calendar,
  Download,
  Printer,
  TrendingUp,
  Boxes,
  ShoppingBag,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Package,
  Layers,
  FileSpreadsheet,
  Check,
  ChevronRight,
  Store,
} from "lucide-react";
import { MoneyText, formatMoney } from "@/components/shared/MoneyText";
import { getDateRangeReportAction, DateRangeReportFilter } from "@/actions/reports";
import { useLanguageStore } from "@/stores/language";
import { useOrganizationStore } from "@/stores/organization";
import { cn } from "@/lib/utils";

interface ReportData {
  label: string;
  period: string;
  startDateStr: string;
  endDateStr: string;
  summary: {
    grossRevenue: number;
    totalDiscounts: number;
    netRevenue: number;
    cogs: number;
    grossProfit: number;
    grossMargin: number;
    totalExpenses: number;
    netProfit: number;
    netMargin: number;
    totalPaid: number;
    totalDue: number;
    ordersCount: number;
    averageOrderValue: number;
  };
  topProducts: Array<{
    name: string;
    sku: string;
    unit: string;
    qty: number;
    revenue: number;
    cost: number;
    profit: number;
  }>;
  expensesByCategory: Array<{
    category: string;
    amount: number;
  }>;
  materialAndBoxPurchases: Array<{
    id: string;
    productName: string;
    categoryName: string;
    unit: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
    note: string;
    createdAt: string;
  }>;
  dailyTrend: Array<{
    date: string;
    revenue: number;
    orders: number;
    cogs: number;
  }>;
}

export interface DateMonthReportsViewProps {
  initialData: ReportData;
  shopProfile?: {
    name?: string | null;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    vatNumber?: string | null;
    receiptFooter?: string | null;
  } | null;
}

export const DateMonthReportsView: React.FC<DateMonthReportsViewProps> = ({
  initialData,
  shopProfile,
}) => {
  const [data, setData] = useState<ReportData>(initialData);
  const [isPending, startTransition] = useTransition();

  const { language } = useLanguageStore();
  const storedShop = useOrganizationStore((s) => s.shopInfo);
  const activeShop = {
    name: shopProfile?.name || storedShop.name,
    address: shopProfile?.address || storedShop.address,
    phone: shopProfile?.phone || storedShop.phone,
    email: shopProfile?.email || storedShop.email,
    vatNumber: shopProfile?.vatNumber || storedShop.vatNumber,
    receiptFooter: shopProfile?.receiptFooter || storedShop.receiptFooter,
  };

  // Filter States
  const [selectedPeriod, setSelectedPeriod] = useState<
    "today" | "yesterday" | "this_month" | "last_month" | "custom" | "month_picker"
  >("this_month");

  const [customStart, setCustomStart] = useState(initialData.startDateStr);
  const [customEnd, setCustomEnd] = useState(initialData.endDateStr);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const handlePeriodChange = (
    period: "today" | "yesterday" | "this_month" | "last_month" | "custom" | "month_picker"
  ) => {
    setSelectedPeriod(period);
    if (period !== "custom" && period !== "month_picker") {
      fetchReport({ period });
    }
  };

  const fetchReport = (filter: DateRangeReportFilter) => {
    startTransition(async () => {
      const res = await getDateRangeReportAction(filter);
      setData(res);
    });
  };

  const handleCustomApply = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReport({
      period: "custom",
      startDate: customStart,
      endDate: customEnd,
    });
  };

  const handleMonthApply = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReport({
      period: "month_picker",
      month: selectedMonth,
      year: selectedYear,
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const exportCsv = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.map((val) => `"${val}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}-${data.startDateStr}-to-${data.endDateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportSummary = () => {
    exportCsv(
      "sweet-shop-pl-statement",
      ["Metric", "Amount (BDT)"],
      [
        ["Accounting Period", `${data.startDateStr} to ${data.endDateStr}`],
        ["Gross Sales Revenue", data.summary.grossRevenue],
        ["Discounts Given", data.summary.totalDiscounts],
        ["Net Sales Revenue", data.summary.netRevenue],
        ["Cost of Goods Sold (COGS)", data.summary.cogs],
        ["Gross Profit", data.summary.grossProfit],
        ["Gross Margin %", `${data.summary.grossMargin}%`],
        ["Operating Expenses (Raw Materials/Boxes/Overhead)", data.summary.totalExpenses],
        ["Net Operating Profit", data.summary.netProfit],
        ["Net Margin %", `${data.summary.netMargin}%`],
        ["Cash Collected", data.summary.totalPaid],
        ["Outstanding Due (Credit)", data.summary.totalDue],
        ["Total Completed Orders", data.summary.ordersCount],
        ["Average Order Value", data.summary.averageOrderValue],
      ]
    );
  };

  const handleExportItems = () => {
    exportCsv(
      "sweet-items-sales-report",
      ["Product Name", "SKU", "Unit", "Quantity Sold", "Sales Revenue (BDT)", "Cost (BDT)", "Gross Profit (BDT)"],
      data.topProducts.map((p) => [p.name, p.sku, p.unit, p.qty, p.revenue, p.cost, p.profit])
    );
  };

  const handleExportPurchases = () => {
    exportCsv(
      "raw-materials-and-boxes-purchases",
      ["Date", "Item Name", "Category", "Quantity", "Unit", "Unit Cost (BDT)", "Total Cost (BDT)", "Note"],
      data.materialAndBoxPurchases.map((m) => [
        m.createdAt.split("T")[0],
        m.productName,
        m.categoryName,
        m.quantity,
        m.unit,
        m.unitCost,
        m.totalCost,
        m.note,
      ])
    );
  };

  const { summary } = data;

  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  return (
    <div id="statement-printable" className="space-y-6">
      {/* Printable Shop Profile Statement Header (Visible only when printing) */}
      <div className="hidden print:block pb-4 mb-4 border-b border-slate-300 text-center">
        <h1 className="text-2xl font-bold text-slate-900">{activeShop.name}</h1>
        {activeShop.address && <p className="text-xs text-slate-600 mt-1">{activeShop.address}</p>}
        <div className="flex items-center justify-center gap-3 text-xs text-slate-500 font-mono mt-0.5">
          {activeShop.phone && <span>{language === "bn" ? "মোবাইল: " : "Phone: "}{activeShop.phone}</span>}
          {activeShop.vatNumber && <span>• {activeShop.vatNumber}</span>}
        </div>
        <div className="mt-3 py-1 px-3 bg-slate-100 rounded inline-block">
          <p className="text-sm font-bold text-slate-800">
            {language === "bn" ? "আয়-ব্যয় ও লাভ-ক্ষতি বিবরণী (P&L Statement)" : "Income, Sales & Expense Statement"}
          </p>
          <p className="text-xs text-slate-600 font-mono">
            {data.label} ({data.startDateStr} — {data.endDateStr})
          </p>
        </div>
      </div>

      {/* Date & Month Selection Filter Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs space-y-4 print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Sweet Shop Period Reporting</h2>
              <p className="text-xs text-slate-500">
                Viewing: <span className="font-semibold text-blue-700">{data.label}</span> ({data.startDateStr} — {data.endDateStr})
              </p>
            </div>
          </div>

          {/* Quick Period Presets */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
            {(
              [
                { id: "today", label: "Today" },
                { id: "yesterday", label: "Yesterday" },
                { id: "this_month", label: "This Month" },
                { id: "last_month", label: "Last Month" },
                { id: "month_picker", label: "Select Month" },
                { id: "custom", label: "Custom Range" },
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handlePeriodChange(p.id)}
                className={cn(
                  "px-3 py-1.5 rounded-md transition-all",
                  selectedPeriod === p.id
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Conditional Sub-panel: Specific Month & Year Selector */}
        {selectedPeriod === "month_picker" && (
          <form
            onSubmit={handleMonthApply}
            className="flex flex-wrap items-end gap-3 pt-3 border-t border-slate-100 animate-in fade-in text-xs"
          >
            <div>
              <label className="text-slate-500 font-medium block mb-1">Select Month</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-md font-semibold text-slate-800"
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-500 font-medium block mb-1">Select Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-md font-semibold text-slate-800"
              >
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md font-bold transition-colors"
            >
              {isPending ? "Loading..." : "Generate Month Report"}
            </button>
          </form>
        )}

        {/* Conditional Sub-panel: Custom Date Range */}
        {selectedPeriod === "custom" && (
          <form
            onSubmit={handleCustomApply}
            className="flex flex-wrap items-end gap-3 pt-3 border-t border-slate-100 animate-in fade-in text-xs"
          >
            <div>
              <label className="text-slate-500 font-medium block mb-1">Start Date</label>
              <input
                type="date"
                required
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-md font-semibold text-slate-800"
              />
            </div>

            <div>
              <label className="text-slate-500 font-medium block mb-1">End Date</label>
              <input
                type="date"
                required
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-md font-semibold text-slate-800"
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md font-bold transition-colors"
            >
              {isPending ? "Filtering..." : "Filter Range"}
            </button>
          </form>
        )}

        {/* Actions Bar: Print & CSV Exports */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 font-medium">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Showing statements strictly for {data.label}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-md font-semibold transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Statement</span>
            </button>

            <button
              type="button"
              onClick={handleExportSummary}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md font-semibold transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export P&L (CSV)</span>
            </button>

            <button
              type="button"
              onClick={handleExportItems}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-md font-semibold transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export Sweets</span>
            </button>

            <button
              type="button"
              onClick={handleExportPurchases}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-md font-semibold transition-colors"
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>Export Purchases</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards for Selected Date / Month */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Net Revenue */}
        <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Net Sales Revenue
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-lg sm:text-xl font-bold text-slate-900">
              <MoneyText amount={summary.netRevenue} />
            </span>
            <span className="text-xs text-slate-500 font-mono">
              {summary.ordersCount} orders
            </span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            Avg Order: {formatMoney(summary.averageOrderValue)}
          </span>
        </div>

        {/* Gross Profit */}
        <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Gross Profit
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-lg sm:text-xl font-bold text-blue-700">
              <MoneyText amount={summary.grossProfit} />
            </span>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
              {summary.grossMargin}%
            </span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            COGS: {formatMoney(summary.cogs)}
          </span>
        </div>

        {/* Sweet Shop Operating Expenses */}
        <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Total Expenses
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-lg sm:text-xl font-bold text-rose-600">
              <MoneyText amount={summary.totalExpenses} />
            </span>
            <span className="text-xs text-slate-500">
              {data.expensesByCategory.length} categories
            </span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            Raw materials, boxes & overhead
          </span>
        </div>

        {/* Net Operating Profit */}
        <div
          className={cn(
            "p-4 border rounded-lg shadow-xs",
            summary.netProfit >= 0
              ? "bg-emerald-50/50 border-emerald-200"
              : "bg-rose-50/50 border-rose-200"
          )}
        >
          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
            Net Operating Profit
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span
              className={cn(
                "text-lg sm:text-xl font-extrabold",
                summary.netProfit >= 0 ? "text-emerald-700" : "text-rose-700"
              )}
            >
              <MoneyText amount={summary.netProfit} />
            </span>
            <span
              className={cn(
                "text-xs font-bold px-1.5 py-0.5 rounded",
                summary.netProfit >= 0
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-rose-100 text-rose-800"
              )}
            >
              {summary.netMargin}%
            </span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">
            Cash in: {formatMoney(summary.totalPaid)} • Due: {formatMoney(summary.totalDue)}
          </span>
        </div>
      </div>

      {/* Main Sweet Shop Profit & Loss Statement */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 mb-4 gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Store className="w-5 h-5 text-blue-600" />
              <span>Sweet Shop Profit & Loss Statement (লাভ-ক্ষতির হিসাব)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Period: {data.label} ({data.startDateStr} to {data.endDateStr})
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded font-semibold">
              Cash: {formatMoney(summary.totalPaid)}
            </span>
            {summary.totalDue > 0 && (
              <span className="bg-amber-100 text-amber-800 px-2.5 py-1 rounded font-semibold">
                Customer Due: {formatMoney(summary.totalDue)}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex justify-between py-1.5 text-slate-700">
            <span className="font-semibold">Gross Sweet Sales Revenue</span>
            <span className="font-bold text-slate-900">
              <MoneyText amount={summary.grossRevenue} />
            </span>
          </div>

          {summary.totalDiscounts > 0 && (
            <div className="flex justify-between py-1 text-emerald-700">
              <span>Less: Customer Discounts Allowed</span>
              <span className="font-medium">
                -<MoneyText amount={summary.totalDiscounts} />
              </span>
            </div>
          )}

          <div className="flex justify-between py-1.5 text-slate-800 font-semibold border-t border-slate-100">
            <span>Net Sales Revenue ({summary.ordersCount} orders)</span>
            <span className="font-bold text-slate-900">
              <MoneyText amount={summary.netRevenue} />
            </span>
          </div>

          <div className="flex justify-between py-1.5 text-slate-600">
            <span>Less: Cost of Goods Sold (COGS on sweets sold)</span>
            <span className="font-medium text-rose-600">
              -<MoneyText amount={summary.cogs} />
            </span>
          </div>

          <div className="flex justify-between py-2.5 border-t border-b border-slate-200 font-bold text-sm text-slate-900 bg-slate-50 px-3 rounded">
            <span>Gross Profit (মোট লাভ)</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-blue-600 font-normal">
                Margin: {summary.grossMargin}%
              </span>
              <span className="text-blue-700 font-extrabold">
                <MoneyText amount={summary.grossProfit} />
              </span>
            </div>
          </div>

          {/* Operating & Production Overhead */}
          <div className="py-2 space-y-1.5 text-slate-600">
            <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider">
              Operating Expenses & Purchases Breakdown:
            </span>
            {data.expensesByCategory.length === 0 ? (
              <p className="text-slate-400 italic">No manual operating expenses posted for this period.</p>
            ) : (
              data.expensesByCategory.map((exp, idx) => (
                <div key={idx} className="flex justify-between pl-3 py-0.5 text-slate-600">
                  <span>• {exp.category}</span>
                  <span className="text-rose-600 font-medium">
                    -<MoneyText amount={exp.amount} />
                  </span>
                </div>
              ))
            )}
            <div className="flex justify-between pt-1 border-t border-slate-100 font-semibold text-slate-700">
              <span>Total Operating Overhead</span>
              <span className="text-rose-600 font-bold">
                -<MoneyText amount={summary.totalExpenses} />
              </span>
            </div>
          </div>

          {/* Net Profit Final Highlight */}
          <div
            className={cn(
              "flex justify-between items-center py-3.5 border-t-2 font-bold text-base px-3.5 rounded-lg",
              summary.netProfit >= 0
                ? "bg-emerald-50 border-emerald-500 text-emerald-950"
                : "bg-rose-50 border-rose-500 text-rose-950"
            )}
          >
            <div>
              <span className="block text-sm sm:text-base">
                Net Operating Profit (প্রকৃত লাভ / লোকসান)
              </span>
              <span className="text-[11px] font-normal text-slate-600">
                Net Margin: {summary.netMargin}% of sales
              </span>
            </div>
            <span
              className={cn(
                "text-lg sm:text-xl font-extrabold tabular-nums",
                summary.netProfit >= 0 ? "text-emerald-700" : "text-rose-700"
              )}
            >
              <MoneyText amount={summary.netProfit} />
            </span>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Sweets Sold & Raw Materials / Boxes Purchased */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sweets Sold & Profitability */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Sweets Sales & Profit Performance</h4>
              <p className="text-[11px] text-slate-500">Itemized revenue & gross profit for {data.label}</p>
            </div>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-semibold">
              {data.topProducts.length} items sold
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2 px-2.5">Sweet Item</th>
                  <th className="py-2 px-2.5 text-right">Sold</th>
                  <th className="py-2 px-2.5 text-right">Revenue</th>
                  <th className="py-2 px-2.5 text-right">Gross Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.topProducts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      No sweet sales recorded in this period
                    </td>
                  </tr>
                ) : (
                  data.topProducts.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-2.5 font-semibold text-slate-900">
                        {p.name}
                        <span className="text-[10px] text-slate-400 block font-mono font-normal">
                          {p.sku}
                        </span>
                      </td>
                      <td className="py-2.5 px-2.5 text-right font-semibold text-slate-700 tabular-nums">
                        {p.qty} {p.unit}
                      </td>
                      <td className="py-2.5 px-2.5 text-right font-bold text-slate-900 tabular-nums">
                        {formatMoney(p.revenue)}
                      </td>
                      <td className="py-2.5 px-2.5 text-right font-bold text-emerald-600 tabular-nums">
                        {formatMoney(p.profit)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Raw Material & Box Purchases Table */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h4 className="font-bold text-slate-900 text-sm">
                Raw Materials & Sweet Boxes Purchased (কাঁচামাল ও বক্স ক্রয়)
              </h4>
              <p className="text-[11px] text-slate-500">Milk, sugar, ghee, chhana & sweet box stocking</p>
            </div>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-semibold">
              {data.materialAndBoxPurchases.length} stock receipts
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2 px-2.5">Date</th>
                  <th className="py-2 px-2.5">Material / Box</th>
                  <th className="py-2 px-2.5 text-right">Quantity</th>
                  <th className="py-2 px-2.5 text-right">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.materialAndBoxPurchases.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      No stock purchases received in this period
                    </td>
                  </tr>
                ) : (
                  data.materialAndBoxPurchases.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-2.5 text-slate-500 font-mono text-[11px]">
                        {m.createdAt.split("T")[0]}
                      </td>
                      <td className="py-2.5 px-2.5 font-semibold text-slate-900">
                        {m.productName}
                        <span className="text-[10px] text-slate-400 block">{m.categoryName}</span>
                      </td>
                      <td className="py-2.5 px-2.5 text-right font-semibold text-slate-700 tabular-nums">
                        {m.quantity} {m.unit}
                      </td>
                      <td className="py-2.5 px-2.5 text-right font-bold text-slate-900 tabular-nums">
                        {formatMoney(m.totalCost)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Daily Sales & Cost Timeline for the period */}
      {data.dailyTrend.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Daily Sales Timeline (দৈনিক বিক্রয়ের হিসাব)</h4>
              <p className="text-[11px] text-slate-500">Day-by-day revenue, order volume, and profit</p>
            </div>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-semibold">
              {data.dailyTrend.length} active days
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2 px-3">Date (Dhaka)</th>
                  <th className="py-2 px-3 text-right">Orders</th>
                  <th className="py-2 px-3 text-right">Sales Revenue</th>
                  <th className="py-2 px-3 text-right">COGS</th>
                  <th className="py-2 px-3 text-right">Gross Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {data.dailyTrend.map((d, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-semibold text-slate-800">{d.date}</td>
                    <td className="py-2 px-3 text-right text-slate-600">{d.orders}</td>
                    <td className="py-2 px-3 text-right font-bold text-slate-900 font-sans">
                      {formatMoney(d.revenue)}
                    </td>
                    <td className="py-2 px-3 text-right text-rose-600 font-sans">
                      {formatMoney(d.cogs)}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-emerald-600 font-sans">
                      {formatMoney(d.revenue - d.cogs)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
