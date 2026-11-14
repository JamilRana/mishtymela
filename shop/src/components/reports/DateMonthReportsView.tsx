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
  Scale,
  Wallet,
  Building2,
  Smartphone,
  Banknote,
  Search,
  PieChart,
  BarChart3,
  CalendarDays,
  Users,
  ArrowLeftRight,
  Truck,
} from "lucide-react";
import { MoneyText, formatMoney } from "@/components/shared/MoneyText";
import { QuantityText } from "@/components/shared/QuantityText";
import { toBnDigits } from "@/lib/bangla-numbers";
import {
  getDateRangeReportAction,
  DateRangeReportFilter,
  getStaffPerformanceReportAction,
  getStockMovementLedgerAction,
  getSupplierPurchaseRegisterAction,
} from "@/actions/reports";
import { useHydratedLanguage } from "@/stores/language";
import { useOrganizationStore } from "@/stores/organization";
import { TableSkeleton, KpiCardSkeleton } from "@/components/shared/Skeleton";
import { cn } from "@/lib/utils";

interface AccountClosingItem {
  id: string;
  name: string;
  type: string;
  openingBalance: number;
  inflows: number;
  outflows: number;
  closingBalance: number;
}

interface MonthlyItem {
  monthNumber: number;
  monthKey: string;
  monthLabel: string;
  monthLabelBn: string;
  revenue: number;
  cogs: number;
  expenses: number;
  orders: number;
  profit: number;
  margin: number;
}

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
    manualIncome?: number;
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
    category?: string;
    unit: string;
    qty: number;
    revenue: number;
    cost: number;
    profit: number;
    margin?: number;
    salesShare?: number;
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
  closingBalanceSummary?: {
    openingTotal: number;
    inflowsTotal: number;
    outflowsTotal: number;
    closingTotal: number;
    accounts: AccountClosingItem[];
  };
  monthlyReport?: MonthlyItem[];
  incomeVsExpense?: {
    salesRevenue: number;
    manualIncome: number;
    totalIncome: number;
    cogs: number;
    operatingExpenses: number;
    totalExpense: number;
    netProfit: number;
    expenseRatio: number;
    profitMargin: number;
  };
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

  const { language } = useHydratedLanguage();
  const storedShop = useOrganizationStore((s) => s.shopInfo);
  const activeShop = {
    name: shopProfile?.name || storedShop.name,
    address: shopProfile?.address || storedShop.address,
    phone: shopProfile?.phone || storedShop.phone,
    email: shopProfile?.email || storedShop.email,
    vatNumber: shopProfile?.vatNumber || storedShop.vatNumber,
    receiptFooter: shopProfile?.receiptFooter || storedShop.receiptFooter,
  };

  // Active Tab
  const [activeTab, setActiveTab] = useState<
    "statement" | "income_expense" | "closing_balance" | "monthly" | "items" | "purchases" | "staff" | "stock_ledger" | "suppliers"
  >("statement");

  const [staffReport, setStaffReport] = useState<any | null>(null);
  const [stockLedgerReport, setStockLedgerReport] = useState<any | null>(null);
  const [supplierReport, setSupplierReport] = useState<any | null>(null);

  const handleTabSelect = (tabId: typeof activeTab) => {
    setActiveTab(tabId);
    if (tabId === "staff" && !staffReport) {
      startTransition(async () => {
        const res = await getStaffPerformanceReportAction({
          startDate: data.startDateStr,
          endDate: data.endDateStr,
        });
        setStaffReport(res);
      });
    } else if (tabId === "stock_ledger" && !stockLedgerReport) {
      startTransition(async () => {
        const res = await getStockMovementLedgerAction({
          startDate: data.startDateStr,
          endDate: data.endDateStr,
        });
        setStockLedgerReport(res);
      });
    } else if (tabId === "suppliers" && !supplierReport) {
      startTransition(async () => {
        const res = await getSupplierPurchaseRegisterAction({
          startDate: data.startDateStr,
          endDate: data.endDateStr,
        });
        setSupplierReport(res);
      });
    }
  };

  // Filter States - Default is Today
  const [selectedPeriod, setSelectedPeriod] = useState<
    "today" | "yesterday" | "this_month" | "last_month" | "custom" | "month_picker" | "date_picker"
  >("today");

  const [singleDate, setSingleDate] = useState(initialData.startDateStr);
  const [customStart, setCustomStart] = useState(initialData.startDateStr);
  const [customEnd, setCustomEnd] = useState(initialData.endDateStr);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Item Search and Sort
  const [itemSearch, setItemSearch] = useState("");
  const [itemSortBy, setItemSortBy] = useState<"revenue" | "qty" | "profit">("revenue");

  const handlePeriodChange = (
    period: "today" | "yesterday" | "this_month" | "last_month" | "custom" | "month_picker" | "date_picker"
  ) => {
    setSelectedPeriod(period);
    if (period !== "custom" && period !== "month_picker" && period !== "date_picker") {
      fetchReport({ period });
    }
  };

  const fetchReport = (filter: DateRangeReportFilter) => {
    startTransition(async () => {
      const res = await getDateRangeReportAction(filter);
      setData(res);
    });
  };

  const handleSingleDateApply = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReport({
      period: "date_picker",
      selectedDate: singleDate,
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
        ["Operating Expenses", data.summary.totalExpenses],
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
      ["Product Name", "SKU", "Category", "Unit", "Quantity Sold", "Sales Revenue (BDT)", "Cost (BDT)", "Gross Profit (BDT)", "Margin %"],
      data.topProducts.map((p) => [p.name, p.sku, p.category || "-", p.unit, p.qty, p.revenue, p.cost, p.profit, `${p.margin || 0}%`])
    );
  };

  const handleExportMonthly = () => {
    if (!data.monthlyReport) return;
    exportCsv(
      "monthly-performance-report",
      ["Month", "Orders", "Revenue (BDT)", "COGS (BDT)", "Operating Expenses (BDT)", "Net Profit (BDT)", "Net Margin %"],
      data.monthlyReport.map((m) => [
        m.monthLabel,
        m.orders,
        m.revenue,
        m.cogs,
        m.expenses,
        m.profit,
        `${m.margin}%`,
      ])
    );
  };

  const handleExportClosing = () => {
    if (!data.closingBalanceSummary) return;
    exportCsv(
      "closing-balance-statement",
      ["Account Name", "Account Type", "Opening Balance (BDT)", "Total Inflows (BDT)", "Total Outflows (BDT)", "Closing Balance (BDT)"],
      data.closingBalanceSummary.accounts.map((a) => [
        a.name,
        a.type,
        a.openingBalance,
        a.inflows,
        a.outflows,
        a.closingBalance,
      ])
    );
  };

  const { summary } = data;

  const months = [
    { value: 1, label: "January (জানুয়ারি)" },
    { value: 2, label: "February (ফেব্রুয়ারি)" },
    { value: 3, label: "March (মার্চ)" },
    { value: 4, label: "April (এপ্রিল)" },
    { value: 5, label: "May (মে)" },
    { value: 6, label: "June (জুন)" },
    { value: 7, label: "July (জুলাই)" },
    { value: 8, label: "August (আগস্ট)" },
    { value: 9, label: "September (সেপ্টেম্বর)" },
    { value: 10, label: "October (অক্টোবর)" },
    { value: 11, label: "November (নভেম্বর)" },
    { value: 12, label: "December (ডিসেম্বর)" },
  ];

  // Filter items
  const filteredProducts = data.topProducts
    .filter((p) => {
      const q = itemSearch.trim().toLowerCase();
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.category && p.category.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      if (itemSortBy === "qty") return b.qty - a.qty;
      if (itemSortBy === "profit") return b.profit - a.profit;
      return b.revenue - a.revenue;
    });

  return (
    <div id="statement-printable" className="space-y-6">
      {/* Printable Shop Profile Statement Header */}
      <div className="hidden print:block pb-4 mb-4 border-b border-slate-300 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">{activeShop.name}</h1>
        {activeShop.address && <p className="text-xs text-slate-600 mt-1">{activeShop.address}</p>}
        <div className="flex items-center justify-center gap-3 text-xs text-slate-500 mt-0.5">
          {activeShop.phone && <span>মোবাইল: {activeShop.phone}</span>}
          {activeShop.vatNumber && <span>• {activeShop.vatNumber}</span>}
        </div>
        <div className="mt-3 py-1 px-3 bg-slate-100 rounded inline-block">
          <p className="text-sm font-semibold text-slate-800">
            আয়-ব্যয়, সমাপনী স্থিতি ও লাভ-ক্ষতি বিবরণী
          </p>
          <p className="text-xs text-slate-600">
            সময়কাল: {data.label} ({data.startDateStr} — {data.endDateStr})
          </p>
        </div>
      </div>

      {/* Date & Month Selection Filter Header (Default = Today) */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-4 print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-md bg-red-50 text-red-600 flex items-center justify-center font-semibold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-slate-900">সময়কাল ফিল্টার ও রিপোর্ট</h2>
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800">
                  Default: আজ
                </span>
              </div>
              <p className="text-xs text-slate-500">
                বর্তমান সময়কাল: <span className="font-semibold text-red-700">{data.label}</span> ({data.startDateStr} — {data.endDateStr})
              </p>
            </div>
          </div>

          {/* Quick Period Presets */}
          <div className="flex items-center gap-1 overflow-x-auto [scrollbar-width:none] text-sm">
            {(
              [
                { id: "today", label: "আজ (Today)" },
                { id: "yesterday", label: "গতকাল" },
                { id: "this_month", label: "এই মাস" },
                { id: "last_month", label: "গত মাস" },
                { id: "date_picker", label: "নির্দিষ্ট তারিখ" },
                { id: "month_picker", label: "নির্দিষ্ট মাস" },
                { id: "custom", label: "তারিখ রেঞ্জ" },
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handlePeriodChange(p.id)}
                className={cn(
                  "px-3 min-h-11 whitespace-nowrap border-b-2 cursor-pointer",
                  selectedPeriod === p.id
                    ? "border-blue-600 text-slate-900 font-medium"
                    : "border-transparent text-slate-600"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Conditional Sub-panel: Single Date Selector */}
        {selectedPeriod === "date_picker" && (
          <form
            onSubmit={handleSingleDateApply}
            className="flex flex-wrap items-end gap-3 pt-3 border-t border-slate-100 text-xs"
          >
            <div>
              <label className="text-slate-600 font-semibold block mb-1">যেকোনো তারিখ নির্বাচন করুন</label>
              <input
                type="date"
                required
                value={singleDate}
                onChange={(e) => setSingleDate(e.target.value)}
                className="h-11 px-3 text-base bg-white border border-slate-300 rounded-md text-slate-900"
              />
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 min-h-11 bg-blue-600 active:bg-blue-700 disabled:bg-blue-400 text-white rounded-md font-medium cursor-pointer"
            >
              {isPending ? "লোড হচ্ছে..." : "রিপোর্ট দেখুন"}
            </button>
          </form>
        )}

        {/* Conditional Sub-panel: Specific Month & Year Selector */}
        {selectedPeriod === "month_picker" && (
          <form
            onSubmit={handleMonthApply}
            className="flex flex-wrap items-end gap-3 pt-3 border-t border-slate-100 text-xs"
          >
            <div>
              <label className="text-slate-600 font-semibold block mb-1">মাস নির্বাচন করুন</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="h-11 px-3 text-base bg-white border border-slate-300 rounded-md text-slate-900"
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-600 font-semibold block mb-1">বছর</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="h-11 px-3 text-base bg-white border border-slate-300 rounded-md text-slate-900"
              >
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>
                    {toBnDigits(y)} ({y})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="px-4 min-h-11 bg-blue-600 active:bg-blue-700 disabled:bg-blue-400 text-white rounded-md font-medium cursor-pointer"
            >
              {isPending ? "লোড হচ্ছে..." : "মাসিক রিপোর্ট তৈরি করুন"}
            </button>
          </form>
        )}

        {/* Conditional Sub-panel: Custom Date Range */}
        {selectedPeriod === "custom" && (
          <form
            onSubmit={handleCustomApply}
            className="flex flex-wrap items-end gap-3 pt-3 border-t border-slate-100 text-xs"
          >
            <div>
              <label className="text-slate-600 font-semibold block mb-1">শুরুর তারিখ</label>
              <input
                type="date"
                required
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="h-11 px-3 text-base bg-white border border-slate-300 rounded-md text-slate-900"
              />
            </div>

            <div>
              <label className="text-slate-600 font-semibold block mb-1">শেষের তারিখ</label>
              <input
                type="date"
                required
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="h-11 px-3 text-base bg-white border border-slate-300 rounded-md text-slate-900"
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="px-4 min-h-11 bg-blue-600 active:bg-blue-700 disabled:bg-blue-400 text-white rounded-md font-medium cursor-pointer"
            >
              {isPending ? "ফিল্টারিং..." : "তারিখ রেঞ্জ ফিল্টার"}
            </button>
          </form>
        )}

        {/* View Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex gap-1 overflow-x-auto [scrollbar-width:none]">
            {(
              [
                { id: "statement", label: "সারসংক্ষেপ ও লাভ-ক্ষতি", icon: DollarSign },
                { id: "income_expense", label: "আয়-ব্যয় তুলনা", icon: Scale },
                { id: "closing_balance", label: "সমাপনী স্থিতি (Closing)", icon: Wallet },
                { id: "monthly", label: "মাসভিত্তিক রিপোর্ট", icon: CalendarDays },
                { id: "items", label: "মিষ্টির আইটেম রিপোর্ট", icon: ShoppingBag },
                { id: "purchases", label: "কাঁচামাল ও বক্স ক্রয়", icon: Boxes },
                { id: "staff", label: "কর্মীভিত্তিক পারফরম্যান্স", icon: Users },
                { id: "stock_ledger", label: "Stock IN/OUT লেজার", icon: ArrowLeftRight },
                { id: "suppliers", label: "সাপ্লাইয়ার রেজিস্টার", icon: Truck },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabSelect(tab.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 min-h-11 whitespace-nowrap rounded-md text-sm transition-colors cursor-pointer",
                    isActive
                      ? "bg-blue-600 text-white"
                      : "bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900 border border-slate-200"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 min-h-11 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-md font-semibold text-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>প্রিন্ট</span>
            </button>
            <button
              type="button"
              onClick={handleExportSummary}
              className="inline-flex items-center gap-1.5 px-3 min-h-11 bg-slate-900 hover:bg-slate-800 text-white rounded-md font-semibold text-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>এক্সপোর্ট (CSV)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Loading Skeleton Transition */}
      {isPending && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCardSkeleton />
            <KpiCardSkeleton />
            <KpiCardSkeleton />
            <KpiCardSkeleton />
          </div>
          <TableSkeleton rows={5} cols={5} />
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      {!isPending && (
        <>
          {/* TAB 1: STATEMENT & SUMMARY */}
          {activeTab === "statement" && (
            <div className="space-y-6">
              {/* KPI Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <div className="p-4 bg-white border border-slate-200 rounded-lg">
                  <span className="text-sm text-slate-600 block">
                    মোট বিক্রয় (Net Revenue)
                  </span>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-lg sm:text-xl font-semibold text-slate-900">
                      <MoneyText amount={summary.netRevenue} />
                    </span>
                    <span className="text-xs text-slate-500">
                      {toBnDigits(summary.ordersCount)} টি অর্ডার
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 mt-1 block">
                    গড় অর্ডার: {formatMoney(summary.averageOrderValue)}
                  </span>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-lg">
                  <span className="text-sm text-slate-600 block">
                    উপাদান খরচ (COGS)
                  </span>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-lg sm:text-xl font-semibold text-slate-700">
                      <MoneyText amount={summary.cogs} />
                    </span>
                    <span className="text-xs text-slate-400">
                      {toBnDigits(summary.grossMargin)}% মার্জিন
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 mt-1 block">
                    মোট লাভ (Gross): {formatMoney(summary.grossProfit)}
                  </span>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-lg">
                  <span className="text-sm text-slate-600 block">
                    অপারেশনাল খরচ (Expenses)
                  </span>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-lg sm:text-xl font-semibold text-amber-700">
                      <MoneyText amount={summary.totalExpenses} />
                    </span>
                    <span className="text-xs text-slate-400">
                      ভাড়া, বেতন, বিদ্যুৎ
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 mt-1 block">
                    অন্যান্য আয়: {formatMoney(summary.manualIncome || 0)}
                  </span>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-lg">
                  <span className="text-sm text-slate-600 block">
                    নিট লাভ (Net Profit)
                  </span>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span
                      className={cn(
                        "text-lg sm:text-xl font-semibold",
                        summary.netProfit >= 0 ? "text-green-700" : "text-red-600"
                      )}
                    >
                      <MoneyText amount={summary.netProfit} />
                    </span>
                    <span className="text-xs font-semibold text-green-600">
                      {toBnDigits(summary.netMargin)}% নিট
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 mt-1 block">
                    নগদ আদায়: {formatMoney(summary.totalPaid)} | বকেয়া: {formatMoney(summary.totalDue)}
                  </span>
                </div>
              </div>

              {/* Profit & Loss Detailed Table */}
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">
                    লাভ-ক্ষতি ও আয়-ব্যয় পূর্ণাঙ্গ বিবরণী (Income & P&L Statement)
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">{data.label}</span>
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  <div className="px-4 py-2.5 flex items-center justify-between">
                    <span className="font-medium text-slate-600">মোট প্রাথমিক বিক্রয় (Gross Sales)</span>
                    <span className="font-semibold text-slate-900"><MoneyText amount={summary.grossRevenue} /></span>
                  </div>
                  <div className="px-4 py-2.5 flex items-center justify-between bg-slate-50/50">
                    <span className="text-slate-500">(-) মোট প্রদত্ত ডিসকাউন্ট (Discounts)</span>
                    <span className="font-medium text-red-600">-<MoneyText amount={summary.totalDiscounts} /></span>
                  </div>
                  <div className="px-4 py-2.5 flex items-center justify-between font-semibold bg-slate-100/70">
                    <span className="text-slate-800">(=) প্রকৃত নিট বিক্রয় (Net Sales Revenue)</span>
                    <span className="text-slate-900 text-sm"><MoneyText amount={summary.netRevenue} /></span>
                  </div>
                  <div className="px-4 py-2.5 flex items-center justify-between bg-slate-50/50">
                    <span className="text-slate-600">(-) মিষ্টি তৈরিতে ব্যবহৃত কাঁচামাল খরচ (COGS)</span>
                    <span className="font-medium text-amber-700">-<MoneyText amount={summary.cogs} /></span>
                  </div>
                  <div className="px-4 py-2.5 flex items-center justify-between font-semibold bg-slate-50">
                    <span className="text-slate-800">(=) মোট ব্যবসায়িক লাভ (Gross Profit)</span>
                    <span className="text-green-700"><MoneyText amount={summary.grossProfit} /></span>
                  </div>
                  <div className="px-4 py-2.5 flex items-center justify-between bg-slate-50/50">
                    <span className="text-slate-600">(-) পরিচালন ও প্রশাসনিক খরচ (Operating Expenses)</span>
                    <span className="font-medium text-amber-700">-<MoneyText amount={summary.totalExpenses} /></span>
                  </div>
                  {Number(summary.manualIncome || 0) > 0 && (
                    <div className="px-4 py-2.5 flex items-center justify-between bg-green-50/30">
                      <span className="text-green-700">(+) অন্যান্য অ-ব্যবসায়িক আয় (Other Income)</span>
                      <span className="font-medium text-green-700">+<MoneyText amount={summary.manualIncome || 0} /></span>
                    </div>
                  )}
                  <div className="px-4 py-3 flex items-center justify-between font-semibold text-sm bg-green-50/70 text-green-950">
                    <span>(=) দিন/মাস শেষে নিট ব্যবসায়িক লাভ (Net Operating Profit)</span>
                    <span className=" text-base text-green-700"><MoneyText amount={summary.netProfit} /></span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INCOME VS EXPENSE COMPARISON */}
          {activeTab === "income_expense" && (
            <div className="space-y-6">
              {data.incomeVsExpense && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <span className="text-xs font-semibold text-green-800 block">
                        মোট প্রাপ্তি / আয় (Total Inflow & Income)
                      </span>
                      <span className="text-2xl font-semibold text-green-900 block mt-2">
                        <MoneyText amount={data.incomeVsExpense.totalIncome} />
                      </span>
                      <div className="mt-2 text-xs text-green-700 space-y-0.5">
                        <p>• বিক্রয় আয়: {formatMoney(data.incomeVsExpense.salesRevenue)}</p>
                        <p>• অন্যান্য আয়: {formatMoney(data.incomeVsExpense.manualIncome)}</p>
                      </div>
                    </div>

                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <span className="text-xs font-semibold text-red-800 block">
                        মোট ব্যয় ও খরচ (Total Outflow & Expenses)
                      </span>
                      <span className="text-2xl font-semibold text-red-900 block mt-2">
                        <MoneyText amount={data.incomeVsExpense.totalExpense} />
                      </span>
                      <div className="mt-2 text-xs text-red-700 space-y-0.5">
                        <p>• মিষ্টির কাঁচামাল (COGS): {formatMoney(data.incomeVsExpense.cogs)}</p>
                        <p>• সাধারণ পরিচালনা খরচ: {formatMoney(data.incomeVsExpense.operatingExpenses)}</p>
                      </div>
                    </div>

                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <span className="text-xs font-semibold text-blue-800 block">
                        নিট উদ্বৃত্ত / লাভ (Net Surplus / Profit)
                      </span>
                      <span className="text-2xl font-semibold text-blue-900 block mt-2">
                        <MoneyText amount={data.incomeVsExpense.netProfit} />
                      </span>
                      <div className="mt-2 text-xs text-blue-700 space-y-0.5">
                        <p>• ব্যয় অনুপাত: {toBnDigits(data.incomeVsExpense.expenseRatio)}%</p>
                        <p>• নিট প্রফিট মার্জিন: {toBnDigits(data.incomeVsExpense.profitMargin)}%</p>
                      </div>
                    </div>
                  </div>

                  {/* Visual Proportion Comparison Bar */}
                  <div className="p-4 bg-white border border-slate-200 rounded-lg space-y-3">
                    <h3 className="text-sm font-semibold text-slate-800">আয় বনাম ব্যয় অনুপাত (Income vs Expense Ratio)</h3>
                    <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden flex">
                      <div
                        className="bg-green-500 h-full"
                        style={{
                          width: `${Math.max(5, Math.min(95, 100 - data.incomeVsExpense.expenseRatio))}%`,
                        }}
                        title={`লাভ/উদ্বৃত্ত`}
                      />
                      <div
                        className="bg-red-500 h-full"
                        style={{
                          width: `${Math.max(5, Math.min(95, data.incomeVsExpense.expenseRatio))}%`,
                        }}
                        title={`মোট খরচ`}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
                        নিট লাভ / উদ্বৃত্ত ({toBnDigits(Math.max(0, 100 - data.incomeVsExpense.expenseRatio))})%
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
                        মোট খরচ অনুপাত ({toBnDigits(data.incomeVsExpense.expenseRatio)})%
                      </span>
                    </div>
                  </div>

                  {/* Expenses Category Breakdown */}
                  <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                      <h4 className="text-xs font-semibold text-slate-800">
                        খরচের খাতভিত্তিক বিবরণ (Expenses by Category)
                      </h4>
                    </div>
                    <div className="p-4">
                      {data.expensesByCategory.length === 0 ? (
                        <p className="text-xs text-slate-400 py-3 text-center">
                          এই সময়কালে কোনো অতিরিক্ত ম্যানুয়াল খরচ রেকর্ড করা হয়নি।
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {data.expensesByCategory.map((c) => {
                            const pct = summary.totalExpenses > 0 ? (c.amount / summary.totalExpenses) * 100 : 0;
                            return (
                              <div key={c.category} className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-semibold text-slate-700">{c.category}</span>
                                  <span className=" text-slate-900 font-semibold">
                                    <MoneyText amount={c.amount} /> ({toBnDigits(pct.toFixed(1))}%)
                                  </span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                  <div className="bg-amber-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 3: CLOSING BALANCE (দিন/মাস শেষে ক্যাশ ও ব্যাংক সমাপনী স্থিতি) */}
          {activeTab === "closing_balance" && (
            <div className="space-y-6">
              {data.closingBalanceSummary && (
                <>
                  {/* Overall Closing Balance Header */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                    <div className="p-4 bg-white border border-slate-200 rounded-lg">
                      <span className="text-sm text-slate-600 block">
                        শুরুর স্থিতি (Opening Balance)
                      </span>
                      <span className="text-lg sm:text-xl font-semibold text-slate-700 block mt-1">
                        <MoneyText amount={data.closingBalanceSummary.openingTotal} />
                      </span>
                      <span className="text-xs text-slate-500 mt-1 block">দিন/মাসের শুরুর ক্যাশ</span>
                    </div>

                    <div className="p-4 bg-white border border-slate-200 rounded-lg">
                      <span className="text-sm text-slate-600 block">
                        (+) মোট নগদ/ডিজিটাল জমা
                      </span>
                      <span className="text-lg sm:text-xl font-semibold text-green-700 block mt-1">
                        +<MoneyText amount={data.closingBalanceSummary.inflowsTotal} />
                      </span>
                      <span className="text-xs text-slate-500 mt-1 block">বিক্রয় ও অন্যান্য আদায়</span>
                    </div>

                    <div className="p-4 bg-white border border-slate-200 rounded-lg">
                      <span className="text-sm text-slate-600 block">
                        (-) মোট নগদ প্রদান/খরচ
                      </span>
                      <span className="text-lg sm:text-xl font-semibold text-red-700 block mt-1">
                        -<MoneyText amount={data.closingBalanceSummary.outflowsTotal} />
                      </span>
                      <span className="text-xs text-slate-500 mt-1 block">খরচ ও ক্রয় বাবদ পেমেন্ট</span>
                    </div>

                    <div className="p-4 bg-slate-900 text-white rounded-lg">
                      <span className="text-xs font-semibold text-slate-300 block">
                        (=) মোট সমাপনী স্থিতি (Closing)
                      </span>
                      <span className="text-xl sm:text-2xl font-semibold text-green-400 block mt-1">
                        <MoneyText amount={data.closingBalanceSummary.closingTotal} />
                      </span>
                      <span className="text-xs text-slate-400 mt-1 block">দিন/মাস শেষে মোট ব্যালেন্স</span>
                    </div>
                  </div>

                  {/* Per-Account Breakdown Table */}
                  <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">
                          অ্যাকাউন্টভিত্তিক সমাপনী হিসাব (Cash Register & Account Ledger)
                        </h3>
                        <p className="text-xs text-slate-500">
                          ক্যাশ ড্রয়ার, বিকাশ ও ব্যাংক অ্যাকাউন্টের শুরু ও সমাপনী মিলানো
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleExportClosing}
                        className="text-xs px-2.5 py-1 bg-white border border-slate-300 rounded font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        এক্সপোর্ট
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[640px] text-xs text-left">
                        <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                          <tr>
                            <th className="py-2.5 px-4">অ্যাকাউন্টের নাম</th>
                            <th className="py-2.5 px-3">ধরন</th>
                            <th className="py-2.5 px-3 text-right">শুরুর স্থিতি (Opening)</th>
                            <th className="py-2.5 px-3 text-right text-green-700">(+) মোট জমা</th>
                            <th className="py-2.5 px-3 text-right text-red-700">(-) মোট খরচ</th>
                            <th className="py-2.5 px-4 text-right font-semibold text-slate-900">সমাপনী স্থিতি (Closing)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {data.closingBalanceSummary.accounts.map((acc) => (
                            <tr key={acc.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-3 px-4 font-semibold text-slate-800 flex items-center gap-2">
                                {acc.type === "CASH" && <Banknote className="w-4 h-4 text-green-600" />}
                                {acc.type === "MOBILE" && <Smartphone className="w-4 h-4 text-pink-600" />}
                                {acc.type === "BANK" && <Building2 className="w-4 h-4 text-blue-600" />}
                                <span>{acc.name}</span>
                              </td>
                              <td className="py-3 px-3 text-slate-500 text-xs">
                                {acc.type}
                              </td>
                              <td className="py-3 px-3 text-right text-slate-600">
                                <MoneyText amount={acc.openingBalance} />
                              </td>
                              <td className="py-3 px-3 text-right text-green-700 font-medium">
                                +<MoneyText amount={acc.inflows} />
                              </td>
                              <td className="py-3 px-3 text-right text-red-700 font-medium">
                                -<MoneyText amount={acc.outflows} />
                              </td>
                              <td className="py-3 px-4 text-right font-semibold text-sm text-slate-900">
                                <MoneyText amount={acc.closingBalance} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-slate-50 border-t-2 border-slate-300 font-semibold text-xs">
                          <tr>
                            <td colSpan={2} className="py-3 px-4 text-slate-900">
                              সর্বমোট সমাপনী ব্যালেন্স
                            </td>
                            <td className="py-3 px-3 text-right text-slate-700">
                              <MoneyText amount={data.closingBalanceSummary.openingTotal} />
                            </td>
                            <td className="py-3 px-3 text-right text-green-700">
                              +<MoneyText amount={data.closingBalanceSummary.inflowsTotal} />
                            </td>
                            <td className="py-3 px-3 text-right text-red-700">
                              -<MoneyText amount={data.closingBalanceSummary.outflowsTotal} />
                            </td>
                            <td className="py-3 px-4 text-right text-sm text-green-800">
                              <MoneyText amount={data.closingBalanceSummary.closingTotal} />
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 4: MONTH-WISE REPORTING (মাসভিত্তিক রিপোর্ট) */}
          {activeTab === "monthly" && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      চলতি বছরের মাসভিত্তিক বিক্রয় ও লাভ-ক্ষতি রিপোর্ট (Month-wise Performance)
                    </h3>
                    <p className="text-xs text-slate-500">
                      প্রতি মাসের আয়, খরচ, নিট লাভ এবং মার্জিনের ধারাবাহিক হিসাব
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportMonthly}
                    className="inline-flex items-center gap-1.5 px-3 min-h-11 bg-slate-900 hover:bg-slate-800 text-white rounded font-semibold text-xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>মাসিক CSV</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-xs text-left">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-4">মাস</th>
                        <th className="py-2.5 px-3 text-center">অর্ডার সংখ্যা</th>
                        <th className="py-2.5 px-3 text-right">বিক্রয় আয় (Revenue)</th>
                        <th className="py-2.5 px-3 text-right text-slate-600">উপাদান খরচ (COGS)</th>
                        <th className="py-2.5 px-3 text-right text-amber-700">অপারেশনাল খরচ</th>
                        <th className="py-2.5 px-3 text-right font-semibold text-slate-900">নিট লাভ (Net Profit)</th>
                        <th className="py-2.5 px-4 text-right">মার্জিন %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.monthlyReport?.map((m) => (
                        <tr
                          key={m.monthKey}
                          className={cn(
                            "hover:bg-slate-50/70 transition-colors",
                            m.revenue > 0 ? "bg-white" : "bg-slate-50/30 text-slate-400"
                          )}
                        >
                          <td className="py-3 px-4 font-semibold text-slate-800">
                            {m.monthLabelBn}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {toBnDigits(m.orders)}
                          </td>
                          <td className="py-3 px-3 text-right font-semibold text-slate-900">
                            <MoneyText amount={m.revenue} />
                          </td>
                          <td className="py-3 px-3 text-right text-slate-600">
                            <MoneyText amount={m.cogs} />
                          </td>
                          <td className="py-3 px-3 text-right text-amber-700">
                            <MoneyText amount={m.expenses} />
                          </td>
                          <td
                            className={cn(
                              "py-3 px-3 text-right font-semibold text-sm",
                              m.profit >= 0 ? "text-green-700" : "text-red-600"
                            )}
                          >
                            <MoneyText amount={m.profit} />
                          </td>
                          <td className="py-3 px-4 text-right font-semibold">
                            {toBnDigits(m.margin)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ITEM-WISE SWEET REPORTING (আইটেমভিত্তিক মিষ্টির বিক্রয় ও লাভ) */}
          {activeTab === "items" && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      মিষ্টি ও আইটেমভিত্তিক লাভ-ক্ষতি (Item-wise Profitability)
                    </h3>
                    <p className="text-xs text-slate-500">
                      কোন মিষ্টি কতটা বিক্রি হয়েছে ও সর্বোচ্চ লাভজনক মিষ্টির তালিকা
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Search */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="মিষ্টি খুঁজুন..."
                        value={itemSearch}
                        onChange={(e) => setItemSearch(e.target.value)}
                        className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-red-600 w-44"
                      />
                    </div>

                    {/* Sort buttons */}
                    <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => setItemSortBy("revenue")}
                        className={cn("px-2 py-1 rounded", itemSortBy === "revenue" && "bg-white font-semibold text-red-700")}
                      >
                        বিক্রয়
                      </button>
                      <button
                        type="button"
                        onClick={() => setItemSortBy("qty")}
                        className={cn("px-2 py-1 rounded", itemSortBy === "qty" && "bg-white font-semibold text-red-700")}
                      >
                        পরিমাণ
                      </button>
                      <button
                        type="button"
                        onClick={() => setItemSortBy("profit")}
                        className={cn("px-2 py-1 rounded", itemSortBy === "profit" && "bg-white font-semibold text-red-700")}
                      >
                        লাভ
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleExportItems}
                      className="px-3 py-1.5 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 transition-colors"
                    >
                      CSV
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-xs text-left">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-4">মিষ্টির নাম</th>
                        <th className="py-2.5 px-3">ক্যাটেগরি</th>
                        <th className="py-2.5 px-3 text-right">বিক্রিত পরিমাণ</th>
                        <th className="py-2.5 px-3 text-right">মোট বিক্রয় (Revenue)</th>
                        <th className="py-2.5 px-3 text-right text-slate-500">খরচ (COGS)</th>
                        <th className="py-2.5 px-3 text-right font-semibold text-green-800">লাভ (Gross Profit)</th>
                        <th className="py-2.5 px-4 text-right">মার্জিন %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredProducts.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-6 text-slate-400">
                            কোনো মিষ্টির তথ্য পাওয়া যায়নি।
                          </td>
                        </tr>
                      ) : (
                        filteredProducts.map((p) => (
                          <tr key={p.sku + p.name} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3 px-4 font-semibold text-slate-900">
                              <span>{p.name}</span>
                              {p.sku && <span className="block text-xs text-slate-500 mt-0.5">{p.sku}</span>}
                            </td>
                            <td className="py-3 px-3 text-slate-500">{p.category || "-"}</td>
                            <td className="py-3 px-3 text-right font-medium text-slate-800">
                              <QuantityText quantity={p.qty} unit={p.unit} />
                            </td>
                            <td className="py-3 px-3 text-right font-semibold text-slate-900">
                              <MoneyText amount={p.revenue} />
                            </td>
                            <td className="py-3 px-3 text-right text-slate-500">
                              <MoneyText amount={p.cost} />
                            </td>
                            <td className="py-3 px-3 text-right font-semibold text-green-700">
                              <MoneyText amount={p.profit} />
                            </td>
                            <td className="py-3 px-4 text-right font-semibold text-slate-700">
                              {toBnDigits(p.margin || 0)}%
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: PURCHASES OF RAW MATERIALS & BOXES */}
          {activeTab === "purchases" && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      কাঁচামাল ও মিষ্টির বক্স ক্রয় বিবরণী (Raw Materials & Sweet Boxes)
                    </h3>
                    <p className="text-xs text-slate-500">
                      দুধ, ছানা, চিনি, ঘি ও প্যাকেজিং বক্সের ক্রয় হিসাব
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-xs text-left">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-4">তারিখ</th>
                        <th className="py-2.5 px-3">আইটেম</th>
                        <th className="py-2.5 px-3">ক্যাটেগরি</th>
                        <th className="py-2.5 px-3 text-right">পরিমাণ</th>
                        <th className="py-2.5 px-3 text-right">একক দর</th>
                        <th className="py-2.5 px-4 text-right font-semibold">মোট খরচ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.materialAndBoxPurchases.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-6 text-slate-400">
                            এই সময়কালে কোনো কাঁচামাল বা বক্স ক্রয় রেকর্ড নেই।
                          </td>
                        </tr>
                      ) : (
                        data.materialAndBoxPurchases.map((m) => (
                          <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3 px-4 text-slate-500">
                              {toBnDigits(m.createdAt.split("T")[0])}
                            </td>
                            <td className="py-3 px-3 font-semibold text-slate-900">{m.productName}</td>
                            <td className="py-3 px-3 text-slate-500">{m.categoryName}</td>
                            <td className="py-3 px-3 text-right">
                              <QuantityText quantity={m.quantity} unit={m.unit} />
                            </td>
                            <td className="py-3 px-3 text-right">
                              <MoneyText amount={m.unitCost} />
                            </td>
                            <td className="py-3 px-4 text-right font-semibold text-slate-900">
                              <MoneyText amount={m.totalCost} />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: STAFF PERFORMANCE LEADERBOARD */}
          {activeTab === "staff" && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      কর্মীভিত্তিক বিক্রয় পারফরম্যান্স (Staff Sales Leaderboard)
                    </h3>
                    <p className="text-xs text-slate-500">
                      ক্যাশিয়ার ও বিক্রয়কর্মীদের মোট ইনভয়েস এবং বিক্রয় অবদান
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-4">কর্মীর নাম</th>
                        <th className="py-2.5 px-3">পদবি / রোল</th>
                        <th className="py-2.5 px-3 text-center">মোট ইনভয়েস</th>
                        <th className="py-2.5 px-3 text-right">গড় ইনভয়েস সাইজ</th>
                        <th className="py-2.5 px-4 text-right font-semibold">সর্বমোট বিক্রয়</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {!staffReport || staffReport.staffList.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-8 text-slate-400">
                            {isPending ? "কর্মী ডাটা লোড হচ্ছে..." : "এই সময়কালে কোনো বিক্রয় রেকর্ড পাওয়া যায়নি।"}
                          </td>
                        </tr>
                      ) : (
                        staffReport.staffList.map((st: any) => (
                          <tr key={st.userId} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3 px-4 font-semibold text-slate-900">{st.name}</td>
                            <td className="py-3 px-3">
                              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-mono">
                                {st.role}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center font-mono font-medium">
                              {toBnDigits(st.invoiceCount)} টি
                            </td>
                            <td className="py-3 px-3 text-right font-mono">
                              <MoneyText amount={st.avgInvoiceValue} />
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                              <MoneyText amount={st.totalSales} />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: STOCK IN/OUT LEDGER */}
          {activeTab === "stock_ledger" && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      লাইভ Stock IN/OUT লেজার (Inventory Movement Timeline)
                    </h3>
                    <p className="text-xs text-slate-500">
                      পণ্য ও মিষ্টির আগমন (IN) ও নির্গমন (OUT)-এর পূর্ণাঙ্গ টাইমলাইন
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-4">সময়</th>
                        <th className="py-2.5 px-3">পণ্য</th>
                        <th className="py-2.5 px-3">মুভমেন্ট ধরন</th>
                        <th className="py-2.5 px-3 text-right">পরিমাণ পরিবর্তন</th>
                        <th className="py-2.5 px-3 text-right">একক খরচ</th>
                        <th className="py-2.5 px-4 text-right font-semibold">অবশিষ্ট মজুদ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {!stockLedgerReport || stockLedgerReport.movements.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-slate-400">
                            {isPending ? "স্টক মুভমেন্ট লোড হচ্ছে..." : "কোনো স্টক মুভমেন্ট রেকর্ড নেই।"}
                          </td>
                        </tr>
                      ) : (
                        stockLedgerReport.movements.map((m: any) => {
                          const isPositive = m.quantityDelta > 0;
                          return (
                            <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                                {toBnDigits(m.createdAt.slice(0, 16).replace("T", " "))}
                              </td>
                              <td className="py-3 px-3">
                                <span className="font-semibold text-slate-900 block">{m.productName}</span>
                                <span className="text-[10px] text-slate-400 font-mono">{m.sku}</span>
                              </td>
                              <td className="py-3 px-3">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                    isPositive
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                      : "bg-rose-50 text-rose-700 border border-rose-200"
                                  }`}
                                >
                                  {m.type}
                                </span>
                              </td>
                              <td className={`py-3 px-3 text-right font-mono font-bold ${isPositive ? "text-emerald-700" : "text-rose-700"}`}>
                                {isPositive ? "+" : ""}{toBnDigits(m.quantityDelta)} {m.unit}
                              </td>
                              <td className="py-3 px-3 text-right font-mono">
                                <MoneyText amount={m.unitCost} />
                              </td>
                              <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                                {toBnDigits(m.balanceAfter)} {m.unit}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: SUPPLIER PURCHASE REGISTER */}
          {activeTab === "suppliers" && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      সাপ্লাইয়ার ক্রয় ও চালান রেজিস্টার (Supplier Purchase Register)
                    </h3>
                    <p className="text-xs text-slate-500">
                      সরবরাহকারীভিত্তিক কাঁচামাল ও মিষ্টি ক্রয়ের মোট ভলিউম ও বকেয়া হিসাব
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-4">সাপ্লাইয়ারের নাম</th>
                        <th className="py-2.5 px-3">মোবাইল</th>
                        <th className="py-2.5 px-3 text-center">চালান সংখ্যা</th>
                        <th className="py-2.5 px-3 text-right">পরিশোধিত</th>
                        <th className="py-2.5 px-3 text-right text-rose-700 font-semibold">বকেয়া দেনা</th>
                        <th className="py-2.5 px-4 text-right font-semibold">মোট ক্রয় মূল্য</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {!supplierReport || supplierReport.suppliers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-slate-400">
                            {isPending ? "সাপ্লাইয়ার ডাটা লোড হচ্ছে..." : "কোনো সাপ্লাইয়ার ক্রয় রেকর্ড নেই।"}
                          </td>
                        </tr>
                      ) : (
                        supplierReport.suppliers.map((s: any) => (
                          <tr key={s.supplierId} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3 px-4 font-semibold text-slate-900">{s.supplierName}</td>
                            <td className="py-3 px-3 font-mono text-slate-500">{s.supplierPhone}</td>
                            <td className="py-3 px-3 text-center font-mono font-medium">
                              {toBnDigits(s.billsCount)} টি
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-emerald-700 font-medium">
                              <MoneyText amount={s.paidAmount} />
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-rose-700 font-bold">
                              <MoneyText amount={s.dueAmount} />
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                              <MoneyText amount={s.totalPurchases} />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
