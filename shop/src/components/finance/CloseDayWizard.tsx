"use client";

import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Sunset,
  X,
  AlertCircle,
  Calculator,
  CheckCircle2,
  Lock,
  Printer,
  ChevronRight,
  ChevronLeft,
  UserCheck,
} from "lucide-react";
import { closeDayAction, type prepareClosingAction } from "@/actions/treasury";
import { toBnDigits } from "@/lib/bangla-numbers";
import { useHydratedLanguage } from "@/stores/language";

interface PrepareClosingData {
  session: {
    id: string;
    businessDate: string;
    openedAt: string;
    openedBy: { id: string; name: string; role: string };
  };
  accounts: {
    accountId: string;
    accountName: string;
    accountType: string;
    openingBalance: number;
    salesIn: number;
    otherIn: number;
    expensesOut: number;
    purchasesOut: number;
    transfersNet: number;
    expectedBalance: number;
  }[];
  cashierSummary: {
    userId: string;
    userName: string;
    userRole: string;
    orderCount: number;
    totalSales: number;
  }[];
  fingerprint: string;
}

interface CloseDayWizardProps {
  isOpen: boolean;
  onClose: () => void;
  prepData: PrepareClosingData;
  currentUserId: string;
  onSuccess?: () => void;
}

const DENOMINATIONS = [1000, 500, 200, 100, 50, 20, 10, 5, 2, 1] as const;

