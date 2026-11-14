"use client";

import React, { useState, useMemo } from "react";
import {
  BookOpen,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  Phone,
  MapPin,
  AlertTriangle,
  UserCheck,
  Truck,
  DollarSign,
  Scale,
  Receipt,
  Eye,
} from "lucide-react";
import { MoneyText } from "@/components/shared/MoneyText";
import { DateTimeText } from "@/components/shared/DateTimeText";
import { useHydratedLanguage } from "@/stores/language";
import { CustomerDueCollectionModal } from "./CustomerDueCollectionModal";
import { SupplierDuePaymentModal } from "./SupplierDuePaymentModal";
import { DueRepaymentReceiptModal } from "./DueRepaymentReceiptModal";
import { ContactLedgerModal } from "@/components/contacts/ContactLedgerModal";
import { useRouter } from "next/navigation";

export interface CustomerDueRecord {
  id: string;
  name: string;
  phone: string;
  address?: string | null;
  currentDue: number;
  creditLimit?: number | null;
  lastTransactionDate: string;
}

export interface SupplierDueRecord {
  id: string;
  name: string;
  phone: string;
  address?: string | null;
  currentDue: number;
  billCount: number;
  lastTransactionDate: string;
}

interface DueOverviewMetrics {
  totalCustomerReceivables: number;
  totalSupplierPayables: number;
  customerWithDueCount: number;
  supplierWithDueCount: number;
  netDifference: number;
}

interface DueLedgerManagerProps {
  overview: DueOverviewMetrics;
  customers: CustomerDueRecord[];
  suppliers: SupplierDueRecord[];
  accounts: Array<{ id: string; name: string; type: string }>;
}

