"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Search,
  X,
  Plus,
  Minus,
  Loader2,
  AlertCircle,
  AlertTriangle,
  Receipt,
  CreditCard,
  Banknote,
  Smartphone,
  ChevronDown,
  Trash2,
  Box,
} from "lucide-react";
import { useCartStore } from "@/stores/cart";
import { useHydratedLanguage } from "@/stores/language";
import { formatMoney } from "@/components/shared/MoneyText";
import { toBnDigits } from "@/lib/bangla-numbers";
import { PosReceiptModal, type ReceiptData } from "./PosReceiptModal";
import { createSaleAction } from "@/actions/sales";
import { cn } from "@/lib/utils";

interface PosProduct {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  sellingPrice: number;
  stockQty: number;
  unit: string;
  categoryName: string;
  categoryId: string | null;
}

interface PosAccount {
  id: string;
  name: string;
  type: string;
}

interface PosCategory {
  id: string;
  name: string;
}

export interface PackagingBoxItem {
  id: string;
  name: string;
  sku: string;
  unit: string;
  stockQty: number;
  avgCost?: number;
}

interface PosTerminalProps {
  products: PosProduct[];
  accounts: PosAccount[];
  categories: PosCategory[];
  packagingBoxes?: PackagingBoxItem[];
  shopProfile?: {
    name: string;
    address?: string | null;
    phone?: string | null;
    vatNumber?: string | null;
    receiptFooter?: string | null;
  };
  sessionStatus?: {
    isOpen: boolean;
    id?: string;
    openedAt?: string;
    businessDate?: string;
    openedByName?: string;
  };
}

const btn =
  "w-10 h-10 grid place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 active:bg-slate-100 disabled:opacity-40 transition-colors shadow-2xs";

function Stepper({
  shown,
  qty,
  max,
  label,
  onChange,
}: {
  shown: string;
  qty: number;
  max: number;
  label: string;
  onChange: (q: number) => void;
}) {
  return (
    <div className="flex items-center shrink-0 gap-1">
      <button
        type="button"
        aria-label={`Decrease ${label}`}
        className={btn}
        onClick={() => onChange(qty - 1)}
      >
        <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
      </button>
      <span className="w-8 text-center tabular-nums font-bold text-xs text-slate-800">
        {shown}
      </span>
      <button
        type="button"
        aria-label={`Increase ${label}`}
        className={btn}
        disabled={qty >= max}
        onClick={() => onChange(qty + 1)}
      >
        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
      </button>
    </div>
  );
}

