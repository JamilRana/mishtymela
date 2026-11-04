"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Search,
  Barcode,
  Trash2,
  Plus,
  Minus,
  Check,
  CreditCard,
  Banknote,
  Smartphone,
  AlertCircle,
  ShoppingBag,
  ArrowLeft,
  ChevronRight,
  Package,
  Loader2,
} from "lucide-react";
import { useCartStore } from "@/stores/cart";
import { useLanguageStore } from "@/stores/language";
import { formatMoney } from "@/components/shared/MoneyText";
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
}

export const PosTerminal: React.FC<PosTerminalProps> = ({
  products,
  accounts,
  categories,
  packagingBoxes = [],
  shopProfile,
}) => {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedReceipt, setCompletedReceipt] = useState<ReceiptData | null>(null);

  // Sweet packaging boxes given with sale (boxId -> quantity)
  const [selectedBoxes, setSelectedBoxes] = useState<Record<string, number>>({});

  const { t, language } = useLanguageStore();

  // Mobile navigation state: "products" or "cart"
  const [mobileTab, setMobileTab] = useState<"products" | "cart">("products");

  const searchInputRef = useRef<HTMLInputElement>(null);

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

  const totalBoxCount = Object.values(selectedBoxes).reduce((sum, q) => sum + q, 0);
  const totalItemCount = items.reduce((s, i) => s + i.quantity, 0) + totalBoxCount;

  // Auto-suggest packaging boxes based on sweet weight in cart (items measured in kg or pieces)
  const autoAssignBoxes = useCallback(() => {
    if (!packagingBoxes || packagingBoxes.length === 0) return;
    const box1kg = packagingBoxes.find(
      (b) => b.sku.includes("1KG") || b.name.includes("1kg") || b.name.includes("১ কেজি")
    );
    const box500g = packagingBoxes.find(
      (b) => b.sku.includes("500G") || b.name.includes("0.5kg") || b.name.includes("আধা কেজি")
    );

    // Sum weight of sweet items in cart
    const sweetKg = items.reduce((sum, it) => (it.unit === "kg" ? sum + it.quantity : sum), 0);
    const newBoxes: Record<string, number> = {};

    if (sweetKg > 0) {
      const wholeKg = Math.floor(sweetKg);
      const remainder = sweetKg - wholeKg;

      if (box1kg && wholeKg > 0) {
        newBoxes[box1kg.id] = wholeKg;
      }
      if (remainder > 0) {
        if (box500g) {
          newBoxes[box500g.id] = (newBoxes[box500g.id] || 0) + (remainder <= 0.5 ? 1 : 2);
        } else if (box1kg) {
          newBoxes[box1kg.id] = (newBoxes[box1kg.id] || 0) + 1;
        }
      }
    }
    setSelectedBoxes(newBoxes);
  }, [items, packagingBoxes]);

  // When cart transitions from empty to having items, auto-assign boxes
  const prevItemsCountRef = useRef(items.length);
  useEffect(() => {
    if (items.length > 0 && prevItemsCountRef.current === 0) {
      autoAssignBoxes();
    } else if (items.length === 0) {
      setSelectedBoxes({});
    }
    prevItemsCountRef.current = items.length;
  }, [items.length, autoAssignBoxes]);

  const handleUpdateBoxQty = (boxId: string, qty: number) => {
    setSelectedBoxes((prev) => {
      const next = { ...prev };
      if (qty <= 0) {
        delete next[boxId];
      } else {
        next[boxId] = qty;
      }
      return next;
    });
  };

  // Helper to find account by chosen payment method
  const getSelectedAccountId = useCallback((): string | undefined => {
    const acc = accounts.find((a) => {
      if (paymentMethod === "Cash") return a.type === "CASH" || a.name.toLowerCase().includes("cash");
      if (paymentMethod === "bKash") return a.type === "MOBILE" || a.name.toLowerCase().includes("bkash");
      if (paymentMethod === "Bank") return a.type === "BANK" || a.name.toLowerCase().includes("bank");
      return false;
    });
    return acc ? acc.id : accounts[0]?.id;
  }, [accounts, paymentMethod]);

  const handleCheckout = useCallback(async () => {
    if (items.length === 0 || isSubmitting) return;
    setError(null);

    const netTotal = total();
    // Cash received by cashier (could be e.g. 500 on a 120 bill)
    const tendered = paid !== null ? paid : netTotal;
    // Amount paid toward invoice (cannot exceed bill total)
    const billPaid = Math.max(0, Math.min(tendered, netTotal));
    const selectedAccountId = getSelectedAccountId();

    if (billPaid > 0 && !selectedAccountId) {
      setError("Please select a valid payment account.");
      return;
    }

    setIsSubmitting(true);
    const idempotencyKey = `pos-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    try {
      // Include any sweet boxes given with the sale at unit price 0 (free packaging)
      const boxSaleItems = Object.entries(selectedBoxes)
        .filter(([_, qty]) => qty > 0)
        .map(([boxId, qty]) => ({
          productId: boxId,
          quantity: qty,
          unitPrice: 0,
        }));

      const allSaleItems = [
        ...items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
        ...boxSaleItems,
      ];

      const res = await createSaleAction({
        idempotencyKey,
        items: allSaleItems,
        discount,
        paid: billPaid,
        accountId: selectedAccountId,
        customerName: customerName.trim() || undefined,
      });

      if (!res.success) {
        setError(res.error);
        return;
      }

      const activeAccount = accounts.find((a) => a.id === selectedAccountId);

      const receiptItems = [
        ...items.map((i) => ({
          name: i.name,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          lineTotal: i.quantity * i.unitPrice,
        })),
        ...Object.entries(selectedBoxes)
          .filter(([_, qty]) => qty > 0)
          .map(([boxId, qty]) => {
            const box = packagingBoxes.find((b) => b.id === boxId);
            return {
              name: `${box?.name ?? "Sweet Box"} (${language === "bn" ? "প্যাকেজিং বক্স • ফ্রি" : "Packaging Box • Free"})`,
              quantity: qty,
              unitPrice: 0,
              lineTotal: 0,
            };
          }),
      ];

      setCompletedReceipt({
        invoiceNo: res.sale.invoiceNo,
        customerName: customerName.trim() || undefined,
        items: receiptItems,
        subtotal: subtotal(),
        discount,
        total: netTotal,
        paid: tendered,
        due: due(),
        change: change(),
        accountName: activeAccount?.name ?? paymentMethod,
        date: new Date(),
      });

      clearCart();
      setSelectedBoxes({});
      setMobileTab("products");
    } catch (err: any) {
      console.error("handleCheckout error:", err);
      setError(err?.message || "Checkout failed. Please check stock levels.");
    } finally {
      setIsSubmitting(false);
    }
  }, [items, selectedBoxes, packagingBoxes, isSubmitting, total, paid, getSelectedAccountId, discount, customerName, accounts, subtotal, due, change, clearCart, paymentMethod, language]);

  // Keep a ref to handleCheckout so keydown listener does not need to rebind on every state change
  const handleCheckoutRef = useRef(handleCheckout);
  useEffect(() => {
    handleCheckoutRef.current = handleCheckout;
  }, [handleCheckout]);

  // Focus search input ONCE on initial mount only
  useEffect(() => {
    // Only focus if we're on a non-touch / desktop device to avoid popping up mobile keyboard automatically
    if (window.innerWidth >= 1024) {
      searchInputRef.current?.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not hijack standard keys when typing in other inputs
      const target = e.target as HTMLElement;
      const isInput = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.tagName === "SELECT";

      if (e.key === "F2") {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "F9") {
        e.preventDefault();
        handleCheckoutRef.current();
      } else if (e.key === "Escape" && isInput) {
        if (target === searchInputRef.current) {
          setSearch("");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Filter products by category and search
  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      selectedCategory === "all" || p.categoryId === selectedCategory;
    const query = search.trim().toLowerCase();
    const matchesSearch =
      query === "" ||
      p.name.toLowerCase().includes(query) ||
      p.sku.toLowerCase().includes(query) ||
      (p.barcode && p.barcode.toLowerCase().includes(query));

    return matchesCategory && matchesSearch;
  });

  // Barcode enter handler (instant add on exact match)
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const code = search.trim();
      if (!code) return;

      const exactMatch = products.find(
        (p) =>
          (p.barcode && p.barcode.toLowerCase() === code.toLowerCase()) ||
          p.sku.toLowerCase() === code.toLowerCase()
      );

      if (exactMatch) {
        if (exactMatch.stockQty > 0) {
          addItem(exactMatch);
          setSearch("");
        } else {
          setError(`Product "${exactMatch.name}" is out of stock.`);
        }
      } else if (filteredProducts.length === 1) {
        if (filteredProducts[0].stockQty > 0) {
          addItem(filteredProducts[0]);
          setSearch("");
        }
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden bg-slate-100 relative">
      {/* MOBILE SEGMENTED BAR: Switch between Products and Cart on small screens */}
      <div className="lg:hidden flex items-center bg-white border-b border-slate-200 px-3 py-2 shrink-0 z-20">
        <div className="flex-1 grid grid-cols-2 p-1 bg-slate-100 rounded-lg text-xs font-semibold">
          <button
            type="button"
            onClick={() => setMobileTab("products")}
            className={cn(
              "py-1.5 rounded-md flex items-center justify-center gap-1.5 transition-all",
              mobileTab === "products"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-500 hover:text-slate-900"
            )}
          >
            <Package className="w-3.5 h-3.5" />
            <span>{t("catalogTab")}</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("cart")}
            className={cn(
              "py-1.5 rounded-md flex items-center justify-center gap-1.5 transition-all relative",
              mobileTab === "cart"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-500 hover:text-slate-900"
            )}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>{t("orderTab")}</span>
            {totalItemCount > 0 && (
              <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-0.5">
                {totalItemCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* LEFT PANE: Product Catalog & Touch Grid */}
      <div
        className={cn(
          "flex-1 min-h-0 lg:h-full flex-col border-r border-slate-200 overflow-hidden bg-white",
          mobileTab === "products" ? "flex" : "hidden lg:flex"
        )}
      >
        {/* Search & Barcode Input */}
        <div className="p-3 sm:p-4 border-b border-slate-100 flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder={t("searchProduct")}
              className="w-full pl-9 pr-10 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
            <Barcode className="w-5 h-5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Category Pills */}
        <div className="px-3 sm:px-4 py-2 border-b border-slate-100 flex items-center gap-2 overflow-x-auto shrink-0 bg-slate-50/60 no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
              selectedCategory === "all"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            )}
          >
            {t("allCategories")}
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedCategory(c.id)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                selectedCategory === c.id
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="flex-1 p-3 sm:p-4 overflow-y-auto pb-24 lg:pb-4">
          {filteredProducts.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
              <ShoppingBag className="w-8 h-8 mb-2 stroke-1 text-slate-300" />
              <span>No products match your search.</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3.5">
              {filteredProducts.map((p) => {
                const isOutOfStock = p.stockQty <= 0;
                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={isOutOfStock}
                    onClick={() => addItem(p)}
                    className={cn(
                      "flex flex-col justify-between p-3 rounded-lg border text-left transition-all relative select-none min-h-[105px]",
                      isOutOfStock
                        ? "bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed"
                        : "bg-white border-slate-200 hover:border-blue-400 hover:shadow-xs active:scale-[0.98]"
                    )}
                  >
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono">
                        {p.sku}
                      </span>
                      <h4 className="font-semibold text-slate-900 text-xs sm:text-sm line-clamp-2 mt-0.5 leading-snug">
                        {p.name}
                      </h4>
                    </div>

                    <div className="mt-2.5 flex items-baseline justify-between border-t border-slate-100 pt-2">
                      <span className="font-bold text-slate-900 text-xs sm:text-sm">
                        {formatMoney(p.sellingPrice)}
                      </span>
                      <span
                        className={cn(
                          "text-[10px] font-medium px-1.5 py-0.5 rounded",
                          isOutOfStock
                            ? "bg-rose-100 text-rose-700 font-semibold"
                            : p.stockQty <= 5
                            ? "bg-amber-100 text-amber-700 font-semibold"
                            : "bg-slate-100 text-slate-600"
                        )}
                      >
                        {isOutOfStock ? "Out" : `${p.stockQty} in stock`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* MOBILE STICKY FLOATING ORDER BAR (When viewing catalog with items in cart) */}
        {totalItemCount > 0 && mobileTab === "products" && (
          <div className="lg:hidden fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-xl z-30 flex items-center justify-between gap-3">
            <div className="flex flex-col">
              <span className="text-xs text-slate-500 font-medium">
                {totalItemCount} {totalItemCount === 1 ? "item" : "items"}
              </span>
              <span className="text-base font-bold text-slate-900">
                {formatMoney(total())}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setMobileTab("cart")}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold shadow-md transition-colors"
            >
              <span>{t("viewCartAndPay")}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* RIGHT PANE: Cart & Checkout Summary */}
      <div
        className={cn(
          "w-full lg:w-[420px] xl:w-[460px] flex-1 min-h-0 lg:flex-initial lg:h-full flex-col bg-white shrink-0 border-l border-slate-200 shadow-xs z-10 overflow-hidden",
          mobileTab === "cart" ? "flex" : "hidden lg:flex"
        )}
      >
        {/* Cart Header */}
        <div className="p-3.5 sm:p-4 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            {/* Mobile back to products button */}
            <button
              type="button"
              onClick={() => setMobileTab("products")}
              className="lg:hidden p-1.5 -ml-1 text-slate-500 hover:text-slate-800 rounded-md"
              title="Back to products catalog"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h2 className="font-semibold text-slate-900 text-sm">{t("currentOrder")}</h2>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
              {totalItemCount} {t("itemCount")}
            </span>
          </div>
          {items.length > 0 && (
            <button
              type="button"
              onClick={() => {
                clearCart();
                setSelectedBoxes({});
              }}
              className="text-xs text-rose-600 hover:text-rose-700 font-medium transition-colors p-1"
            >
              {t("clearCart")}
            </button>
          )}
        </div>

        {/* Error notification */}
        {error && (
          <div className="m-3 p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700 flex items-center gap-2 shrink-0 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span className="flex-1">{error}</span>
          </div>
        )}

        {/* Cart Items List */}
        <div className="flex-1 p-3 overflow-y-auto divide-y divide-slate-100 min-h-0">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs py-12">
              <ShoppingBag className="w-10 h-10 mb-2 stroke-1 text-slate-300" />
              <span>{t("emptyCart")}</span>
              <button
                type="button"
                onClick={() => setMobileTab("products")}
                className="mt-2 text-xs text-blue-600 font-semibold lg:hidden"
              >
                {t("browseCatalogPrompt")}
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.productId} className="py-2.5 flex items-center justify-between gap-2 sm:gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-semibold text-slate-900 truncate">{item.name}</h4>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <span>{formatMoney(item.unitPrice)}</span>
                    <span>×</span>
                    <span className="font-semibold text-slate-800">{item.quantity}</span>
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    className="w-7 h-7 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded text-slate-600 transition-colors"
                    title="Decrease quantity"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-7 text-center text-xs font-semibold text-slate-900 tabular-nums">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    className="w-7 h-7 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded text-slate-600 transition-colors"
                    title="Increase quantity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Line Total & Remove */}
                <div className="flex items-center gap-2 shrink-0 text-right">
                  <span className="text-xs font-bold text-slate-900 tabular-nums min-w-[50px]">
                    {formatMoney(item.unitPrice * item.quantity)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItem(item.productId)}
                    className="text-slate-300 hover:text-rose-600 p-1 rounded transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}

          {/* Display Complimentary Packaging Boxes in Cart Items List */}
          {Object.entries(selectedBoxes).map(([boxId, qty]) => {
            if (qty <= 0) return null;
            const box = packagingBoxes.find((b) => b.id === boxId);
            if (!box) return null;
            return (
              <div
                key={box.id}
                className="py-2 px-2.5 flex items-center justify-between gap-2 bg-purple-50/70 border border-purple-200/80 rounded-md my-1.5 animate-in fade-in"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-1 rounded">
                      {language === "bn" ? "ফ্রি বক্স" : "Free Box"}
                    </span>
                    <h4 className="text-xs font-semibold text-purple-950 truncate">{box.name}</h4>
                  </div>
                  <div className="text-[10px] text-purple-600 mt-0.5">
                    {qty} {box.unit} • {language === "bn" ? "মিষ্টির সাথে প্যাকেজিং" : "Complimentary packaging"}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-purple-700 font-mono">৳0.00</span>
                  <button
                    type="button"
                    onClick={() => handleUpdateBoxQty(box.id, 0)}
                    className="text-slate-300 hover:text-rose-600 p-1"
                    title="Remove packaging box"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Calculation & Checkout Segment */}
        {items.length > 0 && (
          <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 space-y-2.5 shrink-0 overflow-y-auto max-h-[60vh] lg:max-h-none">
            {/* Complimentary Sweet Packaging Boxes Selector */}
            {packagingBoxes.length > 0 && (
              <div className="p-2.5 bg-purple-50/70 border border-purple-200 rounded-lg text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-purple-900">
                    <Package className="w-3.5 h-3.5 text-purple-600" />
                    <span>
                      {language === "bn" ? "মিষ্টির বক্স (প্যাকেজিং)" : "Sweet Packaging Boxes"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={autoAssignBoxes}
                    className="text-[10px] font-semibold text-purple-700 hover:text-purple-800 bg-purple-100 hover:bg-purple-200 px-2 py-0.5 rounded transition-colors"
                    title="Auto-calculate boxes from sweet weight"
                  >
                    {language === "bn" ? "স্বয়ংক্রিয় হিসাব" : "Auto Calculate"}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {packagingBoxes.map((box) => {
                    const qty = selectedBoxes[box.id] || 0;
                    return (
                      <div
                        key={box.id}
                        className={cn(
                          "flex items-center justify-between p-1.5 rounded border text-xs transition-colors",
                          qty > 0
                            ? "bg-white border-purple-400 shadow-xs"
                            : "bg-white/60 border-purple-100"
                        )}
                      >
                        <div className="min-w-0 pr-1">
                          <div className="font-semibold text-slate-800 truncate text-[11px]">
                            {box.name}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {language === "bn" ? "স্টক: " : "Stock: "}
                            {box.stockQty} {box.unit}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            disabled={qty <= 0}
                            onClick={() => handleUpdateBoxQty(box.id, qty - 1)}
                            className="w-5 h-5 rounded flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-30 disabled:pointer-events-none"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-5 text-center font-bold text-purple-900 tabular-nums text-xs">
                            {qty}
                          </span>
                          <button
                            type="button"
                            disabled={qty >= box.stockQty}
                            onClick={() => handleUpdateBoxQty(box.id, qty + 1)}
                            className="w-5 h-5 rounded flex items-center justify-center bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-30 disabled:pointer-events-none"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Discount & Totals */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>{t("subtotal")}</span>
                <span className="font-medium text-slate-800">{formatMoney(subtotal())}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>{t("discount")}</span>
                <input
                  type="number"
                  min="0"
                  max={subtotal()}
                  value={discount === 0 ? "" : discount}
                  placeholder="0"
                  onChange={(e) => {
                    const val = e.target.value;
                    setDiscount(val === "" ? 0 : Math.max(0, Number(val)));
                  }}
                  className="w-24 px-2 py-1 text-right text-xs bg-white border border-slate-300 rounded font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 tabular-nums"
                />
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-1.5 border-t border-slate-200">
                <span>{t("totalAmount")}</span>
                <span className="text-base text-blue-700">{formatMoney(total())}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-1 pt-1">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                {t("paymentMethod")}
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {(["Cash", "bKash", "Bank"] as const).map((method) => {
                  const isSelected = paymentMethod === method;
                  return (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={cn(
                        "py-1.5 sm:py-2 px-2 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border",
                        isSelected
                          ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                          : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                      )}
                    >
                      {method === "Cash" && <Banknote className="w-3.5 h-3.5" />}
                      {method === "bKash" && <Smartphone className="w-3.5 h-3.5" />}
                      {method === "Bank" && <CreditCard className="w-3.5 h-3.5" />}
                      <span>{method === "Cash" ? t("cash") : method === "bKash" ? t("bkash") : t("bank")}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tendered Amount (Cash Mode) or Partial Payment (Credit Mode) */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[10px] font-medium text-slate-500 block mb-1">
                  {t("amountReceived")}
                </label>
                <input
                  type="number"
                  min="0"
                  value={paid !== null ? paid : ""}
                  placeholder={total().toString()}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPaid(val === "" ? null : Math.max(0, Number(val)));
                  }}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 tabular-nums"
                />
              </div>

              <div>
                <label className="text-[10px] font-medium text-slate-500 block mb-1">
                  {t("customerNameOptional")}
                </label>
                <input
                  type="text"
                  value={customerName}
                  placeholder={t("walkInCustomer")}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Change or Due indicator */}
            {change() > 0 && (
              <div className="flex justify-between items-center text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded border border-emerald-200">
                <span>{t("changeGiven")}:</span>
                <span className="text-sm font-bold">{formatMoney(change())}</span>
              </div>
            )}
            {due() > 0 && (
              <div className="flex justify-between items-center text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded border border-amber-200">
                <span>{t("creditDue")}:</span>
                <span className="text-sm font-bold">{formatMoney(due())}</span>
              </div>
            )}

            {/* Checkout CTA Button */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleCheckout}
              className={cn(
                "w-full h-11 sm:h-12 mt-1 rounded-md font-bold text-xs sm:text-sm text-white shadow-md flex items-center justify-center gap-2 transition-all",
                isSubmitting
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 active:scale-[0.99] focus:ring-2 focus:ring-blue-500"
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t("processingSale")}</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                  <span>{t("completeSale")} • {formatMoney(total())}</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Printable Thermal Receipt Modal */}
      <PosReceiptModal
        open={completedReceipt !== null}
        receipt={completedReceipt}
        onNewSale={() => setCompletedReceipt(null)}
        shopProfile={shopProfile}
      />
    </div>
  );
};
