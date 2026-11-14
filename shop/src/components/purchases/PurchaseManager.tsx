"use client";

import React, { useState } from "react";
import {
  Truck,
  Plus,
  Search,
  Calendar,
  FileText,
  DollarSign,
  AlertTriangle,
  ArrowDownLeft,
  Eye,
  Filter,
} from "lucide-react";
import { MoneyText } from "@/components/shared/MoneyText";
import { DateTimeText } from "@/components/shared/DateTimeText";
import { Pagination } from "@/components/shared/Pagination";
import { useHydratedLanguage } from "@/stores/language";
import { NewPurchaseModal } from "./NewPurchaseModal";
import { PurchaseBillModal } from "./PurchaseBillModal";
import { useRouter, useSearchParams } from "next/navigation";

export interface PurchaseRecord {
  id: string;
  billNo: string;
  supplierId: string;
  supplierName: string;
  supplierPhone: string;
  subtotal: number;
  taxAmount: number;
  discount: number;
  total: number;
  paid: number;
  due: number;
  note?: string | null;
  receivedDate: string;
  createdAt: string;
  itemCount: number;
}

interface PurchaseManagerProps {
  purchases: PurchaseRecord[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  suppliers: Array<{ id: string; name: string; phone: string }>;
  products: Array<{ id: string; name: string; sku: string; unit: string; avgCost: number }>;
  accounts: Array<{ id: string; name: string; type: string }>;
}

export const PurchaseManager: React.FC<PurchaseManagerProps> = ({
  purchases,
  totalCount,
  page,
  pageSize,
  totalPages,
  suppliers,
  products,
  accounts,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useHydratedLanguage();
  const isBn = language === "bn";

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");
  const [selectedSupplier, setSelectedSupplier] = useState(searchParams.get("supplierId") || "all");
  const [startDate, setStartDate] = useState(searchParams.get("startDate") || "");
  const [endDate, setEndDate] = useState(searchParams.get("endDate") || "");

  // Aggregate Metrics on currently loaded page
  const totalPurchasesAmount = purchases.reduce((acc, p) => acc + p.total, 0);
  const totalPaidAmount = purchases.reduce((acc, p) => acc + p.paid, 0);
  const totalDueAmount = purchases.reduce((acc, p) => acc + p.due, 0);

  const handleApplyFilters = () => {
    const params = new URLSearchParams();
    if (searchInput.trim()) params.set("search", searchInput.trim());
    if (selectedSupplier && selectedSupplier !== "all") params.set("supplierId", selectedSupplier);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    params.set("page", "1");
    router.push(`/purchases?${params.toString()}`);
  };

  const handleResetFilters = () => {
    setSearchInput("");
    setSelectedSupplier("all");
    setStartDate("");
    setEndDate("");
    router.push("/purchases");
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`/purchases?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Purchases */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              {isBn ? "মোট ক্রয় মূল্য" : "Total Purchases"}
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900">
              <MoneyText amount={totalPurchasesAmount} />
            </div>
            <div className="text-xs font-medium text-slate-500 mt-1">
              {isBn ? `মোট চালান: ${totalCount} টি` : `${totalCount} bills recorded`}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Truck className="w-6 h-6" />
          </div>
        </div>

        {/* Total Paid */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              {isBn ? "পরিশোধিত টাকা" : "Total Paid Out"}
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-600">
              <MoneyText amount={totalPaidAmount} />
            </div>
            <div className="text-xs font-medium text-emerald-700 mt-1">
              {isBn ? "নগদ ও ব্যাংকে নিষ্পত্তি" : "Settled from accounts"}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Total Due */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              {isBn ? "সাপ্লাইয়ার বাকি (Due)" : "Outstanding Due"}
            </span>
            <div className="text-xl sm:text-2xl font-black text-red-600">
              <MoneyText amount={totalDueAmount} />
            </div>
            <div className="text-xs font-medium text-red-600 mt-1">
              {isBn ? "ভবিষ্যতে প্রদেয় দেনা" : "Payable liability"}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Action Button Card */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-4 rounded-2xl text-white shadow-md flex flex-col justify-between">
          <div>
            <span className="text-xs font-medium text-blue-100 uppercase tracking-wider block">
              {isBn ? "নতুন স্টক গ্রহণ" : "Goods Inward (GRN)"}
            </span>
            <div className="text-lg font-bold mt-1">
              {isBn ? "নতুন চালান এন্ট্রি" : "Record Supplier Bill"}
            </div>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="mt-3 w-full py-2 bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>{isBn ? "নতুন ক্রয় করুন" : "New Purchase"}</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleApplyFilters()}
              placeholder={isBn ? "চালান নম্বর বা সাপ্লাইয়ার..." : "Search bill # or supplier..."}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          {/* Supplier */}
          <div>
            <select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="all">{isBn ? "সকল সাপ্লাইয়ার" : "All Suppliers"}</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>

          {/* End Date */}
          <div>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
          <button
            onClick={handleResetFilters}
            className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
          >
            {isBn ? "রিসেট" : "Reset"}
          </button>
          <button
            onClick={handleApplyFilters}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>{isBn ? "ফিল্টার প্রয়োগ" : "Apply Filters"}</span>
          </button>
        </div>
      </div>

      {/* Purchases Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {purchases.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Truck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <div className="text-sm font-bold text-slate-700">
              {isBn ? "কোন ক্রয়ের রেকর্ড পাওয়া যায়নি" : "No purchase records found"}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {isBn ? "নতুন চালান বা মালামাল এন্ট্রি করতে উপরের বাটনে চাপ দিন" : "Click 'New Purchase' to record goods received"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">{isBn ? "চালান নম্বর" : "Bill No"}</th>
                  <th className="py-3 px-4">{isBn ? "গ্রহণের তারিখ" : "Date"}</th>
                  <th className="py-3 px-4">{isBn ? "সাপ্লাইয়ার" : "Supplier"}</th>
                  <th className="py-3 px-4 text-center">{isBn ? "আইটেম সংখ্যা" : "Items"}</th>
                  <th className="py-3 px-4 text-right">{isBn ? "মোট বিল (৳)" : "Total Bill (৳)"}</th>
                  <th className="py-3 px-4 text-right">{isBn ? "পরিশোধ (৳)" : "Paid (৳)"}</th>
                  <th className="py-3 px-4 text-right">{isBn ? "বাকি (৳)" : "Due (৳)"}</th>
                  <th className="py-3 px-4 text-center">{isBn ? "অ্যাকশন" : "Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {purchases.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition">
                    {/* Bill No */}
                    <td className="py-3 px-4 font-mono font-bold text-blue-700">
                      #{p.billNo}
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4 text-slate-500 font-mono whitespace-nowrap">
                      <DateTimeText date={p.receivedDate} showTime={false} />
                    </td>

                    {/* Supplier */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{p.supplierName}</div>
                      <div className="text-[11px] font-mono text-slate-500">{p.supplierPhone}</div>
                    </td>

                    {/* Item Count */}
                    <td className="py-3 px-4 text-center font-mono">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-semibold">
                        {p.itemCount} {isBn ? "টি" : "items"}
                      </span>
                    </td>

                    {/* Total Bill */}
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      <MoneyText amount={p.total} />
                    </td>

                    {/* Paid */}
                    <td className="py-3 px-4 text-right font-mono text-emerald-600 font-semibold">
                      <MoneyText amount={p.paid} />
                    </td>

                    {/* Due */}
                    <td className="py-3 px-4 text-right font-mono font-bold">
                      {p.due > 0 ? (
                        <span className="text-red-600">
                          <MoneyText amount={p.due} />
                        </span>
                      ) : (
                        <span className="text-slate-400">৳০.০০</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setSelectedBillId(p.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{isBn ? "বিল দেখুন" : "View"}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex justify-center">
            <Pagination
              currentPage={page}
              totalItems={totalCount}
              pageSize={pageSize}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>

      {/* New Purchase Modal */}
      <NewPurchaseModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        suppliers={suppliers}
        products={products}
        accounts={accounts}
        onSuccess={() => {
          router.refresh();
        }}
      />

      {/* Purchase Bill View Modal */}
      <PurchaseBillModal
        open={!!selectedBillId}
        onOpenChange={(open) => !open && setSelectedBillId(null)}
        purchaseId={selectedBillId}
      />
    </div>
  );
};
