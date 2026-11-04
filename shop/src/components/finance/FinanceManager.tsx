"use client";

import React, { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Wallet,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Filter,
  X,
  Ban,
  AlertCircle,
  Building2,
  Smartphone,
  Banknote,
  Calendar,
  Scale,
} from "lucide-react";
import { MoneyText } from "@/components/shared/MoneyText";
import { DateTimeText } from "@/components/shared/DateTimeText";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Pagination } from "@/components/shared/Pagination";
import { TableSkeleton } from "@/components/shared/Skeleton";
import { addManualTransactionAction, voidTransactionAction } from "@/actions/finance";
import { toBnDigits } from "@/lib/bangla-numbers";
import { cn } from "@/lib/utils";

interface FinanceAccount {
  id: string;
  name: string;
  type: string;
  balance: number;
}

interface TxCategoryItem {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
}

interface TransactionRecord {
  id: string;
  type: "INCOME" | "EXPENSE";
  source: "SALE" | "PURCHASE" | "MANUAL";
  amount: number;
  accountName: string;
  categoryName: string;
  description: string;
  occurredAt: string;
  voidedAt: string | null;
}

interface AccountClosingItem {
  id: string;
  name: string;
  type: string;
  openingBalance: number;
  inflows: number;
  outflows: number;
  closingBalance: number;
}

interface FinanceManagerProps {
  accounts: FinanceAccount[];
  categories: TxCategoryItem[];
  transactions: TransactionRecord[];
  closingBalanceSummary?: {
    openingTotal: number;
    inflowsTotal: number;
    outflowsTotal: number;
    closingTotal: number;
    accounts: AccountClosingItem[];
  };
  currentPeriod?: string;
  periodLabel?: string;
}

