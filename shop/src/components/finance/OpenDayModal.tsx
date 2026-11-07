"use client";

import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Sunrise, X, AlertCircle } from "lucide-react";
import { openDayAction } from "@/actions/treasury";
import { toBnDigits } from "@/lib/bangla-numbers";
import { useHydratedLanguage } from "@/stores/language";

interface AccountOption {
  id: string;
  name: string;
  type: string;
  balance: number;
}

interface OpenDayModalProps {
  isOpen: boolean;
  onClose: () => void;
  previousCash: number;
  accounts: AccountOption[];
  onSuccess?: () => void;
}

export const OpenDayModal: React.FC<OpenDayModalProps> = ({
  isOpen,
  onClose,
  previousCash,
  accounts,
  onSuccess,
}) => {
  const { language } = useHydratedLanguage();
  const isBn = language === "bn";

  const [openingCash, setOpeningCash] = useState(String(previousCash || ""));
  const [destAccountId, setDestAccountId] = useState(
    accounts.find((a) => a.type === "SAFE" || a.type === "OWNER")?.id ?? ""
  );
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const numCash = Number(openingCash);
  const diff = Number((numCash - previousCash).toFixed(2));
  const hasDiff = Math.abs(diff) > 0.009;

  const eligibleDestAccounts = accounts.filter(
    (a) => a.type === "SAFE" || a.type === "OWNER" || a.type === "BANK"
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isNaN(numCash) || numCash < 0) {
      setError(isBn ? "সঠিক প্রারম্ভিক ক্যাশ দিন" : "Please enter a valid opening cash amount");
      return;
    }

    if (hasDiff && !destAccountId) {
      setError(
        isBn
          ? "ক্যাশ পার্থক্যের জন্য গন্তব্য সেফ বা ওনার অ্যাকাউন্ট নির্বাচন করুন"
          : "Please select a destination Safe or Owner account for the cash difference"
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await openDayAction({
        openingCash: numCash,
        destinationAccountId: hasDiff ? destAccountId : undefined,
        note: note.trim() || undefined,
      });

      if (!res.success) {
        setError(res.error);
        return;
      }

      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to open day");
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
              <div className="p-2 bg-amber-50 text-amber-700 rounded-lg">
                <Sunrise className="w-5 h-5" />
              </div>
              <Dialog.Title className="text-base font-bold text-slate-900">
                {isBn ? "দিনের হিসাব শুরু করুন (Open Day)" : "Open Trading Day"}
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
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
              <span className="text-slate-600 block">
                {isBn ? "পূর্ববর্তী দিনের সমাপনী ক্যাশ ব্যালেন্স:" : "Previous Closing Cash Balance:"}
              </span>
              <span className="text-base font-bold text-slate-900">
                ৳{isBn ? toBnDigits(previousCash.toFixed(2)) : previousCash.toFixed(2)}
              </span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {isBn ? "আজকের নিশ্চিতকৃত প্রারম্ভিক ক্যাশ (৳)" : "Confirmed Opening Cash Float (৳)"}
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                required
                value={openingCash}
                placeholder={String(previousCash)}
                onChange={(e) => setOpeningCash(e.target.value)}
                className="w-full h-11 px-3 bg-white border border-slate-200 rounded-lg text-lg font-black text-slate-900"
              />
              <span className="text-[11px] text-slate-600 block mt-1">
                {isBn
                  ? "ক্যাশ ড্রয়ারে উপস্থিত প্রকৃত টাকা গুনে লিখুন।"
                  : "Count actual physical cash in the drawer."}
              </span>
            </div>

            {hasDiff && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
                <span className="text-xs font-bold text-amber-900 block">
                  {diff < 0
                    ? isBn
                      ? `ক্যাশ ড্রয়ারে ৳${toBnDigits(Math.abs(diff).toFixed(2))} কম আছে। এটি সেফ বা ওনার অ্যাকাউন্টে ট্রান্সফার হবে:`
                      : `Drawer has ৳${Math.abs(diff).toFixed(2)} less. Transfer difference to:`
                    : isBn
                    ? `ক্যাশ ড্রয়ারে ৳${toBnDigits(diff.toFixed(2))} বেশি আছে। এটি যে অ্যাকাউন্ট থেকে আনা হয়েছে:`
                    : `Drawer has ৳${diff.toFixed(2)} more. Sourced from account:`}
                </span>

                <select
                  value={destAccountId}
                  onChange={(e) => setDestAccountId(e.target.value)}
                  className="w-full h-9 px-2 bg-white border border-amber-300 rounded text-xs font-bold text-slate-800"
                >
                  {eligibleDestAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.type})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {isBn ? "নোট বা মন্তব্য (ঐচ্ছিক)" : "Note (Optional)"}
              </label>
              <input
                type="text"
                maxLength={200}
                value={note}
                placeholder={isBn ? "যেমন: সকালের ড্রয়ার ওপেনিং" : "e.g., Morning drawer open"}
                onChange={(e) => setNote(e.target.value)}
                className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800"
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
                className="h-9 px-4 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                {submitting ? (isBn ? "ওপেন হচ্ছে..." : "Opening...") : isBn ? "দিন শুরু করুন" : "Confirm Open Day"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
