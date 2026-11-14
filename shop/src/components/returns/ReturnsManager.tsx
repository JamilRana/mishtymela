"use client";

import React, { useState } from "react";
import {
  RotateCcw,
  ArrowLeftRight,
  Plus,
  Search,
  Printer,
  Calendar,
  AlertCircle,
  Sparkles,
  ChevronRight,
  TrendingDown,
  DollarSign,
  FileText,
} from "lucide-react";
import { MoneyText } from "@/components/shared/MoneyText";
import { DateTimeText } from "@/components/shared/DateTimeText";
import { ReturnSlipModal } from "./ReturnSlipModal";
import { NewSalesReturnModal } from "./NewSalesReturnModal";
import { NewPurchaseReturnModal } from "./NewPurchaseReturnModal";
import { useRouter, useSearchParams } from "next/navigation";

export interface SalesReturnRecord {
  id: string;
  returnNo: string;
  saleId: string;
  invoiceNo: string;
  customerName: string;
  refundAmount: number;
  accountId?: string | null;
  reason?: string | null;
  status: string;
  createdAt: string;
  items: Array<{
    id: string;
    productId: string;
    productName: string;
    sku: string;
    unit: string;
    quantity: number;
    refundRate: number;
    lineTotal: number;
    restocked: boolean;
  }>;
}

export interface PurchaseReturnRecord {
  id: string;
  returnNo: string;
  purchaseId: string;
  billNo: string;
  supplierName: string;
  supplierPhone: string;
  amountCredited: number;
  reason?: string | null;
  status: string;
  createdAt: string;
}

interface ReturnsManagerProps {
  salesReturns: SalesReturnRecord[];
  purchaseReturns: PurchaseReturnRecord[];
  metrics: {
    totalSalesRefunded: number;
    totalPurchaseCredited: number;
    salesReturnCount: number;
    purchaseReturnCount: number;
  };
  accounts: Array<{ id: string; name: string; type: string }>;
  recentPurchases: Array<{
    id: string;
    billNo: string;
    supplierName: string;
    total: number;
    due: number;
  }>;
}