export const DueLedgerManager: React.FC<DueLedgerManagerProps> = ({
  overview,
  customers,
  suppliers,
  accounts,
}) => {
  const router = useRouter();
  const { language } = useHydratedLanguage();
  const isBn = language === "bn";

  const [activeTab, setActiveTab] = useState<"CUSTOMERS" | "SUPPLIERS">("CUSTOMERS");
  const [search, setSearch] = useState("");

  // Modals state
  const [collectionModalOpen, setCollectionModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const [disbursementModalOpen, setDisbursementModalOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);

  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);

  const [ledgerContactId, setLedgerContactId] = useState<string | null>(null);

  // Filtered lists
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesName = c.name.toLowerCase().includes(q);
        const matchesPhone = c.phone.toLowerCase().includes(q);
        const matchesAddress = c.address?.toLowerCase().includes(q);
        if (!matchesName && !matchesPhone && !matchesAddress) return false;
      }
      return true;
    });
  }, [customers, search]);

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesName = s.name.toLowerCase().includes(q);
        const matchesPhone = s.phone.toLowerCase().includes(q);
        const matchesAddress = s.address?.toLowerCase().includes(q);
        if (!matchesName && !matchesPhone && !matchesAddress) return false;
      }
      return true;
    });
  }, [suppliers, search]);

  const handleOpenCollection = (custId?: string) => {
    setSelectedCustomerId(custId || null);
    setCollectionModalOpen(true);
  };

  const handleOpenDisbursement = (supId?: string) => {
    setSelectedSupplierId(supId || null);
    setDisbursementModalOpen(true);
  };

  const handleCollectionSuccess = (data: any) => {
    setReceiptData(data);
    setReceiptModalOpen(true);
    router.refresh();
  };

  const handleDisbursementSuccess = () => {
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Customer Receivables */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              {isBn ? "কাস্টমার পাওনা (বাকি)" : "Customer Receivables"}
            </span>
            <div className="text-xl sm:text-2xl font-black text-amber-600">
              <MoneyText amount={overview.totalCustomerReceivables} />
            </div>
            <div className="text-xs font-medium text-slate-500 mt-1">
              {isBn
                ? `${overview.customerWithDueCount} জন কাস্টমার বাকিদার`
                : `${overview.customerWithDueCount} customers owe`}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <ArrowDownLeft className="w-6 h-6" />
          </div>
        </div>

        {/* Supplier Payables */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              {isBn ? "সাপ্লাইয়ার দেনা (বাকি)" : "Supplier Payables"}
            </span>
            <div className="text-xl sm:text-2xl font-black text-blue-600">
              <MoneyText amount={overview.totalSupplierPayables} />
            </div>
            <div className="text-xs font-medium text-slate-500 mt-1">
              {isBn
                ? `${overview.supplierWithDueCount} টি সাপ্লাইয়ার বকেয়া`
                : `${overview.supplierWithDueCount} vendor payables`}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <ArrowUpRight className="w-6 h-6" />
          </div>
        </div>

        {/* Net Due Position */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              {isBn ? "নেট দেনা-পাওনা স্থিতি" : "Net Due Position"}
            </span>
            <div
              className={`text-xl sm:text-2xl font-black ${
                overview.netDifference >= 0 ? "text-emerald-600" : "text-red-600"
              }`}
            >
              <MoneyText amount={overview.netDifference} />
            </div>
            <div className="text-xs font-medium text-slate-500 mt-1">
              {overview.netDifference >= 0
                ? (isBn ? "পাওনা উদ্বৃত্ত" : "Net Receivable surplus")
                : (isBn ? "দেনা বেশি" : "Net Payable liability")}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Scale className="w-6 h-6" />
          </div>
        </div>

        {/* Quick Action Button */}
        <div className="bg-gradient-to-br from-amber-600 to-orange-700 p-4 rounded-2xl text-white shadow-md flex flex-col justify-between">
          <div>
            <span className="text-xs font-medium text-amber-100 uppercase tracking-wider block">
              {isBn ? "বাকি লেনদেন নিষ্পত্তি" : "Quick Settlement"}
            </span>
            <div className="text-lg font-bold mt-1">
              {isBn ? "টাকা জমা / প্রদান" : "Collect or Pay Dues"}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <button
              onClick={() => handleOpenCollection()}
              className="py-1.5 bg-white text-amber-800 hover:bg-amber-50 font-bold text-xs rounded-xl shadow-xs transition"
            >
              {isBn ? "আদায় করুন" : "Collect"}
            </button>
            <button
              onClick={() => handleOpenDisbursement()}
              className="py-1.5 bg-amber-900/40 text-white hover:bg-amber-900/60 font-bold text-xs rounded-xl border border-white/20 transition"
            >
              {isBn ? "পরিশোধ" : "Disburse"}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Tab Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("CUSTOMERS")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition ${
              activeTab === "CUSTOMERS"
                ? "bg-amber-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>{isBn ? "কাস্টমার বাকি খাতা (পাওনা)" : "Customer Receivables"}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === "CUSTOMERS" ? "bg-amber-700 text-white" : "bg-slate-200 text-slate-800"
              }`}
            >
              {customers.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("SUPPLIERS")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition ${
              activeTab === "SUPPLIERS"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>{isBn ? "সাপ্লাইয়ার বাকি খাতা (দেনা)" : "Supplier Payables"}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === "SUPPLIERS" ? "bg-blue-700 text-white" : "bg-slate-200 text-slate-800"
              }`}
            >
              {suppliers.length}
            </span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              activeTab === "CUSTOMERS"
                ? (isBn ? "কাস্টমার নাম বা ফোন..." : "Search customer...")
                : (isBn ? "সাপ্লাইয়ার নাম বা ফোন..." : "Search supplier...")
            }
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
          />
        </div>
      </div>

      {/* Tab 1: Customer Receivables Table */}
      {activeTab === "CUSTOMERS" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {filteredCustomers.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <UserCheck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <div className="text-sm font-bold text-slate-700">
                {isBn ? "কোন কাস্টমারের বাকি নেই" : "No customer dues found"}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {isBn ? "সকল কাস্টমারের হিসাব পরিশোধিত অবস্থায় রয়েছে" : "All customer accounts are clear"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">{isBn ? "কাস্টমার নাম" : "Customer Name"}</th>
                    <th className="py-3 px-4">{isBn ? "মোবাইল ও ঠিকানা" : "Phone & Address"}</th>
                    <th className="py-3 px-4 text-right">{isBn ? "বাকি সীমা (৳)" : "Credit Limit (৳)"}</th>
                    <th className="py-3 px-4 text-right">{isBn ? "বর্তমান বাকি (৳)" : "Current Due (৳)"}</th>
                    <th className="py-3 px-4">{isBn ? "সর্বশেষ লেনদেন" : "Last Transaction"}</th>
                    <th className="py-3 px-4 text-center">{isBn ? "অ্যাকশন" : "Actions"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredCustomers.map((c) => {
                    const isOverLimit = c.creditLimit && c.currentDue > c.creditLimit;

                    return (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition">
                        {/* Name */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 text-sm">{c.name}</div>
                          {isOverLimit && (
                            <span className="text-[10px] text-red-600 font-bold flex items-center gap-1 mt-0.5">
                              <AlertTriangle className="w-3 h-3" />
                              {isBn ? "বাকি সীমা অতিক্রান্ত!" : "Credit Limit Exceeded!"}
                            </span>
                          )}
                        </td>

                        {/* Phone & Address */}
                        <td className="py-3 px-4">
                          <div className="font-mono text-slate-800 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{c.phone}</span>
                          </div>
                          {c.address && (
                            <div className="text-[11px] text-slate-500 truncate max-w-xs mt-0.5">
                              {c.address}
                            </div>
                          )}
                        </td>

                        {/* Credit Limit */}
                        <td className="py-3 px-4 text-right font-mono text-slate-600">
                          {c.creditLimit ? <MoneyText amount={c.creditLimit} /> : "—"}
                        </td>

                        {/* Current Due */}
                        <td className="py-3 px-4 text-right font-mono font-bold text-sm text-red-600">
                          <MoneyText amount={c.currentDue} />
                        </td>

                        {/* Last Transaction */}
                        <td className="py-3 px-4 text-slate-500 font-mono">
                          <DateTimeText date={c.lastTransactionDate} showTime={false} />
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenCollection(c.id)}
                              className="px-2.5 py-1 text-[11px] font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs transition"
                            >
                              {isBn ? "বাকি আদায়" : "Collect"}
                            </button>
                            <button
                              title={isBn ? "খাতার বিবরণী দেখুন" : "View Statement"}
                              onClick={() => setLedgerContactId(c.id)}
                              className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition"
                            >
                              <BookOpen className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Supplier Payables Table */}
      {activeTab === "SUPPLIERS" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {filteredSuppliers.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <Truck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <div className="text-sm font-bold text-slate-700">
                {isBn ? "কোন সাপ্লাইয়ারের দেনা নেই" : "No supplier payables found"}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {isBn ? "সকল সাপ্লাইয়ারের বিল পরিশোধিত" : "All vendor bills are fully paid"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">{isBn ? "সাপ্লাইয়ার নাম" : "Supplier Name"}</th>
                    <th className="py-3 px-4">{isBn ? "মোবাইল ও ঠিকানা" : "Phone & Address"}</th>
                    <th className="py-3 px-4 text-center">{isBn ? "মোট চালানের সংখ্যা" : "Bills Count"}</th>
                    <th className="py-3 px-4 text-right">{isBn ? "প্রদেয় বাকি (৳)" : "Payable Due (৳)"}</th>
                    <th className="py-3 px-4">{isBn ? "সর্বশেষ লেনদেন" : "Last Transaction"}</th>
                    <th className="py-3 px-4 text-center">{isBn ? "অ্যাকশন" : "Actions"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredSuppliers.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition">
                      {/* Name */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-sm">{s.name}</div>
                      </td>

                      {/* Phone & Address */}
                      <td className="py-3 px-4">
                        <div className="font-mono text-slate-800 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{s.phone}</span>
                        </div>
                        {s.address && (
                          <div className="text-[11px] text-slate-500 truncate max-w-xs mt-0.5">
                            {s.address}
                          </div>
                        )}
                      </td>

                      {/* Bills Count */}
                      <td className="py-3 px-4 text-center font-mono">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-semibold">
                          {s.billCount} {isBn ? "টি চালান" : "bills"}
                        </span>
                      </td>

                      {/* Payable Due */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-sm text-blue-700">
                        <MoneyText amount={s.currentDue} />
                      </td>

                      {/* Last Transaction */}
                      <td className="py-3 px-4 text-slate-500 font-mono">
                        <DateTimeText date={s.lastTransactionDate} showTime={false} />
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenDisbursement(s.id)}
                            className="px-2.5 py-1 text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition"
                          >
                            {isBn ? "বাকি পরিশোধ" : "Disburse"}
                          </button>
                          <button
                            title={isBn ? "খাতার বিবরণী দেখুন" : "View Statement"}
                            onClick={() => setLedgerContactId(s.id)}
                            className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                          >
                            <BookOpen className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Customer Due Collection Modal */}
      <CustomerDueCollectionModal
        open={collectionModalOpen}
        onOpenChange={setCollectionModalOpen}
        customers={customers}
        accounts={accounts}
        preSelectedCustomerId={selectedCustomerId}
        onSuccess={handleCollectionSuccess}
      />

      {/* Supplier Due Disbursement Modal */}
      <SupplierDuePaymentModal
        open={disbursementModalOpen}
        onOpenChange={setDisbursementModalOpen}
        suppliers={suppliers}
        accounts={accounts}
        preSelectedSupplierId={selectedSupplierId}
        onSuccess={handleDisbursementSuccess}
      />

      {/* Repayment Receipt Voucher */}
      <DueRepaymentReceiptModal
        open={receiptModalOpen}
        onOpenChange={setReceiptModalOpen}
        data={receiptData}
      />

      {/* Contact Ledger Statement */}
      <ContactLedgerModal
        open={!!ledgerContactId}
        onOpenChange={(open) => !open && setLedgerContactId(null)}
        contactId={ledgerContactId}
      />
    </div>
  );
};
