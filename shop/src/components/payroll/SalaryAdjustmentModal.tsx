"use client";

import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { updatePayrollAdjustmentAction } from "@/actions/payroll";
import { MoneyText } from "@/components/shared/MoneyText";
import { SlidersHorizontal, AlertCircle, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";

interface SalaryAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: {
    id: string;
    employeeName: string;
    designation: string;
    baseSalary: number;
    bonus: number;
    deduction: number;
    netPayable: number;
    notes?: string | null;
  } | null;
  onSuccess?: () => void;
}

export function SalaryAdjustmentModal({
  isOpen,
  onClose,
  record,
  onSuccess,
}: SalaryAdjustmentModalProps) {
  const router = useRouter();

  const [bonus, setBonus] = useState<number>(record?.bonus ?? 0);
  const [deduction, setDeduction] = useState<number>(record?.deduction ?? 0);
  const [notes, setNotes] = useState<string>(record?.notes ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (record) {
      setBonus(record.bonus);
      setDeduction(record.deduction);
      setNotes(record.notes ?? "");
    }
  }, [record]);

  if (!record) return null;

  const baseSalary = record.baseSalary;
  const netPayable = Math.max(0, baseSalary + bonus - deduction);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    setLoading(true);
    try {
      const res = await updatePayrollAdjustmentAction({
        id: record.id,
        bonus,
        deduction,
        notes: notes.trim() || null,
      });

      if (!res.success) {
        setError(res.error || "Failed to update salary adjustments.");
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
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <div>
                <Dialog.Title className="text-base font-bold">
                  বেতন সমন্বয় (Salary Adjustments)
                </Dialog.Title>
                <Dialog.Description className="text-xs text-muted-foreground">
                  {record.employeeName} • {record.designation}
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

            {/* Base Salary Card */}
            <div className="p-3 bg-muted/40 rounded-lg flex justify-between items-center text-xs border">
              <span className="text-muted-foreground font-medium">নির্ধারিত মূল বেতন (Base Salary):</span>
              <span className="font-mono font-bold text-sm">
                <MoneyText amount={baseSalary} />
              </span>
            </div>

            {/* Bonus Input */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-emerald-600 block">
                + বোনাস / ইনসেন্টিভ (Bonus / Incentive) ৳:
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={bonus}
                onChange={(e) => setBonus(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border rounded-lg text-sm font-mono bg-background outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Deduction Input */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-rose-600 block">
                - অনুপস্থিতি / ঋণ কর্তন (Deductions) ৳:
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={deduction}
                onChange={(e) => setDeduction(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border rounded-lg text-sm font-mono bg-background outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground block">
                সমন্বয়ের কারণ / নোট (Reason / Notes):
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="উদাঃ ঈদুল ফিতরের ঈদ বোনাস"
                className="w-full px-3 py-2 border rounded-lg text-xs bg-background outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Net Payable Result */}
            <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg flex justify-between items-center text-sm font-bold">
              <span className="text-primary">নিট প্রদেয় বেতন (Net Payable):</span>
              <span className="font-mono text-base text-primary">
                <MoneyText amount={netPayable} />
              </span>
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
                className="inline-flex items-center gap-2 px-4 py-2 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium disabled:opacity-50"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                সংরক্ষণ করুন
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