function QuantityControl({
  qty,
  max,
  unit,
  label,
  onChange,
  bn,
}: {
  qty: number;
  max: number;
  unit?: string;
  label: string;
  onChange: (q: number) => void;
  bn: boolean;
}) {
  const isKg = unit === "kg";

  const handleDec = () => {
    if (isKg) {
      if (qty <= 0.25) {
        onChange(0);
      } else {
        const next = Math.round((qty - 0.25) * 1000) / 1000;
        onChange(next);
      }
    } else {
      onChange(qty - 1);
    }
  };

  const handleInc = () => {
    if (isKg) {
      const next = Math.min(max, Math.round((qty + 0.25) * 1000) / 1000);
      onChange(next);
    } else {
      onChange(Math.min(max, qty + 1));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    if (text === "") {
      onChange(0);
      return;
    }
    const val = parseFloat(text);
    if (!isNaN(val) && val >= 0) {
      onChange(Math.min(max, Math.round(val * 1000) / 1000));
    }
  };

  return (
    <div className="flex items-center shrink-0 gap-1">
      <button
        type="button"
        aria-label={`Decrease ${label}`}
        className={btn}
        onClick={handleDec}
        title={
          isKg
            ? bn
              ? "০.২৫ কেজি কমান"
              : "Decrease 0.25 kg"
            : bn
            ? "১ পিস কমান"
            : "Decrease 1"
        }
      >
        <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
      </button>

      <div className="relative">
        <input
          type="number"
          step={isKg ? "0.01" : "1"}
          min="0"
          max={max}
          value={qty === 0 ? "" : qty}
          onChange={handleInputChange}
          placeholder="0"
          className="w-14 h-10 text-center font-black text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 tabular-nums text-xs transition-all"
          title={
            isKg
              ? bn
                ? "ওজন লিখুন (যেমন: 0.5)"
                : "Enter weight in kg"
              : bn
              ? "সংখ্যা লিখুন"
              : "Enter quantity"
          }
        />
      </div>

      <button
        type="button"
        aria-label={`Increase ${label}`}
        className={btn}
        disabled={qty >= max}
        onClick={handleInc}
        title={
          isKg
            ? bn
              ? "০.২৫ কেজি বাড়ান"
              : "Increase 0.25 kg"
            : bn
            ? "১ পিস বাড়ান"
            : "Increase 1"
        }
      >
        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
      </button>
    </div>
  );
}

const inputClass =
  "w-full h-10 px-3 text-xs bg-slate-50/80 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 tabular-nums transition-all";

export const PosTerminal: React.FC<PosTerminalProps> = ({
  products,
  accounts,
  categories,
  packagingBoxes = [],
  shopProfile,
  sessionStatus,
}) => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [boxes, setBoxes] = useState<Record<string, number>>({});
  const [sheetOpen, setSheetOpen] = useState(false);
  const { t, language } = useHydratedLanguage();
  const bn = language === "bn";
  const searchRef = useRef<HTMLInputElement>(null);
  const keyRef = useRef<string | null>(null);

  const paymentAccounts = useMemo(
    () => accounts.filter((a) => a.type === "CASH" || a.type === "BANK" || a.type === "MOBILE"),
    [accounts]
  );
  const [selectedAccountId, setSelectedAccountId] = useState<string>(() => {
    const defaultAcc = paymentAccounts.find((a) => a.type === "CASH") ?? paymentAccounts[0] ?? accounts[0];
    return defaultAcc?.id ?? "";
  });

  const {
    items,
    discount,
    paid,
    paymentMethod,
    customerName,
    addItem,
    removeItem,
    updateQuantity,
    setDiscount,
    setPaid,
    setPaymentMethod,
    setCustomerName,
    clearCart,
    subtotal,
    total,
    due,
    change,
  } = useCartStore();

  const num = (v: number) => (bn ? toBnDigits(v) : String(v));
  const money = (v: number) => formatMoney(v, language);

  const formatQtyWithUnit = (quantity: number, unit: string) => {
    if (unit === "kg") {
      if (quantity === 0.25) return bn ? "২৫০ গ্রাম (১ পোয়া)" : "250g (0.25kg)";
      if (quantity === 0.5) return bn ? "৫০০ গ্রাম (আধা কেজি)" : "500g (0.5kg)";
      if (quantity === 0.75) return bn ? "৭৫০ গ্রাম" : "750g (0.75kg)";
      return bn ? `${toBnDigits(quantity)} কেজি` : `${quantity} kg`;
    }
    if (unit === "pot") {
      return bn ? `${toBnDigits(quantity)} হাঁড়ি` : `${quantity} pot`;
    }
    return bn ? `${toBnDigits(quantity)} পিস` : `${quantity} pcs`;
  };

  const boxCount = Object.values(boxes).reduce((s, q) => s + q, 0);
  const itemCount = items.reduce((s, i) => s + i.quantity, 0) + boxCount;
  const qtyOf = (id: string) => items.find((i) => i.productId === id)?.quantity ?? 0;

  const signature = JSON.stringify([
    items.map((i) => [i.productId, i.quantity, i.unitPrice]),
    discount,
    paid,
    paymentMethod,
    boxes,
  ]);
  useEffect(() => {
    keyRef.current = null;
    setError(null);
  }, [signature]);

  const autoAssignBoxes = useCallback(() => {
    if (packagingBoxes.length === 0) return;
    const box1kg = packagingBoxes.find(
      (b) => b.sku.includes("1KG") || b.name.includes("1kg") || b.name.includes("১ কেজি")
    );
    const box500g = packagingBoxes.find(
      (b) => b.sku.includes("500G") || b.name.includes("0.5kg") || b.name.includes("আধা কেজি")
    );
    const kg = items.reduce((s, it) => (it.unit === "kg" ? s + it.quantity : s), 0);
    const next: Record<string, number> = {};
    if (kg > 0) {
      const whole = Math.floor(kg),
        rest = kg - whole;
      if (box1kg && whole > 0) next[box1kg.id] = whole;
      if (rest > 0) {
        if (box500g) next[box500g.id] = (next[box500g.id] || 0) + (rest <= 0.5 ? 1 : 2);
        else if (box1kg) next[box1kg.id] = (next[box1kg.id] || 0) + 1;
      }
    }
    setBoxes(next);
  }, [items, packagingBoxes]);

  const prevCount = useRef(items.length);
  useEffect(() => {
    if (items.length > 0 && prevCount.current === 0) autoAssignBoxes();
    else if (items.length === 0) setBoxes({});
    prevCount.current = items.length;
  }, [items.length, autoAssignBoxes]);

  const setBoxQty = (id: string, qty: number) =>
    setBoxes((prev) => {
      const next = { ...prev };
      if (qty <= 0) delete next[id];
      else next[id] = qty;
      return next;
    });

  const accountId = useCallback((): string | undefined => {
    return selectedAccountId || paymentAccounts[0]?.id || accounts[0]?.id;
  }, [selectedAccountId, paymentAccounts, accounts]);

  const checkout = useCallback(async () => {
    if (items.length === 0 || submitting) return;
    setError(null);
    const net = total();
    const tendered = paid !== null ? paid : net;
    const billPaid = Math.max(0, Math.min(tendered, net));
    const accId = accountId();
    if (billPaid > 0 && !accId) {
      setError("No payment account is set up for this method.");
      return;
    }

    setSubmitting(true);
    if (!keyRef.current)
      keyRef.current = `pos-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`}`;
    try {
      const boxLines = Object.entries(boxes).filter(([, q]) => q > 0);
      const res = await createSaleAction({
        idempotencyKey: keyRef.current,
        items: [
          ...items.map((i) => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice })),
          ...boxLines.map(([productId, quantity]) => ({ productId, quantity, unitPrice: 0 })),
        ],
        discount,
        paid: billPaid,
        accountId: accId,
        customerName: customerName.trim() || undefined,
      });
      if (!res.success) {
        setError(res.error);
        return;
      }

      setReceipt({
        invoiceNo: res.sale.invoiceNo,
        customerName: customerName.trim() || undefined,
        items: [
          ...items.map((i) => ({
            name: i.name,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            lineTotal: i.quantity * i.unitPrice,
          })),
          ...boxLines.map(([id, quantity]) => ({
            name: `${packagingBoxes.find((b) => b.id === id)?.name ?? "Box"} (${bn ? "প্যাকেজিং বক্স • ফ্রি" : "Packaging box • free"})`,
            quantity,
            unitPrice: 0,
            lineTotal: 0,
          })),
        ],
        subtotal: subtotal(),
        discount,
        total: net,
        paid: tendered,
        due: due(),
        change: change(),
        accountName: accounts.find((a) => a.id === accId)?.name ?? paymentMethod,
        date: new Date(),
      });
      keyRef.current = null;
      clearCart();
      setBoxes({});
      setSheetOpen(false);
    } catch (e: any) {
      setError(e?.message || "Could not complete the sale. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }, [
    items,
    boxes,
    packagingBoxes,
    submitting,
    total,
    paid,
    accountId,
    discount,
    customerName,
    accounts,
    subtotal,
    due,
    change,
    clearCart,
    paymentMethod,
    bn,
  ]);

  const checkoutRef = useRef(checkout);
  useEffect(() => {
    checkoutRef.current = checkout;
  }, [checkout]);

  useEffect(() => {
    if (window.innerWidth >= 1024) searchRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === "F9") {
        e.preventDefault();
        checkoutRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const q = search.trim().toLowerCase();
  const visible = products.filter(
    (p) =>
      (category === "all" || p.categoryId === category) &&
      (!q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.barcode?.toLowerCase().includes(q))
  );

  const onSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setSearch("");
      return;
    }
    if (e.key !== "Enter" || !q) return;
    e.preventDefault();
    const hit =
      products.find((p) => p.barcode?.toLowerCase() === q || p.sku.toLowerCase() === q) ??
      (visible.length === 1 ? visible[0] : undefined);
    if (!hit) return;
    if (hit.stockQty <= 0) {
      setError(`${hit.name} is out of stock.`);
      return;
    }
    addItem(hit);
    setSearch("");
  };

  const stockBadge = (p: PosProduct) => {
    if (p.stockQty <= 0) {
      return (
        <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
          {bn ? "স্টক শেষ" : "Out of stock"}
        </span>
      );
    }
    if (p.stockQty <= 5) {
      return (
        <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded tabular-nums">
          {bn ? `${toBnDigits(p.stockQty)} বাকি` : `${p.stockQty} left`}
        </span>
      );
    }
    return (
      <span className="text-[11px] font-semibold text-slate-500 tabular-nums">
        {bn ? `${toBnDigits(p.stockQty)} স্টকে` : `${p.stockQty} in stock`}
      </span>
    );
  };

  const tot = total();
  const quickCash = Array.from(new Set([50, 100, 500, 1000].map((s) => Math.ceil(tot / s) * s)))
    .filter((v) => v > tot)
    .slice(0, 3);

  const header = (inSheet: boolean) => (
    <div className="h-14 px-4 flex items-center justify-between border-b border-slate-200 bg-white shrink-0">
      <div className="flex items-center gap-2">
        <Receipt className="w-4 h-4 text-blue-600" />
        {inSheet ? (
          <Dialog.Title className="text-sm font-bold text-slate-900">{t("currentOrder")}</Dialog.Title>
        ) : (
          <h2 className="text-sm font-bold text-slate-900">{t("currentOrder")}</h2>
        )}
        <span className="text-xs font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full tabular-nums">
          {num(itemCount)}
        </span>
      </div>
      <div className="flex items-center gap-1">
        {items.length > 0 && (
          <button
            type="button"
            onClick={() => {
              clearCart();
              setBoxes({});
            }}
            className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded-md transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t("clearCart")}</span>
          </button>
        )}
        {inSheet && (
          <Dialog.Close aria-label="Close" className="w-9 h-9 grid place-items-center text-slate-400 hover:text-slate-600 rounded-md">
            <X className="w-5 h-5" />
          </Dialog.Close>
        )}
      </div>
    </div>
  );

  const cartBody = (
    <div className="flex-1 min-h-0 flex flex-col bg-slate-50/50">
      {error && (
        <div role="alert" className="mx-4 mt-3 p-3 flex gap-2 text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-lg">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Cart Items List */}
      <ul className="flex-1 min-h-0 overflow-y-auto px-4 divide-y divide-slate-100">
        {items.length === 0 && (
          <li className="py-20 text-center space-y-2">
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <Receipt className="w-6 h-6 stroke-1" />
            </div>
            <p className="text-xs font-bold text-slate-600">{t("emptyCart")}</p>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
              {bn ? "বাম পাশের তালিকা থেকে আইটেম স্পর্শ করুন বা বারকোড স্ক্যান করুন।" : "Scan barcode or select products to add to current order."}
            </p>
          </li>
        )}

        {items.map((it) => {
          const isKg = it.unit === "kg";
          return (
            <li key={it.productId} className="py-3 space-y-2 bg-white px-3 my-1.5 rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-black text-slate-900 truncate">{it.name}</div>
                  <div className="text-[11px] text-slate-500 tabular-nums mt-0.5">
                    {money(it.unitPrice)} / {it.unit} ×{" "}
                    <span className="font-bold text-blue-700">
                      {formatQtyWithUnit(it.quantity, it.unit)}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-black text-slate-900 tabular-nums">
                    {money(it.unitPrice * it.quantity)}
                  </div>
                </div>
              </div>

              {/* Stepper & Touch Controls */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <QuantityControl
                  qty={it.quantity}
                  max={it.stockQty}
                  unit={it.unit}
                  label={it.name}
                  bn={bn}
                  onChange={(n) => (n <= 0 ? removeItem(it.productId) : updateQuantity(it.productId, n))}
                />

                {/* Quick Weight & Quantity Chips */}
                <div className="flex items-center gap-1 overflow-x-auto [scrollbar-width:none]">
                  {isKg ? (
                    <>
                      <button
                        type="button"
                        onClick={() => updateQuantity(it.productId, 0.25)}
                        className={cn(
                          "px-2 py-1 rounded text-[11px] font-bold transition-all border shrink-0",
                          it.quantity === 0.25
                            ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        )}
                      >
                        {bn ? "২৫০ গ্রাম" : "250g"}
                      </button>
                      <button
                        type="button"
                        onClick={() => updateQuantity(it.productId, 0.5)}
                        className={cn(
                          "px-2 py-1 rounded text-[11px] font-bold transition-all border shrink-0",
                          it.quantity === 0.5
                            ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        )}
                      >
                        {bn ? "৫০০ গ্রাম" : "500g"}
                      </button>
                      <button
                        type="button"
                        onClick={() => updateQuantity(it.productId, 1)}
                        className={cn(
                          "px-2 py-1 rounded text-[11px] font-bold transition-all border shrink-0",
                          it.quantity === 1
                            ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        )}
                      >
                        {bn ? "১ কেজি" : "1 kg"}
                      </button>
                    </>
                  ) : (
                    <>
                      {[1, 2, 5, 10].map((count) => (
                        <button
                          key={count}
                          type="button"
                          onClick={() => updateQuantity(it.productId, count)}
                          className={cn(
                            "px-2 py-1 rounded text-[11px] font-bold transition-all border shrink-0",
                            it.quantity === count
                              ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          )}
                        >
                          {bn ? `${toBnDigits(count)} পিস` : `${count} pcs`}
                        </button>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Checkout Drawer Summary */}
      {items.length > 0 && (
        <div className="shrink-0 max-h-[62vh] overflow-y-auto border-t border-slate-200 p-4 space-y-3 bg-white shadow-lg">
          {/* Packaging Boxes Accordion */}
          {packagingBoxes.length > 0 && (
            <details className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden text-xs">
              <summary className="min-h-10 px-3 flex items-center justify-between cursor-pointer font-bold text-slate-700 select-none">
                <span className="flex items-center gap-1.5">
                  <Box className="w-3.5 h-3.5 text-slate-500" />
                  {bn ? "মিষ্টির বক্স (ফ্রি)" : "Packaging boxes (free)"}
                </span>
                <span className="px-2 py-0.5 bg-slate-200 text-slate-800 rounded font-mono">
                  {num(boxCount)}
                </span>
              </summary>
              <div className="px-3 pb-3 pt-1 divide-y divide-slate-100 border-t border-slate-200/60 bg-white">
                {packagingBoxes.map((b) => (
                  <div key={b.id} className="py-2 flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-slate-700 truncate">{b.name}</span>
                    <Stepper
                      shown={num(boxes[b.id] || 0)}
                      qty={boxes[b.id] || 0}
                      max={b.stockQty}
                      label={b.name}
                      onChange={(n) => setBoxQty(b.id, n)}
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={autoAssignBoxes}
                  className="mt-2 text-xs font-bold text-blue-700 hover:underline inline-block"
                >
                  {bn ? "ওজন অনুযায়ী স্বয়ংক্রিয় হিসাব" : "Auto-fill from weights"}
                </button>
              </div>
            </details>
          )}

          {/* Subtotal & Discount Rows */}
          <div className="space-y-1.5 text-xs text-slate-600">
            <div className="flex items-center justify-between">
              <span>{t("subtotal")}</span>
              <span className="font-bold tabular-nums text-slate-800">{money(subtotal())}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="pos-discount" className="font-medium text-slate-700">
                {t("discount")}
              </label>
              <input
                id="pos-discount"
                type="number"
                inputMode="decimal"
                min={0}
                max={subtotal()}
                placeholder="0"
                value={discount === 0 ? "" : discount}
                className={cn(inputClass, "w-24 text-right font-bold")}
                onChange={(e) =>
                  setDiscount(Math.min(subtotal(), Math.max(0, Number(e.target.value) || 0)))
                }
              />
            </div>
          </div>

          {/* Executive Register Total Display */}
          <div className="p-3.5 bg-slate-900 text-white rounded-xl flex items-center justify-between shadow-xs">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                {t("totalAmount")}
              </span>
              <span className="text-xs text-slate-300">
                {num(itemCount)} {t("itemCount")}
              </span>
            </div>
            <div className="text-2xl font-black tabular-nums tracking-tight text-white">
              {money(tot)}
            </div>
          </div>

          {/* Payment Method Selector */}
          <fieldset>
            <legend className="text-xs font-bold text-slate-700 mb-1.5">{t("paymentMethod")}</legend>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {paymentAccounts.map((a) => {
                const isSelected = selectedAccountId === a.id;
                return (
                  <button
                    key={a.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => {
                      setSelectedAccountId(a.id);
                      setPaymentMethod(a.type === "CASH" ? "Cash" : a.type === "MOBILE" ? "bKash" : "Bank");
                    }}
                    className={cn(
                      "h-10 px-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all truncate",
                      isSelected
                        ? "bg-blue-600 border-blue-600 text-white shadow-xs"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    )}
                  >
                    {a.type === "CASH" && <Banknote className="w-3.5 h-3.5 shrink-0" />}
                    {a.type === "MOBILE" && <Smartphone className="w-3.5 h-3.5 shrink-0" />}
                    {a.type === "BANK" && <CreditCard className="w-3.5 h-3.5 shrink-0" />}
                    <span className="truncate">{a.name}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* Received Amount & Quick Cash */}
          <div>
            <label htmlFor="pos-received" className="text-xs font-bold text-slate-700 block mb-1">
              {t("amountReceived")}
            </label>
            <input
              id="pos-received"
              type="number"
              inputMode="decimal"
              min={0}
              value={paid ?? ""}
              placeholder={String(tot)}
              className={cn(inputClass, "font-bold text-slate-900")}
              onChange={(e) =>
                setPaid(e.target.value === "" ? null : Math.max(0, Number(e.target.value)))
              }
            />
            {paymentMethod === "Cash" && (
              <div className="flex items-center gap-1.5 mt-2 overflow-x-auto [scrollbar-width:none]">
                <button
                  type="button"
                  onClick={() => setPaid(null)}
                  className="h-8 px-2.5 text-xs font-bold rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 shrink-0"
                >
                  {bn ? "ঠিক টাকা" : "Exact"}
                </button>
                {quickCash.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setPaid(v)}
                    className="h-8 px-2.5 text-xs font-bold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 tabular-nums shrink-0"
                  >
                    {num(v)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Customer Name */}
          <div>
            <label htmlFor="pos-customer" className="text-xs font-bold text-slate-700 block mb-1">
              {t("customerNameOptional")}
            </label>
            <input
              id="pos-customer"
              type="text"
              value={customerName}
              placeholder={t("walkInCustomer")}
              className={inputClass}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>

          {/* Financial Deltas: Change or Due */}
          {change() > 0 && (
            <div className="flex justify-between items-center text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg">
              <span>{t("changeGiven")}</span>
              <span className="tabular-nums font-black">{money(change())}</span>
            </div>
          )}
          {due() > 0 && (
            <div className="flex justify-between items-center text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
              <span>{t("creditDue")}</span>
              <span className="tabular-nums font-black">{money(due())}</span>
            </div>
          )}

          {/* Checkout CTA */}
          <button
            type="button"
            onClick={checkout}
            disabled={submitting}
            className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-black text-sm flex items-center justify-center gap-2 shadow-sm disabled:bg-blue-400 transition-all cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t("processingSale")}</span>
              </>
            ) : (
              <>
                <span>{t("completeSale")}</span>
                <span>·</span>
                <span className="tabular-nums">{money(tot)}</span>
                <span className="text-[10px] font-mono opacity-70 bg-black/20 px-1.5 py-0.5 rounded">
                  F9
                </span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-100/60">
      {/* Non-blocking Day Status Banner */}
      {!sessionStatus?.isOpen && (
        <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 flex items-center justify-between text-xs text-amber-900 font-medium shrink-0">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              {bn
                ? "আজকের দিনের ট্রেডিং সেশন এখনও খোলা হয়নি — বিক্রয় অব্যাহত থাকবে এবং আজকের সেশনে যুক্ত হবে।"
                : "Day session is not open yet — sales are allowed and will be attributed to today's session."}
            </span>
          </div>
          <Link
            href="/finance?tab=daily"
            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold rounded transition-colors shrink-0"
          >
            {bn ? "দিন শুরু করুন (Open Day)" : "Open Day"}
          </Link>
        </div>
      )}

      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Section: Product Browser */}
        <section className="flex-1 min-w-0 flex flex-col">
        {/* Search & Hotkey Header */}
        <div className="p-3 bg-white border-b border-slate-200 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchRef}
              type="search"
              inputMode="search"
              enterKeyHint="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={onSearchKey}
              placeholder={t("searchProduct")}
              aria-label={t("searchProduct")}
              className={cn(inputClass, "pl-9 pr-14 text-xs")}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {search && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => {
                    setSearch("");
                    searchRef.current?.focus();
                  }}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <span className="hidden sm:inline-block text-[10px] font-mono text-slate-400 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded font-bold">
                F2
              </span>
            </div>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div
          role="tablist"
          className="flex gap-2 p-3 bg-white border-b border-slate-200 overflow-x-auto shrink-0 [scrollbar-width:none]"
        >
          {[{ id: "all", name: t("allCategories") }, ...categories].map((c) => (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={category === c.id}
              onClick={() => setCategory(c.id)}
              className={cn(
                "h-8 px-3.5 rounded-full text-xs font-bold whitespace-nowrap transition-all",
                category === c.id
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Product Catalog Grid */}
        <ul className="flex-1 overflow-y-auto p-3 pb-24 lg:pb-3 grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 content-start gap-2.5">
          {visible.length === 0 && (
            <li className="py-20 text-center text-slate-500 col-span-full">
              {bn ? "কোনো পণ্য পাওয়া যায়নি।" : "No products found."}
            </li>
          )}
          {visible.map((p) => {
            const out = p.stockQty <= 0;
            const qty = qtyOf(p.id);

            return (
              <li
                key={p.id}
                className={cn(
                  "flex items-center gap-3 p-3 bg-white border rounded-xl transition-all shadow-2xs",
                  qty > 0
                    ? "border-blue-500/40 ring-1 ring-blue-500/20 bg-blue-50/20"
                    : "border-slate-200 hover:border-slate-300"
                )}
              >
                <button
                  type="button"
                  disabled={out}
                  onClick={() => addItem(p)}
                  className="flex-1 min-w-0 text-left disabled:opacity-50 cursor-pointer"
                >
                  <div className="text-xs font-bold text-slate-900 truncate">{p.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                    <span className="font-black text-slate-900 tabular-nums">
                      {money(p.sellingPrice)}
                    </span>
                    <span className="text-[11px] text-slate-400">/ {p.unit}</span>
                    <span>•</span>
                    {stockBadge(p)}
                  </div>
                </button>

                {qty > 0 ? (
                  <QuantityControl
                    qty={qty}
                    max={p.stockQty}
                    unit={p.unit}
                    label={p.name}
                    bn={bn}
                    onChange={(n) => (n <= 0 ? removeItem(p.id) : updateQuantity(p.id, n))}
                  />
                ) : (
                  <button
                    type="button"
                    disabled={out}
                    aria-label={`Add ${p.name}`}
                    onClick={() => addItem(p)}
                    className={btn}
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {/* Right Section: Executive Register Order Docket (Desktop) */}
      <aside className="hidden lg:flex w-[400px] shrink-0 flex-col bg-white border-l border-slate-200 shadow-sm">
        {header(false)}
        {cartBody}
      </aside>

      {/* Mobile Floating Order Pill */}
      {itemCount > 0 && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 flex items-center justify-between gap-3 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-white border-t border-slate-200 shadow-2xl">
          <div>
            <div className="text-xs font-bold text-slate-500">
              {num(itemCount)} {t("itemCount")}
            </div>
            <div className="text-base font-black text-slate-900 tabular-nums">
              {money(tot)}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="h-11 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs shadow-md"
          >
            {t("viewCartAndPay")}
          </button>
        </div>
      )}

      {/* Mobile Cart Sheet */}
      <Dialog.Root open={sheetOpen} onOpenChange={setSheetOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden" />
          <Dialog.Content
            aria-describedby={undefined}
            className="fixed z-50 inset-x-0 bottom-0 top-12 flex flex-col bg-white rounded-t-2xl lg:hidden focus:outline-none shadow-2xl"
          >
            {header(true)}
            {cartBody}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Receipt Modal */}
      <PosReceiptModal
        open={receipt !== null}
        receipt={receipt}
        onNewSale={() => setReceipt(null)}
        shopProfile={shopProfile}
      />
      </div>
    </div>
  );
};