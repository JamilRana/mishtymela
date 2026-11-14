"use client";

import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { batchDisburseSalaryAction } from "@/actions/payroll";
import { MoneyText } from "@/components/shared/MoneyText";
import { CheckCheck, AlertCircle, Loader2, X, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";

interface BatchDisburseModalProps {
  isOpen: boolean;
  onClose: () => void;
  month: number;
  year: number;
  monthName: string;
  totalPendingAmount: number;
  unpaidStaffCount: number;
  accounts: Array<{ id: string; name: string; type: string }>;
  onSuccess?: () => void;
}

export function BatchDisburseModal({
  isOpen,
  onClose,
  month,
  year,
  monthName,
  totalPendingAmount,
  unpaidStaffCount,
  accounts,
  onSuccess,
}: BatchDisburseModalProps) {
  const router = useRouter();

  const [accountId, setAccountId] = useState<string>(accounts[0]?.id ?? "");
  const [paymentDate, setPaymentDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!accountId) {
      setError("Please select a disbursement account.");
      return;
    }

    setLoading(true);
    try {
      const res = await batchDisburseSalaryAction({
        month,
        year,
        accountId,
        paymentDate: new Date(paymentDate).toISOString(),
      });

      if (!res.success) {
        setError(res.error || "Failed to disburse salaries in batch.");
        return;
      }

      onClose();
      if (onSuccess) onSuccess();
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 animate-in fade-in" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] rounded-2xl bg-card p-6 shadow-2xl border">
          <div className="flex items-center justify-between pb-3 border-b mb-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                <CheckCheck className="w-5 h-5" />
              </div>
              <div>
                <Dialog.Title className="text-base font-bold">
                  এক ক্লিকে সকল বেতন পরিশোধ
                </Dialog.Title>
                <Dialog.Description className="text-xs text-muted-foreground">
                  {monthName} {year} • ব্যাচ ডিসবার্সমেন্ট
                </Dialog.Description>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg flex items-start gap-2 text-xs">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Batch Summary */}
            <div className="p-3 bg-muted/40 rounded-lg space-y-2 text-xs border">
              <div className="flex justify-between">
                <span className="text-muted-foreground">বকেয়া কর্মী সংখ্যা:</span>
                <span className="font-semibold text-foreground font-mono">{unpaidStaffCount} জন</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-rose-600 pt-1 border-t">
                <span>সর্বমোট বকেয়া বেতন:</span>
                <span className="font-mono text-base">
                  <MoneyText amount={totalPendingAmount} />
                </span>
              </div>
            </div>

            {/* Account Selector */}
            <div className="space-y-1">
              <label className="text-xs font-semibold">টাকা প্রদানের একাউন্ট (Payment Account):</label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-background outline-none focus:ring-2 focus:ring-primary/20"
                required
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.type})
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Date */}
            <div className="space-y-1">
              <label className="text-xs font-semibold">পরিশোধের তারিখ:</label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-xs font-mono bg-background outline-none focus:ring-2 focus:ring-primary/20"
                required
              />
            </div>

            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-300 rounded-lg text-xs">
              ⚠️ নিশ্চিত করলে নির্বাচিত একাউন্ট থেকে সম্পূর্ণ ৳{totalPendingAmount.toLocaleString()} ডেবিট হবে এবং সকল কর্মীর বেতন স্ট্যাটাস PAID চিহ্নিত হবে।
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-xs border rounded-lg hover:bg-muted font-medium"
              >
                বাতিল
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium disabled:opacity-50"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                একযোগে পরিশোধ করুন
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
