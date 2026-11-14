"use client";

import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { convertOrderToSaleAction } from "@/actions/orders";
import { MoneyText } from "@/components/shared/MoneyText";
import { CheckCircle2, AlertCircle, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";

interface OrderDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    id: string;
    orderNo: string;
    customerName: string;
    dueBalance: number;
    total: number;
    advancePaid: number;
  } | null;
  accounts: Array<{ id: string; name: string; type: string }>;
  onSuccess?: () => void;
}

export function OrderDeliveryModal({
  isOpen,
  onClose,
  order,
  accounts,
  onSuccess,
}: OrderDeliveryModalProps) {
  const router = useRouter();
  const [paidAmount, setPaidAmount] = useState<number>(order?.dueBalance ?? 0);
  const [accountId, setAccountId] = useState<string>(accounts[0]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state when order opens
  React.useEffect(() => {
    if (order) {
      setPaidAmount(order.dueBalance);
    }
  }, [order]);

  if (!order) return null;

  const remainingDue = Math.max(0, order.dueBalance - paidAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (paidAmount > 0 && !accountId) {
      setError("Please select an account for the payment received.");
      return;
    }

    setLoading(true);
    try {
      const res = await convertOrderToSaleAction({
        orderId: order.id,
        finalPaidAmount: paidAmount,
        accountId: paidAmount > 0 ? accountId : undefined,
      });

      if (!res.success) {
        setError(res.error || "Failed to finalize order delivery.");
        return;
      }

      onClose();
      if (onSuccess) onSuccess();
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 animate-in fade-in" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] rounded-2xl bg-card p-6 shadow-2xl border">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b mb-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <Dialog.Title className="text-base font-bold">
                  অর্ডার ডেলিভারি ও বিক্রয় চালান তৈরি
                </Dialog.Title>
                <Dialog.Description className="text-xs text-muted-foreground">
                  Order <span className="font-mono font-semibold">{order.orderNo}</span>
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

            {/* Order Summary Snapshot */}
            <div className="p-3 bg-muted/40 rounded-lg space-y-1.5 text-xs border">
              <div className="flex justify-between">
                <span className="text-muted-foreground">গ্রাহক:</span>
                <span className="font-semibold">{order.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">মোট অর্ডার মূল্য:</span>
                <span className="font-mono font-semibold">
                  <MoneyText amount={order.total} />
                </span>
              </div>
              <div className="flex justify-between text-emerald-600">
                <span>অগ্রিম প্রদানকৃত:</span>
                <span className="font-mono font-semibold">
                  <MoneyText amount={order.advancePaid} />
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-rose-600 pt-1 border-t">
                <span>বকেয়া বাকি (Due Balance):</span>
                <span className="font-mono">
                  <MoneyText amount={order.dueBalance} />
                </span>
              </div>
            </div>

            {/* Payment Amount Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">
                ডেলিভারিতে নগদ/বিকাশ আদায় (Payment Received at Delivery) ৳:
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max={order.dueBalance}
                  step="any"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border rounded-lg text-base font-mono font-bold bg-background focus:ring-2 focus:ring-primary/20 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setPaidAmount(order.dueBalance)}
                  className="absolute right-2 top-2 text-[10px] bg-muted px-2 py-1 rounded font-medium hover:bg-muted/80"
                >
                  Full Due
                </button>
              </div>
            </div>

            {/* Account Selector if paying */}
            {paidAmount > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">জমা নেওয়ার একাউন্ট (Deposit Account):</label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-background focus:ring-2 focus:ring-primary/20 outline-none"
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

            {/* Remaining Due Notice */}
            {remainingDue > 0 && (
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-800 dark:text-amber-300">
                <span className="font-semibold block">অবশিষ্ট বাকি:</span>
                <div className="flex justify-between items-center mt-1">
                  <span>গ্রাহকের বাকি খাতা (Due Ledger)-এ যোগ হবে:</span>
                  <span className="font-mono font-bold">
                    <MoneyText amount={remainingDue} />
                  </span>
                </div>
              </div>
            )}

            <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-blue-800 dark:text-blue-300">
              ℹ️ নিশ্চিত করলে ইনভেন্টরি থেকে পণ্যের স্টক কর্তন হবে এবং বিক্রয় চালান (Sale Invoice) তৈরি হবে।
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
                ডেলিভারি সম্পন্ন করুন
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
