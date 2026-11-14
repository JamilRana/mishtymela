"use client";

import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { createOrderAction } from "@/actions/orders";
import { MoneyText } from "@/components/shared/MoneyText";
import { Plus, Trash2, Calendar, User, Phone, AlertCircle, Loader2, Sparkles, X } from "lucide-react";
import { useRouter } from "next/navigation";

interface ProductOption {
  id: string;
  name: string;
  sku: string;
  sellingPrice: number;
  stock: number;
  unit?: string | null;
}

interface ContactOption {
  id: string;
  name: string;
  phone: string;
}

interface NewOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: ProductOption[];
  customers: ContactOption[];
  accounts: Array<{ id: string; name: string; type: string }>;
  onSuccess?: () => void;
}

interface OrderItemRow {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export function NewOrderModal({
  isOpen,
  onClose,
  products,
  customers,
  accounts,
  onSuccess,
}: NewOrderModalProps) {
  const router = useRouter();

  // Tomorrow as default delivery date
  const tomorrowStr = React.useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }, []);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [contactId, setContactId] = useState<string | null>(null);
  const [deliveryDate, setDeliveryDate] = useState(tomorrowStr);
  const [notes, setNotes] = useState("");
  const [discount, setDiscount] = useState<number>(0);
  const [advancePaid, setAdvancePaid] = useState<number>(0);
  const [accountId, setAccountId] = useState<string>(accounts[0]?.id ?? "");

  const [items, setItems] = useState<OrderItemRow[]>([
    { productId: products[0]?.id ?? "", quantity: 1, unitPrice: products[0]?.sellingPrice ?? 0 },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Customer autofill on select
  const handleSelectCustomer = (cId: string) => {
    if (!cId) {
      setContactId(null);
      return;
    }
    const found = customers.find((c) => c.id === cId);
    if (found) {
      setContactId(found.id);
      setCustomerName(found.name);
      setCustomerPhone(found.phone);
    }
  };

  const handleAddItem = () => {
    if (products.length === 0) return;
    setItems((prev) => [
      ...prev,
      { productId: products[0].id, quantity: 1, unitPrice: products[0].sellingPrice },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleProductChange = (index: number, pId: string) => {
    const prod = products.find((p) => p.id === pId);
    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              productId: pId,
              unitPrice: prod ? prod.sellingPrice : item.unitPrice,
            }
          : item
      )
    );
  };

  const handleQuantityChange = (index: number, qty: number) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, quantity: Math.max(0.001, qty) } : item))
    );
  };

  const handlePriceChange = (index: number, price: number) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, unitPrice: Math.max(0, price) } : item))
    );
  };

  // Computations
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const total = Math.max(0, subtotal - discount);
  const dueBalance = Math.max(0, total - advancePaid);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!customerName.trim() || !customerPhone.trim()) {
      setError("গ্রাহকের নাম ও ফোন নম্বর আবশ্যক");
      return;
    }

    if (items.length === 0) {
      setError("কমপক্ষে একটি পণ্য যোগ করুন");
      return;
    }

    if (advancePaid > 0 && !accountId) {
      setError("অগ্রিম জমার জন্য একটি একাউন্ট নির্বাচন করুন");
      return;
    }

    setLoading(true);
    try {
      const res = await createOrderAction({
        contactId,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        deliveryDate,
        notes: notes.trim() || null,
        items,
        discount,
        advancePaid,
        accountId: advancePaid > 0 ? accountId : undefined,
      });

      if (!res.success) {
        setError(res.error || "অর্ডার তৈরি করতে ব্যর্থ হয়েছে");
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
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] rounded-2xl bg-card p-6 shadow-2xl border max-h-[92vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <Dialog.Title className="text-lg font-bold">
                  নতুন অগ্রিম অর্ডার বুকিং (New Advance Order)
                </Dialog.Title>
                <Dialog.Description className="text-xs text-muted-foreground mt-0.5">
                  অনুষ্ঠান, বিবাহ বা উৎসবের জন্য মিষ্টি ও বেকারি পণ্যের অর্ডার গ্রহণ করুন
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

            {/* Customer Selection & Details */}
            <div className="p-3 bg-muted/30 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">গ্রাহক নির্বাচন (Customer):</span>
                {customers.length > 0 && (
                  <select
                    onChange={(e) => handleSelectCustomer(e.target.value)}
                    className="text-xs border rounded px-2 py-1 bg-background"
                  >
                    <option value="">-- বিদ্যমান কন্টাক্ট থেকে বাছাই করুন --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium block mb-1">গ্রাহকের নাম (Name) *</label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="উদাঃ মোঃ জামান"
                      className="w-full pl-8 pr-3 py-1.5 border rounded-lg text-xs bg-background outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1">মোবাইল নম্বর (Phone) *</label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="017XXXXXXXX"
                      className="w-full pl-8 pr-3 py-1.5 border rounded-lg text-xs font-mono bg-background outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Schedule & Notes */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium block mb-1">
                  ডেলিভারির তারিখ (Delivery Date) *
                </label>
                <div className="relative">
                  <Calendar className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().slice(0, 10)}
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 border rounded-lg text-xs font-mono bg-background outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium block mb-1">বিশেষ নির্দেশনা / প্যাকিং নোট</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="উদাঃ লাল ফিতার ৫টি ৫ কেজির স্পেশাল বক্স"
                  className="w-full px-3 py-1.5 border rounded-lg text-xs bg-background outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            {/* Items Section */}
            <div className="space-y-2 border rounded-lg p-3">
              <div className="flex items-center justify-between pb-1 border-b">
                <span className="text-xs font-semibold">অর্ডারের পণ্য তালিকা (Items)</span>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="inline-flex items-center gap-1 text-[11px] bg-primary text-primary-foreground px-2 py-1 rounded hover:bg-primary/90"
                >
                  <Plus className="w-3 h-3" /> আইটেম যোগ করুন
                </button>
              </div>

              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {items.map((item, idx) => {
                  return (
                    <div key={idx} className="flex items-center gap-2 text-xs bg-muted/20 p-2 rounded border">
                      <div className="flex-1 min-w-[150px]">
                        <select
                          value={item.productId}
                          onChange={(e) => handleProductChange(idx, e.target.value)}
                          className="w-full border rounded px-2 py-1 bg-background text-xs"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.unit || "pcs"}) - মজুদ: {p.stock}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-20">
                        <input
                          type="number"
                          min="0.1"
                          step="any"
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(idx, parseFloat(e.target.value) || 0)}
                          placeholder="পরিমাণ"
                          className="w-full border rounded px-2 py-1 text-center font-mono bg-background text-xs"
                        />
                      </div>

                      <div className="w-24">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.unitPrice}
                          onChange={(e) => handlePriceChange(idx, parseFloat(e.target.value) || 0)}
                          placeholder="দর"
                          className="w-full border rounded px-2 py-1 text-right font-mono bg-background text-xs"
                        />
                      </div>

                      <div className="w-24 text-right font-mono font-bold text-xs">
                        <MoneyText amount={item.quantity * item.unitPrice} />
                      </div>

                      <button
                        type="button"
                        disabled={items.length === 1}
                        onClick={() => handleRemoveItem(idx)}
                        className="text-muted-foreground hover:text-destructive disabled:opacity-30 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pricing & Advance Payment */}
            <div className="p-3 bg-muted/40 rounded-lg space-y-2 border text-xs">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">উপমোট (Subtotal):</span>
                <span className="font-mono font-semibold">
                  <MoneyText amount={subtotal} />
                </span>
              </div>

              <div className="flex justify-between items-center">
                <label className="text-muted-foreground">ছাড় (Discount) ৳:</label>
                <input
                  type="number"
                  min="0"
                  max={subtotal}
                  step="any"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  className="w-28 px-2 py-1 border rounded text-right font-mono bg-background"
                />
              </div>

              <div className="flex justify-between items-center font-bold text-sm pt-1 border-t">
                <span>সর্বমোট বিল (Total):</span>
                <span className="font-mono">
                  <MoneyText amount={total} />
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                <div>
                  <label className="font-semibold block mb-1">অগ্রিম জমা (Advance Paid) ৳:</label>
                  <input
                    type="number"
                    min="0"
                    max={total}
                    step="any"
                    value={advancePaid}
                    onChange={(e) => setAdvancePaid(parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 border rounded font-mono font-bold text-emerald-600 bg-background"
                  />
                </div>

                {advancePaid > 0 && (
                  <div>
                    <label className="font-semibold block mb-1">অগ্রিম জমার একাউন্ট:</label>
                    <select
                      value={accountId}
                      onChange={(e) => setAccountId(e.target.value)}
                      className="w-full px-2 py-1 border rounded bg-background text-xs"
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

              <div className="flex justify-between items-center font-bold text-rose-600 pt-1 border-t">
                <span>ডেলিভারির সময় প্রদেয় বাকি (Due at Delivery):</span>
                <span className="font-mono text-sm">
                  <MoneyText amount={dueBalance} />
                </span>
              </div>
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
                অর্ডার বুকিং সম্পন্ন করুন
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
