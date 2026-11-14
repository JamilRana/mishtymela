"use client";

import React, { useState, useTransition } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Plus, Trash2, Truck, AlertCircle, Calendar, Hash, Building2, Wallet } from "lucide-react";
import { createPurchaseAction } from "@/actions/purchases";
import { useHydratedLanguage } from "@/stores/language";
import { MoneyText } from "@/components/shared/MoneyText";

interface SupplierOption {
  id: string;
  name: string;
  phone: string;
}

interface ProductOption {
  id: string;
  name: string;
  sku: string;
  unit: string;
  avgCost: number;
}

interface AccountOption {
  id: string;
  name: string;
  type: string;
}

interface NewPurchaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suppliers: SupplierOption[];
  products: ProductOption[];
  accounts: AccountOption[];
  onSuccess?: () => void;
}

interface LineItem {
  productId: string;
  quantity: string;
  unitCost: string;
  batchNo?: string;
  expiryDate?: string;
}

export const NewPurchaseModal: React.FC<NewPurchaseModalProps> = ({
  open,
  onOpenChange,
  suppliers,
  products,
  accounts,
  onSuccess,
}) => {
  const { language } = useHydratedLanguage();
  const isBn = language === "bn";
  const [isPending, startTransition] = useTransition();

  const [supplierId, setSupplierId] = useState("");
  const [billNo, setBillNo] = useState("");
  const [receivedDate, setReceivedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [taxAmount, setTaxAmount] = useState("0");
  const [discount, setDiscount] = useState("0");
  const [paidAmount, setPaidAmount] = useState("0");
  const [accountId, setAccountId] = useState(accounts[0]?.id || "");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [lines, setLines] = useState<LineItem[]>([
    { productId: products[0]?.id || "", quantity: "1", unitCost: String(products[0]?.avgCost || 0) },
  ]);

  const handleProductChange = (index: number, pId: string) => {
    const prod = products.find((p) => p.id === pId);
    setLines((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        productId: pId,
        unitCost: prod ? String(prod.avgCost) : "0",
      };
      return next;
    });
  };

  const handleLineChange = (index: number, field: keyof LineItem, val: string) => {
    setLines((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  };

  const addLine = () => {
    setLines((prev) => [
      ...prev,
      { productId: products[0]?.id || "", quantity: "1", unitCost: String(products[0]?.avgCost || 0) },
    ]);
  };

  const removeLine = (index: number) => {
    if (lines.length <= 1) return;
    setLines((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Calculations
  const subtotal = lines.reduce((acc, l) => {
    const q = Number(l.quantity) || 0;
    const c = Number(l.unitCost) || 0;
    return acc + q * c;
  }, 0);

  const numTax = Number(taxAmount) || 0;
  const numDiscount = Number(discount) || 0;
  const totalBill = Math.max(0, subtotal + numTax - numDiscount);
  const numPaid = Math.min(totalBill, Number(paidAmount) || 0);
  const dueAmount = Math.max(0, totalBill - numPaid);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!supplierId) {
      setError(isBn ? "অনুগ্রহ করে সাপ্লাইয়ার নির্বাচন করুন" : "Please select a supplier");
      return;
    }
    if (lines.length === 0 || lines.some((l) => !l.productId || Number(l.quantity) <= 0)) {
      setError(isBn ? "সকল আইটেমের পরিমাণ ০ এর বেশি হতে হবে" : "All items must have valid quantity > 0");
      return;
    }
    if (numPaid > 0 && !accountId) {
      setError(isBn ? "পরিশোধকৃত টাকার জন্য পেমেন্ট অ্যাকাউন্ট নির্বাচন করুন" : "Please select a payment account");
      return;
    }

    startTransition(async () => {
      try {
        const res = await createPurchaseAction({
          supplierId,
          billNo: billNo.trim() || undefined,
          receivedDate: new Date(receivedDate).toISOString(),
          taxAmount: numTax,
          discount: numDiscount,
          paidAmount: numPaid,
          accountId: numPaid > 0 ? accountId : undefined,
          note: note.trim() || undefined,
          items: lines.map((l) => ({
            productId: l.productId,
            quantity: Number(l.quantity),
            unitCost: Number(l.unitCost) || 0,
            batchNo: l.batchNo?.trim() || undefined,
            expiryDate: l.expiryDate ? new Date(l.expiryDate).toISOString() : undefined,
          })),
        });

        if (!res.success) {
          setError(res.error);
          return;
        }

        onOpenChange(false);
        if (onSuccess) onSuccess();
      } catch (err: any) {
        setError(err.message || "Failed to record purchase");
      }
    });
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 animate-in fade-in duration-200" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-4xl translate-x-[-50%] translate-y-[-50%] rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <Dialog.Title className="text-xl font-bold text-slate-900">
                  {isBn ? "নতুন ক্রয় ও স্টক গ্রহণ (New Purchase GRN)" : "New Purchase & Goods Receipt"}
                </Dialog.Title>
                <Dialog.Description className="text-xs text-slate-500 mt-0.5">
                  {isBn
                    ? "সাপ্লাইয়ার বিল, কাঁচামাল/মিষ্টির চালান এবং স্টক ইন এন্ট্রি করুন"
                    : "Receive supplier goods, update weighted-average cost, and record bills"}
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

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Top Details: Supplier, Bill No, Date */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Supplier Select */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isBn ? "সাপ্লাইয়ার নির্বাচন করুন" : "Supplier"} *
                </label>
                <select
                  required
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                >
                  <option value="">{isBn ? "সাপ্লাইয়ার নির্বাচন করুন..." : "Select Supplier..."}</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.phone})
                    </option>
                  ))}
                </select>
              </div>

              {/* Bill No */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isBn ? "চালান / বিল নম্বর (ঐচ্ছিক)" : "Bill / Challan No (Optional)"}
                </label>
                <div className="relative">
                  <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={billNo}
                    onChange={(e) => setBillNo(e.target.value)}
                    placeholder={isBn ? "খালি রাখলে স্বয়ংক্রিয় হবে" : "Auto-generated if blank"}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isBn ? "গ্রহণের তারিখ" : "Received Date"} *
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="date"
                    required
                    value={receivedDate}
                    onChange={(e) => setReceivedDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-100 px-4 py-2.5 flex items-center justify-between border-b border-slate-200">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {isBn ? "মালামালের বিবরণ ও মূল্য" : "Goods Line Items & Costs"}
                </span>
                <button
                  type="button"
                  onClick={addLine}
                  className="flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-800 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isBn ? "আইটেম যোগ করুন" : "Add Line"}</span>
                </button>
              </div>

              <div className="p-3 space-y-2 max-h-64 overflow-y-auto">
                {lines.map((line, idx) => {
                  const prod = products.find((p) => p.id === line.productId);
                  const lineTotal = (Number(line.quantity) || 0) * (Number(line.unitCost) || 0);

                  return (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 p-2 rounded-xl bg-slate-50/80 border border-slate-200/80 items-center text-xs"
                    >
                      {/* Product Select */}
                      <div className="col-span-12 sm:col-span-4">
                        <select
                          required
                          value={line.productId}
                          onChange={(e) => handleProductChange(idx, e.target.value)}
                          className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.unit})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quantity */}
                      <div className="col-span-4 sm:col-span-2">
                        <input
                          type="number"
                          step="any"
                          required
                          value={line.quantity}
                          onChange={(e) => handleLineChange(idx, "quantity", e.target.value)}
                          placeholder={isBn ? "পরিমাণ" : "Qty"}
                          className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono font-medium"
                        />
                      </div>

                      {/* Unit Cost */}
                      <div className="col-span-4 sm:col-span-2">
                        <input
                          type="number"
                          step="any"
                          required
                          value={line.unitCost}
                          onChange={(e) => handleLineChange(idx, "unitCost", e.target.value)}
                          placeholder={isBn ? "দর (৳)" : "Rate"}
                          className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono font-medium"
                        />
                      </div>

                      {/* Line Total */}
                      <div className="col-span-3 sm:col-span-3 text-right font-mono font-bold text-slate-800 pr-1">
                        <MoneyText amount={lineTotal} />
                      </div>

                      {/* Remove */}
                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          disabled={lines.length <= 1}
                          onClick={() => removeLine(idx)}
                          className="p-1 text-slate-400 hover:text-red-600 disabled:opacity-20 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Billing Breakdown & Payment */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              {/* Payment Allocation */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  {isBn ? "পেমেন্ট নিষ্পত্তি" : "Payment Settlement"}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isBn ? "পরিশোধকৃত টাকা (৳)" : "Paid Amount (৳)"}
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold text-emerald-700"
                  />
                </div>

                {numPaid > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {isBn ? "পরিশোধের মাধ্যম (Account)" : "Payment Account"} *
                    </label>
                    <select
                      value={accountId}
                      onChange={(e) => setAccountId(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                    >
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} ({a.type})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isBn ? "মন্তব্য / চালান নোট (ঐচ্ছিক)" : "Note / Remarks"}
                  </label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={isBn ? "যেমন: বিশেষ কোয়ালিটি ছানা" : "e.g. Milk delivery batch #4"}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Subtotal, Tax, Discount & Due Summary */}
              <div className="space-y-2 text-xs">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  {isBn ? "বিল সারাংশ" : "Bill Summary"}
                </div>

                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">{isBn ? "সাবটোটাল:" : "Subtotal:"}</span>
                  <span className="font-mono font-bold text-slate-800">
                    <MoneyText amount={subtotal} />
                  </span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-200">
                  <span className="text-slate-500">{isBn ? "ভ্যাট / ট্যাক্স (+):" : "Tax (+):"}</span>
                  <input
                    type="number"
                    step="any"
                    value={taxAmount}
                    onChange={(e) => setTaxAmount(e.target.value)}
                    className="w-24 text-right px-2 py-1 text-xs bg-white border border-slate-200 rounded-lg font-mono"
                  />
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-200">
                  <span className="text-slate-500">{isBn ? "মূল্যছাড় / ডিসকাউন্ট (-):" : "Discount (-):"}</span>
                  <input
                    type="number"
                    step="any"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className="w-24 text-right px-2 py-1 text-xs bg-white border border-slate-200 rounded-lg font-mono"
                  />
                </div>

                <div className="flex justify-between py-1.5 border-b-2 border-slate-300 font-bold text-sm">
                  <span className="text-slate-900">{isBn ? "সর্বমোট প্রদেয় বিল:" : "Total Bill:"}</span>
                  <span className="font-mono text-slate-900">
                    <MoneyText amount={totalBill} />
                  </span>
                </div>

                <div className="flex justify-between py-1 text-xs font-semibold text-emerald-700">
                  <span>{isBn ? "পরিশোধকৃত টাকা:" : "Paid Amount:"}</span>
                  <span className="font-mono">
                    <MoneyText amount={numPaid} />
                  </span>
                </div>

                <div className="flex justify-between py-1 text-xs font-bold text-blue-700 bg-blue-50/60 p-2 rounded-lg border border-blue-100">
                  <span>{isBn ? "সাপ্লাইয়ার বাকি (Due):" : "Supplier Due Balance:"}</span>
                  <span className="font-mono">
                    <MoneyText amount={dueAmount} />
                  </span>
                </div>
              </div>
            </div>

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
                {isBn ? "ক্রয় নিশ্চিত ও স্টক ইন করুন" : "Confirm Purchase & Stock In"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