export function ReturnsManager({
  salesReturns,
  purchaseReturns,
  metrics,
  accounts,
  recentPurchases,
}: ReturnsManagerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<"SALES" | "PURCHASE">(
    (searchParams.get("tab") as any) || "SALES"
  );
  const [search, setSearch] = useState(searchParams.get("search") || "");

  // Modals
  const [isSalesModalOpen, setIsSalesModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [slipRecord, setSlipRecord] = useState<SalesReturnRecord | null>(null);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (search.trim()) {
      params.set("search", search.trim());
    } else {
      params.delete("search");
    }
    params.set("tab", activeTab);
    router.push(`/returns?${params.toString()}`);
  };

  const handleTabChange = (tab: "SALES" | "PURCHASE") => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`/returns?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 bg-card rounded-xl border shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-medium">মোট বিক্রয় ফেরত</span>
            <RotateCcw className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-xl font-bold font-mono text-rose-600">
            <MoneyText amount={metrics.totalSalesRefunded} />
          </div>
          <span className="text-[10px] text-muted-foreground">গ্রাহকদের রিফান্ডকৃত অর্থ</span>
        </div>

        <div className="p-3.5 bg-card rounded-xl border shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-medium">বিক্রয় ফেরত চালান</span>
            <FileText className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-600">
            {metrics.salesReturnCount} টি
          </div>
          <span className="text-[10px] text-muted-foreground">মোট ফেরত রশিদ</span>
        </div>

        <div className="p-3.5 bg-card rounded-xl border shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-medium">ক্রয় ফেরত (ডেবিট নোট)</span>
            <ArrowLeftRight className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-bold font-mono text-indigo-600">
            <MoneyText amount={metrics.totalPurchaseCredited} />
          </div>
          <span className="text-[10px] text-muted-foreground">সাপ্লাইয়ার সমন্বয়</span>
        </div>

        <div className="p-3.5 bg-card rounded-xl border shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-medium">ক্রয় ফেরত চালান</span>
            <FileText className="w-4 h-4 text-primary" />
          </div>
          <div className="text-xl font-bold font-mono text-primary">
            {metrics.purchaseReturnCount} টি
          </div>
          <span className="text-[10px] text-muted-foreground">বিল সমন্বয় এন্ট্রি</span>
        </div>
      </div>

      {/* Tabs & Search & Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Tabs */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleTabChange("SALES")}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTab === "SALES"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/50 hover:bg-muted text-muted-foreground"
            }`}
          >
            বিক্রয় ফেরত (Sales Returns)
          </button>
          <button
            onClick={() => handleTabChange("PURCHASE")}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTab === "PURCHASE"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/50 hover:bg-muted text-muted-foreground"
            }`}
          >
            ক্রয় ফেরত (Purchase Returns)
          </button>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-2">
          <form onSubmit={handleSearchSubmit} className="relative sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="ফেরত নং, ইনভয়েস বা নাম..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border rounded-lg bg-background outline-none focus:ring-2 focus:ring-primary/20"
            />
          </form>

          {activeTab === "SALES" ? (
            <button
              onClick={() => setIsSalesModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-rose-600 text-white rounded-lg hover:bg-rose-700 font-medium shadow-sm whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              নতুন বিক্রয় ফেরত
            </button>
          ) : (
            <button
              onClick={() => setIsPurchaseModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium shadow-sm whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              নতুন ক্রয় ফেরত
            </button>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div className="border rounded-xl bg-card overflow-hidden shadow-sm">
        {activeTab === "SALES" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 border-b text-muted-foreground font-semibold">
                <tr>
                  <th className="py-3 px-3">ফেরত নং</th>
                  <th className="py-3 px-3">মূল ইনভয়েস</th>
                  <th className="py-3 px-3">গ্রাহক</th>
                  <th className="py-3 px-3">ফেরত পণ্যসমূহ</th>
                  <th className="py-3 px-3 text-right">রিফান্ড মূল্য</th>
                  <th className="py-3 px-3 text-center">স্ট্যাটাস</th>
                  <th className="py-3 px-3 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {salesReturns.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                      <RotateCcw className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      কোন বিক্রয় ফেরত রেকর্ড পাওয়া যায়নি।
                    </td>
                  </tr>
                ) : (
                  salesReturns.map((sr) => (
                    <tr key={sr.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-3">
                        <span className="font-mono font-bold text-foreground block">
                          {sr.returnNo}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          <DateTimeText date={sr.createdAt} showTime={false} />
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-mono font-semibold text-primary block">
                          {sr.invoiceNo}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-semibold text-foreground block">
                          {sr.customerName}
                        </span>
                      </td>

                      <td className="py-3 px-3 max-w-[220px]">
                        <span className="line-clamp-1 font-medium text-foreground">
                          {sr.items.map((i) => `${i.productName} (${i.quantity} ${i.unit})`).join(", ")}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                          <span>{sr.items.length} টি পণ্য</span>
                          <span>•</span>
                          <span className={sr.items.every((i) => i.restocked) ? "text-emerald-600" : "text-amber-600"}>
                            {sr.items.every((i) => i.restocked) ? "স্টকে গৃহীত" : "আংশিক বিনষ্ট"}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-rose-600">
                        <MoneyText amount={sr.refundAmount} />
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                          সম্পন্ন
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => setSlipRecord(sr)}
                          title="ফেরত রশিদ প্রিন্ট"
                          className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 border-b text-muted-foreground font-semibold">
                <tr>
                  <th className="py-3 px-3">ডেবিট নোট নং</th>
                  <th className="py-3 px-3">মূল ক্রয় বিল</th>
                  <th className="py-3 px-3">সাপ্লাইয়ার</th>
                  <th className="py-3 px-3">ফেরতের কারণ</th>
                  <th className="py-3 px-3 text-right">সমন্বয় মূল্য</th>
                  <th className="py-3 px-3 text-center">স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {purchaseReturns.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-foreground">
                      <ArrowLeftRight className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      কোন ক্রয় ফেরত বা ডেবিট নোট রেকর্ড পাওয়া যায়নি।
                    </td>
                  </tr>
                ) : (
                  purchaseReturns.map((pr) => (
                    <tr key={pr.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-3">
                        <span className="font-mono font-bold text-foreground block">
                          {pr.returnNo}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          <DateTimeText date={pr.createdAt} showTime={false} />
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-mono font-semibold text-primary block">
                          {pr.billNo}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-semibold text-foreground block">
                          {pr.supplierName}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {pr.supplierPhone}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-muted-foreground">
                        {pr.reason || "-"}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-indigo-600">
                        <MoneyText amount={pr.amountCredited} />
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                          সম্পন্ন
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Slip Modal */}
      <ReturnSlipModal
        isOpen={!!slipRecord}
        onClose={() => setSlipRecord(null)}
        record={slipRecord}
      />

      {/* Sales Return Modal */}
      <NewSalesReturnModal
        isOpen={isSalesModalOpen}
        onClose={() => setIsSalesModalOpen(false)}
        accounts={accounts}
      />

      {/* Purchase Return Modal */}
      <NewPurchaseReturnModal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        purchases={recentPurchases}
        accounts={accounts}
      />
    </div>
  );
}
