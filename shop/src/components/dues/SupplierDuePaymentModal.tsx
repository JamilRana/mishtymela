"use client";

import React, { useState, useEffect, useTransition } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, DollarSign, Calendar, Wallet, AlertCircle, Truck, ArrowUpRight } from "lucide-react";
import { paySupplierDueAction } from "@/actions/dues";
import { useHydratedLanguage } from "@/stores/language";
import { MoneyText } from "@/components/shared/MoneyText";

interface SupplierOption {
  id: string;
  name: string;
  phone: string;
  currentDue: number;
}

interface AccountOption {
  id: string;
  name: string;
  type: string;
}

interface SupplierDuePaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suppliers: SupplierOption[];
  accounts: AccountOption[];
  preSelectedSupplierId?: string | null;
  onSuccess?: (voucherData: any) => void;
}

export const SupplierDuePaymentModal: React.FC<SupplierDuePaymentModalProps> = ({
  open,
  onOpenChange,
  suppliers,
  accounts,
  preSelectedSupplierId,
  onSuccess,
}) => {
  const { language } = useHydratedLanguage();
  const isBn = language === "bn";
  const [isPending, startTransition] = useTransition();

  const [supplierId, setSupplierId] = useState(preSelectedSupplierId || "");
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState(accounts[0]?.id || "");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (preSelectedSupplierId) {
      setSupplierId(preSelectedSupplierId);
      const sup = suppliers.find((s) => s.id === preSelectedSupplierId);
      if (sup && sup.currentDue > 0) {
        setAmount(String(sup.currentDue));
      }
    } else if (suppliers.length > 0 && !supplierId) {
      setSupplierId(suppliers[0].id);
      if (suppliers[0].currentDue > 0) {
        setAmount(String(suppliers[0].currentDue));
      }
    }
    setError(null);
  }, [preSelectedSupplierId, suppliers, open]);

  const selectedSupplier = suppliers.find((s) => s.id === supplierId);

  const handleSupplierChange = (id: string) => {
    setSupplierId(id);
    const sup = suppliers.find((s) => s.id === id);
    if (sup && sup.currentDue > 0) {
      setAmount(String(sup.currentDue));
    }
  };

  const handlePayFullDue = () => {
    if (selectedSupplier && selectedSupplier.currentDue > 0) {
      setAmount(String(selectedSupplier.currentDue));
    }
  };

  const remainingDueAfter = selectedSupplier
    ? Math.max(0, selectedSupplier.currentDue - (Number(amount) || 0))
    : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!supplierId) {
      setError(isBn ? "অনুগ্রহ করে সাপ্লাইয়ার নির্বাচন করুন" : "Please select a supplier");
      return;
    }
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      setError(isBn ? "পরিশোধকৃত টাকা ০ এর বেশি হতে হবে" : "Amount must be greater than zero");
      return;
    }
    if (!accountId) {
      setError(isBn ? "পেমেন্ট অ্যাকাউন্ট নির্বাচন করুন" : "Please select an account");
      return;
    }

    startTransition(async () => {
      try {
        const res = await paySupplierDueAction({
          supplierId,
          amount: numAmount,
          accountId,
          date: new Date(date).toISOString(),
          note: note.trim() || undefined,
        });

        if (!res.success) {
          setError(res.error);
          return;
        }

        onOpenChange(false);
        if (onSuccess) onSuccess(res);
      } catch (err: any) {
        setError(err.message || "Failed to record supplier payment");
      }
    });
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 animate-in fade-in duration-200" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <ArrowUpRight className="w-5 h-5" />
              </div>
              <div>
                <Dialog.Title className="text-xl font-bold text-slate-900">
                  {isBn ? "সাপ্লাইয়ারকে বাকি পরিশোধ" : "Disburse Supplier Due Payment"}
                </Dialog.Title>
                <Dialog.Description className="text-xs text-slate-500 mt-0.5">
                  {isBn
                    ? "সাপ্লাইয়ারের বকেয়া পরিশোধ ও ক্যাশ/ব্যাংক থেকে উত্তোলন"
                    : "Pay vendor dues and record expense transaction"}
                </Dialog.Description>
              </div>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Supplier Select */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isBn ? "সাপ্লাইয়ার নির্বাচন করুন" : "Select Supplier"} *
              </label>
              <select
                required
                value={supplierId}
                onChange={(e) => handleSupplierChange(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
              >
                <option value="">{isBn ? "সাপ্লাইয়ার নির্বাচন করুন..." : "Select Supplier..."}</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.phone}) — {isBn ? "প্রদেয় বাকি:" : "Payable:"} ৳{s.currentDue}
                  </option>
                ))}
              </select>
            </div>

            {/* Supplier Info Box */}
            {selectedSupplier && (
              <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200/80 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 block">{isBn ? "সাপ্লাইয়ারের প্রদেয় বকেয়া:" : "Total Payable to Supplier:"}</span>
                  <span className="text-base font-bold text-blue-700 font-mono">
                    <MoneyText amount={selectedSupplier.currentDue} />
                  </span>
                </div>
                {selectedSupplier.currentDue > 0 && (
                  <button
                    type="button"
                    onClick={handlePayFullDue}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-xs transition"
                  >
                    {isBn ? "সম্পূর্ণ বকেয়া পরিশোধ" : "Pay Full Balance"}
                  </button>
                )}
              </div>
            )}

            {/* Amount & Account */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isBn ? "পরিশোধকৃত টাকা (৳)" : "Payment Amount (৳)"} *
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="number"
                    step="any"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold text-blue-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isBn ? "টাকা প্রদানের মাধ্যম (Account)" : "Payment Account"} *
                </label>
                <div className="relative">
                  <Wallet className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <select
                    required
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.type})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Date & Note */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isBn ? "পরিশোধের তারিখ" : "Payment Date"} *
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isBn ? "মন্তব্য / চেক নম্বর" : "Note / Cheque Ref"}
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={isBn ? "যেমন: চেক নং #১২৩৪৫" : "e.g. Bank Cheque #12345"}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Balance Preview */}
            {selectedSupplier && Number(amount) > 0 && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between text-xs">
                <span className="text-slate-500">{isBn ? "পরিশোধের পর অবশিষ্ট প্রদেয় বাকি:" : "Remaining Due After:"}</span>
                <span className="font-mono font-bold text-slate-800">
                  <MoneyText amount={remainingDueAfter} />
                </span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
              >
                {isBn ? "বাতিল" : "Cancel"}
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
              >
                {isPending && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {isBn ? "পরিশোধ নিশ্চিত ও ভাউচার তৈরি" : "Confirm Payment"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