export const CloseDayWizard: React.FC<CloseDayWizardProps> = ({
  isOpen,
  onClose,
  prepData,
  currentUserId,
  onSuccess,
}) => {
  const { language } = useHydratedLanguage();
  const isBn = language === "bn";

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Cash Denominations
  const [denoms, setDenoms] = useState<Record<number, string>>({});
  const [useDenomCalc, setUseDenomCalc] = useState(false);

  // Counted amounts per account: accountId -> amount string
  const cashAcc = prepData.accounts.find((a) => a.accountType === "CASH");
  const [countedMap, setCountedMap] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const a of prepData.accounts) {
      init[a.accountId] = String(a.expectedBalance);
    }
    return init;
  });

  // Reasons per account: accountId -> string
  const [reasons, setReasons] = useState<Record<string, string>>({});

  // Approver
  const [approverPassword, setApproverPassword] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [closedResult, setClosedResult] = useState<{ id: string; closedAt: string | null } | null>(null);

  // Calculate sum of cash from denominations
  const denomTotal = DENOMINATIONS.reduce((sum, d) => {
    const count = Number(denoms[d] || 0);
    return sum + d * count;
  }, 0);

  const applyDenomToCash = () => {
    if (cashAcc) {
      setCountedMap((prev) => ({ ...prev, [cashAcc.accountId]: String(denomTotal) }));
    }
  };

  // Variances calculation
  const variances = prepData.accounts.map((a) => {
    const countedVal = Number(countedMap[a.accountId] || 0);
    const diff = Number((countedVal - a.expectedBalance).toFixed(2));
    return {
      ...a,
      counted: countedVal,
      variance: diff,
      hasVariance: Math.abs(diff) > 0.009,
    };
  });

  const totalVariance = variances.reduce((sum, v) => sum + v.variance, 0);
  const hasAnyVariance = variances.some((v) => v.hasVariance);

  const handleNextFromCounts = () => {
    setError(null);
    for (const a of prepData.accounts) {
      const val = Number(countedMap[a.accountId]);
      if (isNaN(val) || val < 0) {
        setError(
          isBn
            ? `${a.accountName} অ্যাকাউন্টের জন্য সঠিক টাকার সংখ্যা লিখুন`
            : `Please enter a valid count for ${a.accountName}`
        );
        return;
      }
    }
    setStep(4);
  };

  const handleFinalSubmit = async () => {
    setError(null);

    if (hasAnyVariance) {
      for (const v of variances) {
        if (v.hasVariance) {
          const r = reasons[v.accountId]?.trim();
          if (!r || r.length < 3) {
            setError(
              isBn
                ? `${v.accountName} এর পার্থক্যের জন্য কারণ উল্লেখ করুন (কমপক্ষে ৩ অক্ষর)`
                : `Please provide a reason for the variance in ${v.accountName}`
            );
            return;
          }
        }
      }

      if (!approverPassword) {
        setError(
          isBn
            ? "পার্থক্য অনুমোদন করতে অ্যাডমিন বা ওনারের পাসওয়ার্ড দিন"
            : "Approver password is required to authorize the variance"
        );
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        counted: prepData.accounts.map((a) => ({
          accountId: a.accountId,
          amount: Number(countedMap[a.accountId] || 0),
          reason: reasons[a.accountId]?.trim() || undefined,
        })),
        fingerprint: prepData.fingerprint,
        approverId: currentUserId,
        approverPassword: approverPassword || undefined,
        note: note.trim() || undefined,
      };

      const res = await closeDayAction(payload);
      if (!res.success) {
        setError(res.error);
        return;
      }

      setClosedResult({ id: res.id, closedAt: res.closedAt });
      setStep(5);
      onSuccess?.();
    } catch (err: any) {
      setError(err?.message || "Failed to close trading day");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && !submitting && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 animate-in fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-2xl p-6 z-50 border border-slate-100 animate-in zoom-in-95">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-rose-50 text-rose-700 rounded-lg">
                <Sunset className="w-5 h-5" />
              </div>
              <div>
                <Dialog.Title className="text-base font-bold text-slate-900">
                  {isBn ? "দিনের হিসাব সমাপ্ত ও ক্লোজিং (Close Day)" : "Daily Closing & Reconciliation"}
                </Dialog.Title>
                <span className="text-xs text-slate-600 block">
                  {isBn ? "ধাপ" : "Step"} {step} / 5
                </span>
              </div>
            </div>
            {step !== 5 && (
              <Dialog.Close className="text-slate-400 hover:text-slate-600 p-1 rounded-md">
                <X className="w-5 h-5" />
              </Dialog.Close>
            )}
          </div>

          {error && (
            <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Expected Balances & Cashier Summary */}
          {step === 1 && (
            <div className="mt-4 space-y-4">
              <div className="text-xs text-slate-600">
                {isBn
                  ? "আজকের দিনের প্রারম্ভিক হিসাব, বিক্রয়, ব্যয় ও ট্রান্সফারের ভিত্তিতে সিস্টেমের হিসাবকৃত প্রত্যাশিত ব্যালেন্স:"
                  : "Expected balances based on today's opening float, sales, expenses, and account transfers:"}
              </div>

              <div className="border border-slate-200 rounded-lg overflow-x-auto">
                <table className="w-full min-w-[500px] text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="p-2.5">{isBn ? "অ্যাকাউন্ট" : "Account"}</th>
                      <th className="p-2.5 text-right">{isBn ? "প্রারম্ভিক" : "Opening"}</th>
                      <th className="p-2.5 text-right">{isBn ? "বিক্রয়/আগমী" : "Inflows"}</th>
                      <th className="p-2.5 text-right">{isBn ? "ব্যয়/নির্গমী" : "Outflows"}</th>
                      <th className="p-2.5 text-right">{isBn ? "প্রত্যাশিত স্থিতি" : "Expected"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {prepData.accounts.map((a) => (
                      <tr key={a.accountId} className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-slate-800">
                          {a.accountName} <span className="text-xs text-slate-500 font-normal">({a.accountType})</span>
                        </td>
                        <td className="p-2.5 text-right tabular-nums text-slate-600">
                          ৳{isBn ? toBnDigits(a.openingBalance.toFixed(2)) : a.openingBalance.toFixed(2)}
                        </td>
                        <td className="p-2.5 text-right tabular-nums text-emerald-600 font-semibold">
                          +৳{isBn ? toBnDigits((a.salesIn + a.otherIn).toFixed(2)) : (a.salesIn + a.otherIn).toFixed(2)}
                        </td>
                        <td className="p-2.5 text-right tabular-nums text-rose-600 font-semibold">
                          -৳{isBn ? toBnDigits((a.expensesOut + a.purchasesOut).toFixed(2)) : (a.expensesOut + a.purchasesOut).toFixed(2)}
                        </td>
                        <td className="p-2.5 text-right tabular-nums font-black text-slate-900">
                          ৳{isBn ? toBnDigits(a.expectedBalance.toFixed(2)) : a.expectedBalance.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Cashier breakdown */}
              {prepData.cashierSummary.length > 0 && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-slate-600" />
                    {isBn ? "আজকের ক্যাশিয়ার ও কর্মীদের বিক্রয় অবদান:" : "Sales contribution by cashier/user today:"}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {prepData.cashierSummary.map((c) => (
                      <div key={c.userId} className="p-2 bg-white rounded border border-slate-200 flex justify-between items-center">
                        <div>
                          <span className="font-bold text-slate-800 block">{c.userName}</span>
                          <span className="text-[10px] text-slate-600">{c.userRole} • {c.orderCount} orders</span>
                        </div>
                        <span className="font-black text-slate-900 tabular-nums">
                          ৳{isBn ? toBnDigits(c.totalSales.toFixed(2)) : c.totalSales.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="h-9 px-4 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>{isBn ? "পরবর্তী: ক্যাশ গণনা" : "Next: Count Cash"}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Cash Drawer Count & Denomination Calculator */}
          {step === 2 && (
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600 font-medium">
                  {isBn ? "ক্যাশ ড্রয়ারের প্রকৃত টাকা গণনা করুন:" : "Count actual physical cash in the drawer:"}
                </span>
                <button
                  type="button"
                  onClick={() => setUseDenomCalc(!useDenomCalc)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>{useDenomCalc ? (isBn ? "সাধারণ ইনপুট" : "Direct Input") : isBn ? "নোট গণনা ক্যালকুলেটর" : "Denomination Calculator"}</span>
                </button>
              </div>

              {cashAcc && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">
                    {isBn ? "প্রত্যাশিত ক্যাশ ড্রয়ার ব্যালেন্স:" : "Expected Drawer Balance:"}
                  </span>
                  <span className="text-sm font-black text-slate-900 tabular-nums">
                    ৳{isBn ? toBnDigits(cashAcc.expectedBalance.toFixed(2)) : cashAcc.expectedBalance.toFixed(2)}
                  </span>
                </div>
              )}

              {useDenomCalc ? (
                <div className="p-3 bg-indigo-50/50 border border-indigo-200 rounded-lg space-y-3">
                  <span className="text-xs font-bold text-indigo-900 block">
                    {isBn ? "নোটের সংখ্যা লিখুন:" : "Enter count of each denomination note:"}
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    {DENOMINATIONS.map((d) => (
                      <div key={d} className="flex items-center gap-1.5 bg-white p-1.5 rounded border border-indigo-100">
                        <span className="w-12 font-bold text-slate-700 tabular-nums">৳{d} ×</span>
                        <input
                          type="number"
                          min={0}
                          value={denoms[d] ?? ""}
                          placeholder="0"
                          onChange={(e) => {
                            const val = e.target.value;
                            setDenoms((prev) => ({ ...prev, [d]: val }));
                          }}
                          className="w-full h-7 px-1.5 text-center font-bold text-slate-900 border border-slate-200 rounded"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-indigo-100">
                    <span className="text-xs font-bold text-indigo-950">
                      {isBn ? "মোট নোট গণনা:" : "Total Denomination Sum:"} ৳{isBn ? toBnDigits(denomTotal.toFixed(2)) : denomTotal.toFixed(2)}
                    </span>
                    <button
                      type="button"
                      onClick={applyDenomToCash}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded cursor-pointer"
                    >
                      {isBn ? "ক্যাশ গণনায় প্রয়োগ করুন" : "Apply to Counted Cash"}
                    </button>
                  </div>
                </div>
              ) : null}

              {cashAcc && (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {isBn ? "গণনাকৃত প্রকৃত ক্যাশ (৳)" : "Counted Physical Cash (৳)"}
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    required
                    value={countedMap[cashAcc.accountId] ?? ""}
                    placeholder="0.00"
                    onChange={(e) => {
                      const val = e.target.value;
                      setCountedMap((prev) => ({ ...prev, [cashAcc.accountId]: val }));
                    }}
                    className="w-full h-11 px-3 bg-white border border-slate-200 rounded-lg text-lg font-black text-slate-900"
                  />
                </div>
              )}

              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="h-9 px-3 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>{isBn ? "পূর্ববর্তী" : "Back"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="h-9 px-4 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>{isBn ? "পরবর্তী: ব্যাংক ও বিকাশ" : "Next: Bank & Mobile"}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Bank & Mobile Wallet App Count */}
          {step === 3 && (
            <div className="mt-4 space-y-4">
              <span className="text-xs text-slate-600 font-medium block">
                {isBn
                  ? "ব্যাংক ও বিকাশ/নগদ অ্যাপ থেকে বর্তমান সমাপনী ব্যালেন্স নিশ্চিত করুন:"
                  : "Verify statement / app balances for Bank and Mobile Wallets:"}
              </span>

              <div className="space-y-3">
                {prepData.accounts
                  .filter((a) => a.accountType !== "CASH")
                  .map((a) => (
                    <div key={a.accountId} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="font-bold text-slate-900 block text-xs">
                          {a.accountName} <span className="text-[10px] text-slate-600">({a.accountType})</span>
                        </span>
                        <span className="text-[11px] text-slate-600">
                          {isBn ? "প্রত্যাশিত:" : "Expected:"} ৳
                          {isBn ? toBnDigits(a.expectedBalance.toFixed(2)) : a.expectedBalance.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-600">{isBn ? "গণনা:" : "Counted:"}</span>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={countedMap[a.accountId] ?? ""}
                          placeholder="0.00"
                          onChange={(e) => {
                            const val = e.target.value;
                            setCountedMap((prev) => ({ ...prev, [a.accountId]: val }));
                          }}
                          className="w-36 h-9 px-2 bg-white border border-slate-200 rounded font-bold text-slate-900 text-sm text-right"
                        />
                      </div>
                    </div>
                  ))}
              </div>

              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="h-9 px-3 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>{isBn ? "পূর্ববর্তী" : "Back"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleNextFromCounts}
                  className="h-9 px-4 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>{isBn ? "পরবর্তী: পার্থক্য ও অনুমোদন" : "Next: Review Variances"}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Variances Review & Authorization */}
          {step === 4 && (
            <div className="mt-4 space-y-4">
              <span className="text-xs text-slate-600 font-medium block">
                {isBn ? "হিসাব মেলানো ও পার্থক্য সারসংক্ষেপ:" : "Reconciliation & Variance Summary:"}
              </span>

              <div className="border border-slate-200 rounded-lg overflow-x-auto text-xs">
                <table className="w-full min-w-[420px] text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="p-2.5">{isBn ? "অ্যাকাউন্ট" : "Account"}</th>
                      <th className="p-2.5 text-right">{isBn ? "প্রত্যাশিত" : "Expected"}</th>
                      <th className="p-2.5 text-right">{isBn ? "গণনাকৃত" : "Counted"}</th>
                      <th className="p-2.5 text-right">{isBn ? "পার্থক্য" : "Variance"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {variances.map((v) => (
                      <tr key={v.accountId} className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-slate-800">{v.accountName}</td>
                        <td className="p-2.5 text-right tabular-nums text-slate-600">
                          ৳{isBn ? toBnDigits(v.expectedBalance.toFixed(2)) : v.expectedBalance.toFixed(2)}
                        </td>
                        <td className="p-2.5 text-right tabular-nums font-bold text-slate-900">
                          ৳{isBn ? toBnDigits(v.counted.toFixed(2)) : v.counted.toFixed(2)}
                        </td>
                        <td
                          className={`p-2.5 text-right tabular-nums font-black ${
                            v.variance === 0
                              ? "text-emerald-600"
                              : v.variance > 0
                              ? "text-blue-600"
                              : "text-rose-600"
                          }`}
                        >
                          {v.variance > 0 ? "+" : ""}৳
                          {isBn ? toBnDigits(v.variance.toFixed(2)) : v.variance.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {hasAnyVariance ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-3">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-700" />
                    <span>
                      {isBn
                        ? "পার্থক্য পাওয়া গেছে! প্রতিটি পার্থক্যের কারণ এবং ওনার/অ্যাডমিন পাসওয়ার্ড দিয়ে অনুমোদন দিন:"
                        : "Variance detected! Enter variance reasons and Owner/Admin authorization password:"}
                    </span>
                  </div>

                  {variances
                    .filter((v) => v.hasVariance)
                    .map((v) => (
                      <div key={v.accountId} className="space-y-1">
                        <label className="text-xs font-bold text-slate-800 block">
                          {v.accountName} {isBn ? "পার্থক্য কারণ" : "Variance Reason"} ({v.variance > 0 ? "+" : ""}৳{v.variance}):
                        </label>
                        <input
                          type="text"
                          required
                          value={reasons[v.accountId] ?? ""}
                          placeholder={isBn ? "যেমন: ভাংতি কয়েনের পার্থক্য, বকশিশ" : "e.g., Coin roundoff difference, tip"}
                          onChange={(e) => {
                            const val = e.target.value;
                            setReasons((prev) => ({ ...prev, [v.accountId]: val }));
                          }}
                          className="w-full h-8 px-2.5 bg-white border border-amber-300 rounded text-xs text-slate-900"
                        />
                      </div>
                    ))}

                  <div className="pt-2 border-t border-amber-200 space-y-1">
                    <label className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-amber-700" />
                      {isBn ? "অনুমোদনকারীর পাসওয়ার্ড (Owner/Admin Password):" : "Approver Password (Owner/Admin):"}
                    </label>
                    <input
                      type="password"
                      required
                      value={approverPassword}
                      placeholder="••••••••"
                      onChange={(e) => setApproverPassword(e.target.value)}
                      className="w-full h-9 px-3 bg-white border border-amber-300 rounded-lg text-sm text-slate-900"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-emerald-800 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    {isBn
                      ? "কোনো অমিল নেই! প্রত্যাশিত ও গণনাকৃত ব্যালেন্স হুবহু মিলে গেছে।"
                      : "Zero variance! Counted balances match expected balances exactly."}
                  </span>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {isBn ? "সমাপনী নোট (ঐচ্ছিক)" : "Closing Note (Optional)"}
                </label>
                <input
                  type="text"
                  maxLength={200}
                  value={note}
                  placeholder={isBn ? "সারাদিনের সাধারণ নোট" : "General end of day notes"}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full h-8 px-2.5 bg-white border border-slate-200 rounded text-xs"
                />
              </div>

              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="h-9 px-3 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>{isBn ? "পূর্ববর্তী" : "Back"}</span>
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleFinalSubmit}
                  className="h-9 px-5 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white text-xs font-black transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Lock className="w-4 h-4" />
                  <span>{submitting ? (isBn ? "লক ও বন্ধ হচ্ছে..." : "Locking & Closing...") : isBn ? "দিনের হিসাব লক ও বন্ধ করুন" : "Confirm & Lock Day Close"}</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Printable Closing Statement */}
          {step === 5 && (
            <div className="mt-4 space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-center space-y-1">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <span className="text-sm font-black text-emerald-900 block">
                  {isBn ? "দিনের হিসাব সফলভাবে সমাপ্ত ও লক করা হয়েছে!" : "Day closed and reconciled successfully!"}
                </span>
                <span className="text-xs text-emerald-700">
                  {isBn
                    ? "আজকের সমাপনী স্থিতি পরবর্তী সেশনের প্রারম্ভিক স্থিতি হিসেবে স্বয়ংক্রিয়ভাবে সংরক্ষিত হয়েছে।"
                    : "Closing balances are permanently locked and carried forward to the next session."}
                </span>
              </div>

              {/* Printable Closing Slip */}
              <div id="printable-closing-slip" className="p-4 border border-slate-300 rounded-lg bg-white space-y-3 text-xs">
                <div className="text-center pb-2 border-b border-slate-200">
                  <span className="text-sm font-black text-slate-900 block">
                    {isBn ? "দৈনিক ক্যাশ ও ব্যাংক ক্লোজিং স্টেটমেন্ট" : "Daily Cash & Bank Reconciliation Statement"}
                  </span>
                  <span className="text-slate-600 text-[11px]">
                    {isBn ? "তারিখ:" : "Date:"} {new Date().toLocaleDateString("en-GB", { timeZone: "Asia/Dhaka" })}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {variances.map((v) => (
                    <div key={v.accountId} className="flex justify-between items-center py-1 border-b border-slate-100">
                      <div>
                        <span className="font-bold text-slate-800">{v.accountName}</span>
                        {v.hasVariance && (
                          <span className="text-[10px] text-slate-600 block">
                            {isBn ? "কারণ:" : "Reason:"} {reasons[v.accountId] || "None"}
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-900 block">
                          ৳{isBn ? toBnDigits(v.counted.toFixed(2)) : v.counted.toFixed(2)}
                        </span>
                        {v.hasVariance && (
                          <span className={`text-[10px] font-bold ${v.variance > 0 ? "text-blue-600" : "text-rose-600"}`}>
                            {v.variance > 0 ? "+" : ""}৳{isBn ? toBnDigits(v.variance.toFixed(2)) : v.variance.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-6 grid grid-cols-2 text-center text-slate-600 text-[11px]">
                  <div className="border-t border-slate-300 pt-1 mx-4">
                    {isBn ? "ক্যাশিয়ার / প্রস্তুতকারক" : "Cashier / Prepared By"}
                  </div>
                  <div className="border-t border-slate-300 pt-1 mx-4">
                    {isBn ? "ম্যানেজার / ওনার স্বাক্ষর" : "Authorized Approver"}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="h-9 px-4 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 flex items-center gap-1.5 hover:bg-slate-50 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>{isBn ? "প্রিন্ট করুন" : "Print Statement"}</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="h-9 px-5 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 cursor-pointer"
                >
                  {isBn ? "সম্পন্ন" : "Done"}
                </button>
              </div>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