export const FinanceManager: React.FC<FinanceManagerProps> = ({
  accounts,
  categories,
  transactions,
  closingBalanceSummary,
  currentPeriod = "today",
  periodLabel = "আজ",
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"INCOME" | "EXPENSE">("EXPENSE");

  // Date / Month filter states (Default = today)
  const currentStart = searchParams.get("startDate") || "";
  const currentEnd = searchParams.get("endDate") || "";
  const [periodFilter, setPeriodFilter] = useState(currentPeriod);
  const [customStart, setCustomStart] = useState(currentStart);
  const [customEnd, setCustomEnd] = useState(currentEnd);
  const [isPending, startTransition] = useTransition();

  // Add transaction form state
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Void confirmation state
  const [voidingTxId, setVoidingTxId] = useState<string | null>(null);
  const [isVoiding, setIsVoiding] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const totalBalance = accounts.reduce((acc, a) => acc + a.balance, 0);

  const filteredTransactions = transactions.filter((t) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      q === "" ||
      t.description.toLowerCase().includes(q) ||
      t.accountName.toLowerCase().includes(q) ||
      t.categoryName.toLowerCase().includes(q);

    let matchesType = true;
    if (typeFilter !== "all") matchesType = t.type === typeFilter;

    return matchesSearch && matchesType;
  });

  const paginatedTransactions = filteredTransactions.slice((page - 1) * pageSize, page * pageSize);

  const handlePeriodChange = (newPeriod: string) => {
    setPeriodFilter(newPeriod);
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", newPeriod);
    if (newPeriod !== "custom") {
      params.delete("startDate");
      params.delete("endDate");
      startTransition(() => {
        router.push(`/finance?${params.toString()}`);
      });
    }
  };

  const handleCustomDateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", "custom");
    params.set("startDate", customStart);
    params.set("endDate", customEnd);
    startTransition(() => {
      router.push(`/finance?${params.toString()}`);
    });
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !accountId) return;
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await addManualTransactionAction({
        type: modalType,
        amount: Number(amount),
        accountId,
        categoryId: categoryId || undefined,
        description: description.trim() || undefined,
      });

      if (!res.success) {
        setError(res.error);
        return;
      }

      setIsModalOpen(false);
      setAmount("");
      setDescription("");
    } catch (err: any) {
      setError(err?.message || "Failed to record transaction");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVoidTransaction = async () => {
    if (!voidingTxId) return;
    setIsVoiding(true);
    try {
      const res = await voidTransactionAction(voidingTxId);
      if (!res.success) {
        alert(res.error);
        return;
      }
      setVoidingTxId(null);
    } catch (err: any) {
      alert(err?.message || "Failed to void transaction");
    } finally {
      setIsVoiding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Account Balances Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Liquidity */}
        <div className="bg-slate-900 text-white rounded-md p-5 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Liquidity
            </span>
            <Wallet className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold tracking-tight mt-3">
            <MoneyText amount={totalBalance} className="text-white" />
          </div>
          <span className="text-[11px] text-slate-400 mt-2">Combined balance across accounts</span>
        </div>

        {/* Individual Accounts */}
        {accounts.map((acc) => (
          <div
            key={acc.id}
            className="bg-white border border-slate-200 rounded-md p-5 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {acc.name}
              </span>
              {acc.type === "CASH" && <Banknote className="w-4 h-4 text-emerald-600" />}
              {acc.type === "MOBILE" && <Smartphone className="w-4 h-4 text-pink-600" />}
              {acc.type === "BANK" && <Building2 className="w-4 h-4 text-blue-600" />}
            </div>
            <div className="text-2xl font-bold tracking-tight text-slate-900 mt-3">
              <MoneyText amount={acc.balance} />
            </div>
            <span className="text-[11px] text-slate-400 mt-2 font-mono">{acc.type} ACCOUNT</span>
          </div>
        ))}
      </div>

      {/* Date & Period Filtering Bar (Default: Today) */}
      <div className="bg-white p-3.5 border border-slate-200 rounded-lg shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800">লেনদেন ও সমাপনী সময়কাল</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">
                  {periodLabel}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                ডিফল্টভাবে আজকের লেনদেন ও সমাপনী হিসাব প্রদর্শিত হচ্ছে
              </p>
            </div>
          </div>

          {/* Quick Period Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-md text-xs font-semibold">
            {(
              [
                { id: "today", label: "আজ (Today)" },
                { id: "yesterday", label: "গতকাল" },
                { id: "this_month", label: "এই মাস" },
                { id: "all", label: "সব লেনদেন" },
                { id: "custom", label: "তারিখ রেঞ্জ" },
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handlePeriodChange(p.id)}
                className={cn(
                  "px-3 py-1 rounded transition-all cursor-pointer",
                  periodFilter === p.id
                    ? "bg-white text-rose-700 shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Date Range Selector */}
        {periodFilter === "custom" && (
          <form
            onSubmit={handleCustomDateSubmit}
            className="flex flex-wrap items-end gap-2.5 pt-2.5 border-t border-slate-100 text-xs animate-in fade-in"
          >
            <div>
              <label className="text-slate-500 font-medium block mb-1">শুরুর তারিখ</label>
              <input
                type="date"
                required
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-2.5 py-1 bg-white border border-slate-200 rounded font-semibold text-slate-800 text-xs"
              />
            </div>
            <div>
              <label className="text-slate-500 font-medium block mb-1">শেষের তারিখ</label>
              <input
                type="date"
                required
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-2.5 py-1 bg-white border border-slate-200 rounded font-semibold text-slate-800 text-xs"
              />
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white rounded font-bold transition-colors cursor-pointer"
            >
              {isPending ? "ফিল্টার হচ্ছে..." : "ফিল্টার করুন"}
            </button>
          </form>
        )}

        {/* Closing Balance for Selected Date/Month */}
        {closingBalanceSummary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2.5 border-t border-slate-100 text-xs">
            <div className="p-2.5 bg-slate-50 rounded border border-slate-100">
              <span className="text-[10px] text-slate-500 block uppercase font-medium">শুরুর স্থিতি (Opening)</span>
              <span className="font-bold text-slate-800 text-sm font-mono block mt-0.5">
                <MoneyText amount={closingBalanceSummary.openingTotal} />
              </span>
              <span className="text-[10px] text-slate-400">সময়কালের শুরুর ব্যালেন্স</span>
            </div>
            <div className="p-2.5 bg-emerald-50/60 rounded border border-emerald-100">
              <span className="text-[10px] text-emerald-700 block uppercase font-medium">(+) মোট জমা (Inflows)</span>
              <span className="font-bold text-emerald-800 text-sm font-mono block mt-0.5">
                +<MoneyText amount={closingBalanceSummary.inflowsTotal} />
              </span>
              <span className="text-[10px] text-slate-400">বিক্রয় ও অন্যান্য আয়</span>
            </div>
            <div className="p-2.5 bg-rose-50/60 rounded border border-rose-100">
              <span className="text-[10px] text-rose-700 block uppercase font-medium">(-) মোট খরচ (Outflows)</span>
              <span className="font-bold text-rose-800 text-sm font-mono block mt-0.5">
                -<MoneyText amount={closingBalanceSummary.outflowsTotal} />
              </span>
              <span className="text-[10px] text-slate-400">খরচ ও কেনাকাটা</span>
            </div>
            <div className="p-2.5 bg-slate-900 text-white rounded border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase font-medium">(=) সমাপনী স্থিতি (Closing)</span>
              <span className="font-bold text-emerald-400 text-sm font-mono block mt-0.5">
                <MoneyText amount={closingBalanceSummary.closingTotal} />
              </span>
              <span className="text-[10px] text-slate-400">দিন/মাস শেষে ব্যালেন্স</span>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons & Filter Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 border border-slate-200 rounded-md">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by description, account, category..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Flow Types</option>
            <option value="INCOME">Income Only</option>
            <option value="EXPENSE">Expense Only</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setModalType("EXPENSE");
              setIsModalOpen(true);
            }}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded shadow-xs transition-colors"
          >
            <ArrowUpRight className="w-4 h-4" />
            Record Expense
          </button>
          <button
            onClick={() => {
              setModalType("INCOME");
              setIsModalOpen(true);
            }}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded shadow-xs transition-colors"
          >
            <ArrowDownLeft className="w-4 h-4" />
            Record Income
          </button>
        </div>
      </div>

      {/* Transactions Ledger Table or Skeleton */}
      {isPending ? (
        <TableSkeleton rows={6} cols={7} />
      ) : (
        <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider font-semibold">
              <th className="py-3 px-4">Date & Time</th>
              <th className="py-3 px-4">Account</th>
              <th className="py-3 px-4">Category / Origin</th>
              <th className="py-3 px-4">Source</th>
              <th className="py-3 px-4">Description</th>
              <th className="py-3 px-4 text-right">Amount</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedTransactions.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <Wallet className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-1" />
                  No transactions recorded in this period.
                </td>
              </tr>
            ) : (
              paginatedTransactions.map((t) => {
                const isVoided = Boolean(t.voidedAt);
                return (
                  <tr
                    key={t.id}
                    className={cn(
                      "hover:bg-slate-50/70 transition-colors",
                      isVoided && "bg-slate-50 opacity-60"
                    )}
                  >
                    <td className="py-3 px-4">
                      <DateTimeText date={t.occurredAt} />
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {t.accountName}
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium">
                        {t.categoryName}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider",
                          t.source === "SALE" && "bg-blue-50 text-blue-700",
                          t.source === "PURCHASE" && "bg-amber-50 text-amber-700",
                          t.source === "MANUAL" && "bg-purple-50 text-purple-700"
                        )}
                      >
                        {t.source}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                      {t.description}
                    </td>
                    <td className="py-3 px-4 text-right font-bold tabular-nums">
                      <span
                        className={cn(
                          isVoided
                            ? "text-slate-400 line-through"
                            : t.type === "INCOME"
                            ? "text-emerald-600"
                            : "text-slate-900"
                        )}
                      >
                        {t.type === "INCOME" ? "+" : "-"}
                        <MoneyText amount={t.amount} className="text-inherit" />
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {t.source === "MANUAL" && !isVoided ? (
                        <button
                          onClick={() => setVoidingTxId(t.id)}
                          className="px-2 py-1 text-[11px] text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded font-semibold transition-colors"
                        >
                          Void
                        </button>
                      ) : isVoided ? (
                        <span className="text-[11px] text-slate-400 italic">Voided</span>
                      ) : (
                        <span className="text-[11px] text-slate-400">System</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {filteredTransactions.length > 0 && (
          <Pagination
            currentPage={page}
            totalItems={filteredTransactions.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        )}
      </div>
      )}

      {/* Add Manual Transaction Modal */}
      <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 animate-in fade-in" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-lg p-6 shadow-2xl border border-slate-200 z-50 animate-in zoom-in-95 focus:outline-none">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <Dialog.Title className="text-base font-semibold text-slate-900">
                {modalType === "EXPENSE" ? "Record Operating Expense" : "Record Other Income"}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="text-slate-400 hover:text-slate-600 p-1">
                  <X className="w-4 h-4" />
                </button>
              </Dialog.Close>
            </div>

            {error && (
              <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleAddTransaction} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="font-medium text-slate-700 block mb-1">Amount (৳) *</label>
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold tabular-nums"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">
                  Account ({modalType === "EXPENSE" ? "Paid From" : "Deposited To"}) *
                </label>
                <select
                  required
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} (Current: ৳{a.balance.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">Expense Category</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">General / Uncategorized</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">Description / Memo</label>
                <input
                  type="text"
                  placeholder="e.g. November shop electricity bill"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? "Recording..." : "Save Transaction"}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Void Transaction Confirmation */}
      <ConfirmDialog
        open={Boolean(voidingTxId)}
        onOpenChange={(open) => !open && setVoidingTxId(null)}
        title="Void Transaction Confirmation"
        description="Are you sure you want to void this manual transaction? Its balance effect on the linked account will be reversed. History will be kept."
        confirmLabel="Void Transaction"
        variant="danger"
        isLoading={isVoiding}
        onConfirm={handleVoidTransaction}
      />
    </div>
  );
};
