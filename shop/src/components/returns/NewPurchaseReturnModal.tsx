"use client";

import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { createPurchaseReturnAction } from "@/actions/returns";
import { MoneyText } from "@/components/shared/MoneyText";
import { ArrowLeftRight, AlertCircle, Loader2, X, Building2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface PurchaseOption {
  id: string;
  billNo: string;
  supplierName: string;
  total: number;
  due: number;
}

interface NewPurchaseReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchases: PurchaseOption[];
  accounts: Array<{ id: string; name: string; type: string }>;
  onSuccess?: () => void;
}

export function NewPurchaseReturnModal({
  isOpen,
  onClose,
  purchases,
  accounts,
  onSuccess,
}: NewPurchaseReturnModalProps) {
  const router = useRouter();

  const [purchaseId, setPurchaseId] = useState<string>(purchases[0]?.id ?? "");
  const [amountCredited, setAmountCredited] = useState<number>(0);
  const [reason, setReason] = useState<string>("");
  const [refundToAccount, setRefundToAccount] = useState<boolean>(false);
  const [refundAccountId, setRefundAccountId] = useState<string>(accounts[0]?.id ?? "");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedPurchase = purchases.find((p) => p.id === purchaseId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!purchaseId) {
      setError("Please select a purchase bill.");
      return;
    }

    if (amountCredited <= 0) {
      setError("Return / debit amount must be greater than zero.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await createPurchaseReturnAction({
        purchaseId,
        amountCredited,
        reason: reason.trim() || null,
        refundAccountId: refundToAccount ? refundAccountId : undefined,
      });

      if (!res.success) {
        setError(res.error || "Failed to process purchase return.");
        return;
      }

      onClose();
      if (onSuccess) onSuccess();
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Unexpected error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 animate-in fade-in" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] rounded-2xl bg-card p-6 shadow-2xl border">
          <div className="flex items-center justify-between pb-3 border-b mb-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                <ArrowLeftRight className="w-5 h-5" />
              </div>
              <div>
                <Dialog.Title className="text-base font-bold">
                  ক্রয় ফেরত ও ডেবিট নোট (Purchase Return)
                </Dialog.Title>
                <Dialog.Description className="text-xs text-muted-foreground">
                  সাপ্লাইয়ার বিলের মালামাল ফেরত বা মূল্য সমন্বয়
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

            {/* Purchase Bill Selector */}
            <div className="space-y-1">
              <label className="text-xs font-semibold">ক্রয় বিল নির্বাচন করুন:</label>
              <select
                value={purchaseId}
                onChange={(e) => setPurchaseId(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-xs bg-background outline-none focus:ring-2 focus:ring-primary/20"
                required
              >
                {purchases.map((p) => (
                  <option key={p.id} value={p.id}>
                    বিল: {p.billNo} • {p.supplierName} (মোট: ৳{p.total})
                  </option>
                ))}
              </select>
            </div>

            {selectedPurchase && (
              <div className="p-2.5 bg-muted/30 border rounded-lg text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">সাপ্লাইয়ার:</span>
                  <span className="font-semibold">{selectedPurchase.supplierName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">বর্তমান বকেয়া (Due):</span>
                  <span className="font-mono font-semibold text-rose-600">
                    <MoneyText amount={selectedPurchase.due} />
                  </span>
                </div>
              </div>
            )}

            {/* Amount Credited */}
            <div className="space-y-1">
              <label className="text-xs font-semibold">ফেরত / ডেবিট নোটের পরিমাণ ৳:</label>
              <input
                type="number"
                min="1"
                step="any"
                value={amountCredited}
                onChange={(e) => setAmountCredited(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border rounded-lg text-sm font-mono font-bold bg-background outline-none focus:ring-2 focus:ring-primary/20"
                required
              />
            </div>

            {/* Reason */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">ফেরতের কারণ:</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="উদাঃ খারাপ মানের দুধ/ছানা সরবরাহ করায় ফেরত"
                className="w-full px-3 py-2 border rounded-lg text-xs bg-background outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Cash Refund toggle */}
            <div className="space-y-2 pt-2 border-t text-xs">
              <label className="inline-flex items-center gap-2 cursor-pointer font-medium">
                <input
                  type="checkbox"
                  checked={refundToAccount}
                  onChange={(e) => setRefundToAccount(e.target.checked)}
                  className="rounded border-zinc-300 text-primary"
                />
                <span>সাপ্লাইয়ার নগদ/ব্যাংকে টাকা ফেরত দিয়েছেন?</span>
              </label>

              {refundToAccount && (
                <div className="space-y-1 pl-5">
                  <label className="text-xs text-muted-foreground">জমার একাউন্ট:</label>
                  <select
                    value={refundAccountId}
                    onChange={(e) => setRefundAccountId(e.target.value)}
                    className="w-full px-2 py-1.5 border rounded bg-background text-xs"
                    required
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.type})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 text-xs border rounded-lg hover:bg-muted font-medium"
              >
                বাতিল
              </button>
              <button
                type="submit"
                disabled={submitting || amountCredited <= 0}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium disabled:opacity-50"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                ডেবিট নোট নিশ্চিত করুন
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
