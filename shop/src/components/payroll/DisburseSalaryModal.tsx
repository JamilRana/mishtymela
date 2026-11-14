"use client";

import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { disburseSalaryAction } from "@/actions/payroll";
import { MoneyText } from "@/components/shared/MoneyText";
import { DollarSign, AlertCircle, Loader2, X, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";

interface DisburseSalaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: {
    id: string;
    employeeName: string;
    designation: string;
    netPayable: number;
    paidAmount: number;
    pendingAmount: number;
  } | null;
  accounts: Array<{ id: string; name: string; type: string }>;
  onSuccess?: () => void;
}

export function DisburseSalaryModal({
  isOpen,
  onClose,
  record,
  accounts,
  onSuccess,
}: DisburseSalaryModalProps) {
  const router = useRouter();

  const [amount, setAmount] = useState<number>(record?.pendingAmount ?? 0);
  const [accountId, setAccountId] = useState<string>(accounts[0]?.id ?? "");
  const [paymentDate, setPaymentDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (record) {
      setAmount(record.pendingAmount);
    }
  }, [record]);

  if (!record) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (amount <= 0) {
      setError("Payment amount must be greater than zero.");
      return;
    }

    if (!accountId) {
      setError("Please select a disbursement account.");
      return;
    }

    setLoading(true);
    try {
      const res = await disburseSalaryAction({
        id: record.id,
        amount,
        accountId,
        paymentDate: new Date(paymentDate).toISOString(),
        notes: notes.trim() || null,
      });

      if (!res.success) {
        setError(res.error || "Failed to disburse salary.");
        return;
      }

      onClose();
      if (onSuccess) onSuccess();
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Unexpected error occurred");
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
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <Dialog.Title className="text-base font-bold">
                  বেতন পরিশোধ (Salary Disbursement)
                </Dialog.Title>
                <Dialog.Description className="text-xs text-muted-foreground">
                  {record.employeeName} ({record.designation})
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

            {/* Pending Amount Snapshot */}
            <div className="p-3 bg-muted/40 rounded-lg space-y-1.5 text-xs border">
              <div className="flex justify-between">
                <span className="text-muted-foreground">নিট প্রদেয় বেতন:</span>
                <span className="font-mono font-semibold">
                  <MoneyText amount={record.netPayable} />
                </span>
              </div>
              <div className="flex justify-between text-emerald-600">
                <span>পূর্বে পরিশোধিত:</span>
                <span className="font-mono font-semibold">
                  <MoneyText amount={record.paidAmount} />
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-rose-600 pt-1 border-t">
                <span>বর্তমান বকেয়া (Pending):</span>
                <span className="font-mono">
                  <MoneyText amount={record.pendingAmount} />
                </span>
              </div>
            </div>

            {/* Payment Amount Input */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold">পরিশোধের পরিমাণ ৳:</label>
                <button
                  type="button"
                  onClick={() => setAmount(record.pendingAmount)}
                  className="text-[10px] text-primary hover:underline font-medium"
                >
                  সম্পূর্ণ বকেয়া (Full Due)
                </button>
              </div>
              <input
                type="number"
                min="1"
                max={record.pendingAmount}
                step="any"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border rounded-lg text-base font-mono font-bold bg-background outline-none focus:ring-2 focus:ring-primary/20"
                required
              />
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

            {/* Notes */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">মন্তব্য / রেফারেন্স:</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="উদাঃ মাসিক নগদ বেতন হস্তান্তর"
                className="w-full px-3 py-1.5 border rounded-lg text-xs bg-background outline-none focus:ring-2 focus:ring-primary/20"
              />
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
                বেতন পরিশোধ নিশ্চিত করুন
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
