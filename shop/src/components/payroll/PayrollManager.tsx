"use client";

import React, { useState } from "react";
import {
  Users,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Calendar,
  Search,
  SlidersHorizontal,
  Printer,
  Sparkles,
  ChevronRight,
  CheckCheck,
  PlusCircle,
  Loader2,
  Clock,
} from "lucide-react";
import { MoneyText } from "@/components/shared/MoneyText";
import { DateTimeText } from "@/components/shared/DateTimeText";
import { PayslipModal } from "./PayslipModal";
import { SalaryAdjustmentModal } from "./SalaryAdjustmentModal";
import { DisburseSalaryModal } from "./DisburseSalaryModal";
import { BatchDisburseModal } from "./BatchDisburseModal";
import { generateMonthlyPayrollAction } from "@/actions/payroll";
import { useRouter, useSearchParams } from "next/navigation";

const BENGALI_MONTHS = [
  "",
  "জানুয়ারি",
  "ফেব্রুয়ারি",
  "মার্চ",
  "এপ্রিল",
  "মে",
  "জুন",
  "জুলাই",
  "আগস্ট",
  "সেপ্টেম্বর",
  "অক্টোবর",
  "নভেম্বর",
  "ডিসেম্বর",
];

export interface PayrollRecordItem {
  id: string;
  contactId: string;
  employeeName: string;
  employeePhone: string;
  designation: string;
  month: number;
  year: number;
  baseSalary: number;
  bonus: number;
  deduction: number;
  netPayable: number;
  paidAmount: number;
  pendingAmount: number;
  status: string;
  notes?: string | null;
  paymentDate?: string | null;
  accountId?: string | null;
  accountName?: string | null;
  createdAt: string;
}

interface PayrollManagerProps {
  month: number;
  year: number;
  records: PayrollRecordItem[];
  metrics: {
    totalPayable: number;
    totalPaid: number;
    totalPending: number;
    staffCount: number;
    activeEmployeesCount: number;
    paidStaffCount: number;
    unpaidStaffCount: number;
  };
  accounts: Array<{ id: string; name: string; type: string }>;
}

