"use client";

import React, { useState, useEffect, useTransition } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, DollarSign, Calendar, Wallet, AlertCircle, User, ArrowDownLeft } from "lucide-react";
import { collectCustomerDueAction } from "@/actions/dues";
import { useHydratedLanguage } from "@/stores/language";
import { MoneyText } from "@/components/shared/MoneyText";

interface CustomerOption {
  id: string;
  name: string;
  phone: string;
  currentDue: number;
  creditLimit?: number | null;
}

interface AccountOption {
  id: string;
  name: string;
  type: string;
}

interface CustomerDueCollectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customers: CustomerOption[];
  accounts: AccountOption[];
  preSelectedCustomerId?: string | null;
  onSuccess?: (receiptData: any) => void;
}

export const CustomerDueCollectionModal: React.FC<CustomerDueCollectionModalProps> = ({
  open,
  onOpenChange,
  customers,
  accounts,
  preSelectedCustomerId,
  onSuccess,
}) => {
  const { language } = useHydratedLanguage();
  const isBn = language === "bn";
  const [isPending, startTransition] = useTransition();

  const [customerId, setCustomerId] = useState(preSelectedCustomerId || "");
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState(accounts[0]?.id || "");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (preSelectedCustomerId) {
      setCustomerId(preSelectedCustomerId);
      const cust = customers.find((c) => c.id === preSelectedCustomerId);
      if (cust && cust.currentDue > 0) {
        setAmount(String(cust.currentDue));
      }
    } else if (customers.length > 0 && !customerId) {
      setCustomerId(customers[0].id);
      if (customers[0].currentDue > 0) {
        setAmount(String(customers[0].currentDue));
      }
    }
    setError(null);
  }, [preSelectedCustomerId, customers, open]);

  const selectedCustomer = customers.find((c) => c.id === customerId);

  const handleCustomerChange = (id: string) => {
    setCustomerId(id);
    const cust = customers.find((c) => c.id === id);
    if (cust && cust.currentDue > 0) {
      setAmount(String(cust.currentDue));
    }
  };

  const handlePayFullDue = () => {
    if (selectedCustomer && selectedCustomer.currentDue > 0) {
      setAmount(String(selectedCustomer.currentDue));
    }
  };

  const remainingDueAfter = selectedCustomer
    ? Math.max(0, selectedCustomer.currentDue - (Number(amount) || 0))
    : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!customerId) {
      setError(isBn ? "অনুগ্রহ করে কাস্টমার নির্বাচন করুন" : "Please select a customer");
      return;
    }
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      setError(isBn ? "আদায়কৃত টাকা ০ এর বেশি হতে হবে" : "Amount must be greater than zero");
      return;
    }
    if (!accountId) {
      setError(isBn ? "পেমেন্ট অ্যাকাউন্ট নির্বাচন করুন" : "Please select an account");
      return;
    }

    startTransition(async () => {
      try {
        const res = await collectCustomerDueAction({
          customerId,
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
        setError(err.message || "Failed to record due collection");
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
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <ArrowDownLeft className="w-5 h-5" />
              </div>
              <div>
                <Dialog.Title className="text-xl font-bold text-slate-900">
                  {isBn ? "কাস্টমারের বাকি আদায়" : "Collect Customer Due"}
                </Dialog.Title>
                <Dialog.Description className="text-xs text-slate-500 mt-0.5">
                  {isBn
                    ? "বাকি পরিশোধ গ্রহণ ও ক্যাশ/ব্যাংক অ্যাকাউন্টে পোস্টিং"
                    : "Receive due repayment and credit chosen financial account"}
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
            {/* Customer Select */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isBn ? "কাস্টমার নির্বাচন করুন" : "Select Customer"} *
              </label>
              <select
                required
                value={customerId}
                onChange={(e) => handleCustomerChange(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
              >
                <option value="">{isBn ? "কাস্টমার নির্বাচন করুন..." : "Select Customer..."}</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone}) — {isBn ? "বাকি:" : "Due:"} ৳{c.currentDue}
                  </option>
                ))}
              </select>
            </div>

            {/* Customer Info Box */}
            {selectedCustomer && (
              <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/80 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 block">{isBn ? "বর্তমান বাকি ব্যালেন্স:" : "Current Outstanding Due:"}</span>
                  <span className="text-base font-bold text-red-600 font-mono">
                    <MoneyText amount={selectedCustomer.currentDue} />
                  </span>
                </div>
                {selectedCustomer.currentDue > 0 && (
                  <button
                    type="button"
                    onClick={handlePayFullDue}
                    className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg shadow-xs transition"
                  >
                    {isBn ? "সম্পূর্ণ বাকি পরিশোধ" : "Pay Full Due"}
                  </button>
                )}
              </div>
            )}

            {/* Amount & Account */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isBn ? "আদায়কৃত টাকা (৳)" : "Repayment Amount (৳)"} *
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
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono font-bold text-emerald-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isBn ? "জমা নেওয়ার মাধ্যম (Account)" : "Payment Account"} *
                </label>
                <div className="relative">
                  <Wallet className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <select
                    required
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
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
                  {isBn ? "আদায়ের তারিখ" : "Payment Date"} *
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isBn ? "নোট / রসিদ বিবরণ" : "Note / Remarks"}
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={isBn ? "যেমন: মাসিক বকেয়া পরিশোধ" : "e.g. Monthly settlement"}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Balance Preview */}
            {selectedCustomer && Number(amount) > 0 && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between text-xs">
                <span className="text-slate-500">{isBn ? "পরিশোধের পর অবশিষ্ট বাকি:" : "Remaining Due After:"}</span>
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
                className="px-5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
              >
                {isPending && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {isBn ? "আদায় সংরক্ষণ ও রসিদ তৈরি" : "Record Collection & Receipt"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
