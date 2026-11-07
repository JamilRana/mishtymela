"use client";

import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowLeftRight, X, AlertCircle } from "lucide-react";
import { transferFundsAction } from "@/actions/treasury";
import { toBnDigits } from "@/lib/bangla-numbers";
import { useHydratedLanguage } from "@/stores/language";

interface AccountOption {
  id: string;
  name: string;
  type: string;
  balance: number;
}

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: AccountOption[];
  onSuccess?: () => void;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  onClose,
  accounts,
  onSuccess,
}) => {
  const { language } = useHydratedLanguage();
  const isBn = language === "bn";

  const [fromId, setFromId] = useState(accounts[0]?.id ?? "");
  const [toId, setToId] = useState(accounts[1]?.id ?? accounts[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fromAcc = accounts.find((a) => a.id === fromId);
  const toAcc = accounts.find((a) => a.id === toId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      setError(isBn ? "সঠিক টাকার পরিমাণ দিন" : "Please enter a valid amount");
      return;
    }
    if (fromId === toId) {
      setError(isBn ? "উৎস ও গন্তব্য অ্যাকাউন্ট ভিন্ন হতে হবে" : "Source and destination accounts must be different");
      return;
    }

    setSubmitting(true);
    try {
      const res = await transferFundsAction({
        fromAccountId: fromId,
        toAccountId: toId,
        amount: numAmount,
        note: note.trim() || undefined,
      });

      if (!res.success) {
        setError(res.error);
        return;
      }

      setAmount("");
      setNote("");
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to transfer funds");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 animate-in fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-xl shadow-2xl p-6 z-50 border border-slate-100 animate-in zoom-in-95">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
                <ArrowLeftRight className="w-5 h-5" />
              </div>
              <Dialog.Title className="text-base font-bold text-slate-900">
                {isBn ? "অ্যাকাউন্ট ট্রান্সফার" : "Transfer Funds"}
              </Dialog.Title>
            </div>
            <Dialog.Close className="text-slate-400 hover:text-slate-600 p-1 rounded-md">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {isBn ? "যে অ্যাকাউন্ট থেকে যাবে (উৎস)" : "From Account (Source)"}
              </label>
              <select
                value={fromId}
                onChange={(e) => setFromId(e.target.value)}
                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-800"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.type}) — ৳{isBn ? toBnDigits(a.balance.toFixed(2)) : a.balance.toFixed(2)}
                  </option>
                ))}
              </select>
              {fromAcc && (
                <span className="text-[11px] text-slate-600 block mt-1">
                  {isBn ? "বর্তমান ব্যালেন্স:" : "Current Balance:"} ৳
                  {isBn ? toBnDigits(fromAcc.balance.toFixed(2)) : fromAcc.balance.toFixed(2)}
                </span>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {isBn ? "যে অ্যাকাউন্টে জমা হবে (গন্তব্য)" : "To Account (Destination)"}
              </label>
              <select
                value={toId}
                onChange={(e) => setToId(e.target.value)}
                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-800"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.type}) — ৳{isBn ? toBnDigits(a.balance.toFixed(2)) : a.balance.toFixed(2)}
                  </option>
                ))}
              </select>
              {toAcc && (
                <span className="text-[11px] text-slate-600 block mt-1">
                  {isBn ? "বর্তমান ব্যালেন্স:" : "Current Balance:"} ৳
                  {isBn ? toBnDigits(toAcc.balance.toFixed(2)) : toAcc.balance.toFixed(2)}
                </span>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {isBn ? "টাকার পরিমাণ (৳)" : "Amount (৳)"}
              </label>
              <input
                type="number"
                min={1}
                step="0.01"
                required
                value={amount}
                placeholder="0.00"
                onChange={(e) => setAmount(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-base font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {isBn ? "বিবরণ বা নোট (ঐচ্ছিক)" : "Note / Description (Optional)"}
              </label>
              <input
                type="text"
                maxLength={200}
                value={note}
                placeholder={isBn ? "যেমন: ব্যাংকে জমা, ক্যাশ ড্রয়ার ট্রান্সফার" : "e.g., Bank deposit, Drawer float transfer"}
                onChange={(e) => setNote(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="h-9 px-4 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                {isBn ? "বাতিল" : "Cancel"}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="h-9 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                {submitting ? (isBn ? "ট্রান্সফার হচ্ছে..." : "Transferring...") : isBn ? "ট্রান্সফার সম্পন্ন করুন" : "Confirm Transfer"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