export function PayrollManager({
  month,
  year,
  records,
  metrics,
  accounts,
}: PayrollManagerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [selectedStatus, setSelectedStatus] = useState<string>(
    searchParams.get("status") || "ALL"
  );
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  // Modals state
  const [payslipRecord, setPayslipRecord] = useState<PayrollRecordItem | null>(null);
  const [adjustRecord, setAdjustRecord] = useState<PayrollRecordItem | null>(null);
  const [disburseRecord, setDisburseRecord] = useState<PayrollRecordItem | null>(null);
  const [isBatchOpen, setIsBatchOpen] = useState(false);

  const monthName = BENGALI_MONTHS[month] || `মাস ${month}`;

  // Period changes
  const handlePeriodChange = (newMonth: number, newYear: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", String(newMonth));
    params.set("year", String(newYear));
    router.push(`/payroll?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (search.trim()) {
      params.set("search", search.trim());
    } else {
      params.delete("search");
    }
    if (selectedStatus && selectedStatus !== "ALL") {
      params.set("status", selectedStatus);
    } else {
      params.delete("status");
    }
    router.push(`/payroll?${params.toString()}`);
  };

  const handleStatusFilter = (st: string) => {
    setSelectedStatus(st);
    const params = new URLSearchParams(searchParams.toString());
    if (st && st !== "ALL") {
      params.set("status", st);
    } else {
      params.delete("status");
    }
    router.push(`/payroll?${params.toString()}`);
  };

  const handleGenerateSheet = async () => {
    setGenError(null);
    setGenerating(true);
    try {
      const res = await generateMonthlyPayrollAction({ month, year });
      if (!res.success) {
        setGenError(res.error || "Failed to generate monthly payroll sheet.");
        return;
      }
      router.refresh();
    } catch (err: any) {
      setGenError(err?.message || "Error generating payroll sheet");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Period Selector Bar & Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 bg-card rounded-xl border shadow-sm">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary shrink-0" />
          <div className="flex items-center gap-2">
            <select
              value={month}
              onChange={(e) => handlePeriodChange(parseInt(e.target.value, 10), year)}
              className="px-3 py-1.5 border rounded-lg text-sm font-semibold bg-background outline-none focus:ring-2 focus:ring-primary/20"
            >
              {BENGALI_MONTHS.slice(1).map((mName, idx) => (
                <option key={idx + 1} value={idx + 1}>
                  {mName}
                </option>
              ))}
            </select>

            <select
              value={year}
              onChange={(e) => handlePeriodChange(month, parseInt(e.target.value, 10))}
              className="px-3 py-1.5 border rounded-lg text-sm font-mono font-semibold bg-background outline-none focus:ring-2 focus:ring-primary/20"
            >
              {[2024, 2025, 2026, 2027, 2028].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {records.length === 0 ? (
            <button
              onClick={handleGenerateSheet}
              disabled={generating}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium shadow-sm disabled:opacity-50"
            >
              {generating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <PlusCircle className="w-3.5 h-3.5" />
              )}
              {monthName} {year}-এর বেতন শীট তৈরি করুন
            </button>
          ) : (
            <>
              {metrics.totalPending > 0 && (
                <button
                  onClick={() => setIsBatchOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium shadow-sm"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  এক ক্লিকে সকল বকেয়া পরিশোধ
                </button>
              )}
              <button
                onClick={handleGenerateSheet}
                disabled={generating}
                title="নতুন যোগ হওয়া কর্মীদের শীটে অন্তর্ভুক্ত করুন"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border rounded-lg hover:bg-muted font-medium"
              >
                {generating ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3 text-amber-500" />
                )}
                শীট রিফ্রেশ
              </button>
            </>
          )}
        </div>
      </div>

      {genError && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg flex items-center gap-2 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{genError}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 bg-card rounded-xl border shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-medium">মোট প্রদেয় বেতন</span>
            <DollarSign className="w-4 h-4 text-primary" />
          </div>
          <div className="text-xl font-bold font-mono">
            <MoneyText amount={metrics.totalPayable} />
          </div>
          <span className="text-[10px] text-muted-foreground">
            {records.length} জন কর্মীর নিট বেতন
          </span>
        </div>

        <div className="p-3.5 bg-card rounded-xl border shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-medium">পরিশোধিত অর্থ</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-600">
            <MoneyText amount={metrics.totalPaid} />
          </div>
          <span className="text-[10px] text-muted-foreground">
            {metrics.paidStaffCount} জনের বেতন সম্পন্ন
          </span>
        </div>

        <div className="p-3.5 bg-card rounded-xl border shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-medium">বকেয়া বেতন</span>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-xl font-bold font-mono text-rose-600">
            <MoneyText amount={metrics.totalPending} />
          </div>
          <span className="text-[10px] text-muted-foreground">
            {metrics.unpaidStaffCount} জনের বকেয়া আছে
          </span>
        </div>

        <div className="p-3.5 bg-card rounded-xl border shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-medium">মোট সক্রিয় কর্মী</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-bold font-mono text-indigo-600">
            {metrics.activeEmployeesCount} জন
          </div>
          <span className="text-[10px] text-muted-foreground">কন্টাক্ট ডিরেক্টরিতে রক্ষিত</span>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          {[
            { id: "ALL", label: "সকল কর্মী" },
            { id: "UNPAID", label: "বকেয়া (Unpaid)" },
            { id: "PARTIAL", label: "আংশিক (Partial)" },
            { id: "PAID", label: "পরিশোধিত (Paid)" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleStatusFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                selectedStatus === tab.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/50 hover:bg-muted text-muted-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} className="relative sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="নাম, ফোন বা পদবি..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs border rounded-lg bg-background outline-none focus:ring-2 focus:ring-primary/20"
          />
        </form>
      </div>

      {/* Payroll Table */}
      <div className="border rounded-xl bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/50 border-b text-muted-foreground font-semibold">
              <tr>
                <th className="py-3 px-3">কর্মচারীর নাম ও পদবি</th>
                <th className="py-3 px-3 text-right">মূল বেতন</th>
                <th className="py-3 px-3 text-right">বোনাস (+)</th>
                <th className="py-3 px-3 text-right">কর্তন (-)</th>
                <th className="py-3 px-3 text-right">নিট প্রদেয়</th>
                <th className="py-3 px-3 text-right">পরিশোধিত</th>
                <th className="py-3 px-3 text-center">স্ট্যাটাস</th>
                <th className="py-3 px-3 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    {monthName} {year}-এর জন্য কোনো বেতন রেকর্ড পাওয়া যায়নি।
                    <div className="mt-2">
                      <button
                        onClick={handleGenerateSheet}
                        disabled={generating}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        এখনই বেতন শীট তৈরি করুন
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                records.map((r) => {
                  const isPaid = r.status === "PAID";
                  const isPartial = r.status === "PARTIAL";

                  return (
                    <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-3">
                        <span className="font-semibold text-foreground block">
                          {r.employeeName}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                          <span className="font-medium text-primary/80">{r.designation}</span>
                          <span>•</span>
                          <span className="font-mono">{r.employeePhone}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-medium text-foreground">
                        <MoneyText amount={r.baseSalary} />
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-emerald-600">
                        {r.bonus > 0 ? (
                          <>+<MoneyText amount={r.bonus} /></>
                        ) : (
                          <span className="text-muted-foreground/50">-</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-rose-600">
                        {r.deduction > 0 ? (
                          <>-<MoneyText amount={r.deduction} /></>
                        ) : (
                          <span className="text-muted-foreground/50">-</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-foreground">
                        <MoneyText amount={r.netPayable} />
                      </td>

                      <td className="py-3 px-3 text-right font-mono">
                        <span className={r.paidAmount > 0 ? "text-emerald-600 font-semibold" : "text-muted-foreground"}>
                          <MoneyText amount={r.paidAmount} />
                        </span>
                        {r.pendingAmount > 0 && (
                          <span className="block text-[10px] text-rose-600 font-medium">
                            বাকি: <MoneyText amount={r.pendingAmount} />
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            isPaid
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                              : isPartial
                              ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30"
                              : "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30"
                          }`}
                        >
                          {isPaid ? "পরিশোধিত" : isPartial ? "আংশিক" : "বকেয়া"}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setAdjustRecord(r)}
                            title="বোনাস ও কর্তন সমন্বয়"
                            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setPayslipRecord(r)}
                            title="বেতন রশিদ প্রিন্ট"
                            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {!isPaid && (
                            <button
                              onClick={() => setDisburseRecord(r)}
                              className="px-2 py-1 text-[11px] bg-emerald-600 text-white rounded font-medium hover:bg-emerald-700 flex items-center gap-1 shadow-sm"
                            >
                              <DollarSign className="w-3 h-3" />
                              পরিশোধ
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payslip Modal */}
      <PayslipModal
        isOpen={!!payslipRecord}
        onClose={() => setPayslipRecord(null)}
        record={payslipRecord}
      />

      {/* Salary Adjustment Modal */}
      <SalaryAdjustmentModal
        isOpen={!!adjustRecord}
        onClose={() => setAdjustRecord(null)}
        record={adjustRecord}
      />

      {/* Disburse Modal */}
      <DisburseSalaryModal
        isOpen={!!disburseRecord}
        onClose={() => setDisburseRecord(null)}
        record={disburseRecord}
        accounts={accounts}
      />

      {/* Batch Disburse Modal */}
      <BatchDisburseModal
        isOpen={isBatchOpen}
        onClose={() => setIsBatchOpen(false)}
        month={month}
        year={year}
        monthName={monthName}
        totalPendingAmount={metrics.totalPending}
        unpaidStaffCount={metrics.unpaidStaffCount}
        accounts={accounts}
      />
    </div>
  );
}
