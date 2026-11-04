"use client";

import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  X,
  ArrowDownRight,
  RefreshCw,
  AlertCircle,
  Flame,
  Sparkles,
  Trash2,
  ChefHat,
  Plus,
  Minus,
  Package,
} from "lucide-react";
import {
  receiveStockAction,
  adjustStockAction,
  issueKitchenStockAction,
  reportWastageAction,
  recordSweetProductionAction,
} from "@/actions/inventory";
import { useLanguageStore } from "@/stores/language";

export interface ProductOption {
  id: string;
  name: string;
  sku: string;
  unit: string;
  stockQty: number;
  avgCost: number;
  productType?: "RETAIL" | "RAW_MATERIAL" | "PACKAGING";
  isSellable?: boolean;
}

interface AccountOption {
  id: string;
  name: string;
}

interface ReceiveStockModalProps {
  products: ProductOption[];
  accounts: AccountOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedProductId?: string;
}

export const ReceiveStockModal: React.FC<ReceiveStockModalProps> = ({
  products,
  accounts,
  open,
  onOpenChange,
  preselectedProductId,
}) => {
  const [productId, setProductId] = useState(preselectedProductId || (products[0]?.id ?? ""));
  const [quantity, setQuantity] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [accountId, setAccountId] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !quantity || !unitCost) return;
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await receiveStockAction({
        productId,
        quantity: Number(quantity),
        unitCost: Number(unitCost),
        accountId: accountId || undefined,
        note: note.trim() || undefined,
      });

      if (!res.success) {
        setError(res.error);
        return;
      }

      onOpenChange(false);
      setQuantity("");
      setUnitCost("");
      setNote("");
    } catch (err: any) {
      setError(err?.message || "Failed to receive stock");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 animate-in fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-lg p-6 shadow-2xl border border-slate-200 z-50 animate-in zoom-in-95 focus:outline-none">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 text-blue-700 rounded-md">
                <ArrowDownRight className="w-4 h-4" />
              </div>
              <div>
                <Dialog.Title className="text-base font-semibold text-slate-900">
                  Receive Stock (Stock In)
                </Dialog.Title>
                <Dialog.Description className="text-xs text-slate-500">
                  Record supplier purchase and recalculate average cost
                </Dialog.Description>
              </div>
            </div>
            <Dialog.Close asChild>
              <button className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          {error && (
            <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
            <div>
              <label className="font-medium text-slate-700 block mb-1">Select Product *</label>
              <select
                required
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku}) — Stock: {p.stockQty} {p.unit}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-medium text-slate-700 block mb-1">Quantity Received *</label>
                <input
                  required
                  type="number"
                  min="0.001"
                  step="any"
                  placeholder="e.g. 50"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 tabular-nums font-semibold"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">Unit Cost (৳) *</label>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 85.00"
                  value={unitCost}
                  onChange={(e) => setUnitCost(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 tabular-nums font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="font-medium text-slate-700 block mb-1">
                Disburse From Account (Optional)
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Do not log cash expense (Unpaid/Credit)</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Selecting an account logs a Purchase transaction directly reducing that account balance.
              </p>
            </div>

            <div>
              <label className="font-medium text-slate-700 block mb-1">Note / Reference</label>
              <input
                type="text"
                placeholder="e.g. Batch #401 from City Distributor"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 border border-slate-200 rounded text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-xs disabled:opacity-50"
              >
                {isSubmitting ? "Receiving..." : "Confirm Stock In"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

interface AdjustStockModalProps {
  products: ProductOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AdjustStockModal: React.FC<AdjustStockModalProps> = ({
  products,
  open,
  onOpenChange,
}) => {
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [delta, setDelta] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !delta || !reason.trim()) return;
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await adjustStockAction({
        productId,
        quantityDelta: Number(delta),
        reason: reason.trim(),
      });

      if (!res.success) {
        setError(res.error);
        return;
      }

      onOpenChange(false);
      setDelta("");
      setReason("");
    } catch (err: any) {
      setError(err?.message || "Failed to adjust stock");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 animate-in fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-lg p-6 shadow-2xl border border-slate-200 z-50 animate-in zoom-in-95 focus:outline-none">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-100 text-amber-700 rounded-md">
                <RefreshCw className="w-4 h-4" />
              </div>
              <div>
                <Dialog.Title className="text-base font-semibold text-slate-900">
                  Stock Adjustment
                </Dialog.Title>
                <Dialog.Description className="text-xs text-slate-500">
                  Correct inventory for damage, breakage, loss, or count audit
                </Dialog.Description>
              </div>
            </div>
            <Dialog.Close asChild>
              <button className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          {error && (
            <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
            <div>
              <label className="font-medium text-slate-700 block mb-1">Select Product *</label>
              <select
                required
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku}) — Current: {p.stockQty} {p.unit}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-medium text-slate-700 block mb-1">
                Quantity Change (+ or -) *
              </label>
              <input
                required
                type="number"
                step="any"
                placeholder="e.g. -2 for damage, or +5 for recount"
                value={delta}
                onChange={(e) => setDelta(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 tabular-nums font-semibold"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Use a negative number to write off damaged items. Use positive for excess stock found.
              </p>
            </div>

            <div>
              <label className="font-medium text-slate-700 block mb-1">Reason for Adjustment *</label>
              <input
                required
                type="text"
                placeholder="e.g. Broken during shelf reorganization"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 border border-slate-200 rounded text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold shadow-xs disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : "Save Adjustment"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

/* -------------------------------------------------------------
 * 1. ISSUE TO KITCHEN MODAL (কারখানায় কাঁচামাল সরবরাহ)
 * ------------------------------------------------------------- */
interface IssueKitchenModalProps {
  products: ProductOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const IssueKitchenModal: React.FC<IssueKitchenModalProps> = ({
  products,
  open,
  onOpenChange,
}) => {
  const { language } = useLanguageStore();
  // Filter raw materials first, or all products
  const rawMaterials = products.filter(
    (p) => p.productType === "RAW_MATERIAL" || p.sku.startsWith("RAW-")
  );
  const eligibleProducts = rawMaterials.length > 0 ? rawMaterials : products;

  const [productId, setProductId] = useState(eligibleProducts[0]?.id ?? "");
  const [quantity, setQuantity] = useState("");
  const [karigorName, setKarigorName] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedProduct = products.find((p) => p.id === productId) || eligibleProducts[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !quantity || Number(quantity) <= 0) return;
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await issueKitchenStockAction({
        productId,
        quantity: Number(quantity),
        karigorName: karigorName.trim() || undefined,
        note: note.trim() || undefined,
      });

      if (!res.success) {
        setError(res.error);
        return;
      }

      onOpenChange(false);
      setQuantity("");
      setKarigorName("");
      setNote("");
    } catch (err: any) {
      setError(err?.message || "Failed to issue raw material to kitchen");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 animate-in fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-lg p-6 shadow-2xl border border-slate-200 z-50 animate-in zoom-in-95 focus:outline-none">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-100 text-amber-700 rounded-md">
                <ChefHat className="w-4 h-4" />
              </div>
              <div>
                <Dialog.Title className="text-base font-semibold text-slate-900">
                  {language === "bn" ? "কারখানায় কাঁচামাল ইস্যু" : "Issue to Kitchen"}
                </Dialog.Title>
                <Dialog.Description className="text-xs text-slate-500">
                  {language === "bn"
                    ? "দুধ, চিনি, ঘি ইত্যাদি মিষ্টি তৈরির কারখানায় স্থানান্তর"
                    : "Transfer raw ingredients from stock to sweet kitchen"}
                </Dialog.Description>
              </div>
            </div>
            <Dialog.Close asChild>
              <button className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          {error && (
            <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
            <div>
              <label className="font-medium text-slate-700 block mb-1">
                {language === "bn" ? "কাঁচামাল নির্বাচন করুন *" : "Select Raw Material *"}
              </label>
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              >
                {eligibleProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — ({language === "bn" ? "স্টক: " : "Stock: "}
                    {p.stockQty} {p.unit})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-medium text-slate-700 block mb-1">
                {language === "bn" ? "ইস্যুর পরিমাণ" : "Issue Quantity"} (
                {selectedProduct?.unit ?? "unit"}) *
              </label>
              <input
                required
                type="number"
                step="any"
                min="0.01"
                max={selectedProduct?.stockQty ?? undefined}
                placeholder={`e.g. 20 (Max: ${selectedProduct?.stockQty ?? 0})`}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 tabular-nums font-bold"
              />
            </div>

            <div>
              <label className="font-medium text-slate-700 block mb-1">
                {language === "bn" ? "কারিগর / বাবুর্চির নাম" : "Karigor / Chef Name"}
              </label>
              <input
                type="text"
                placeholder={language === "bn" ? "উদা: মো: সেলিম কারিগর" : "e.g. Master Chef Selim"}
                value={karigorName}
                onChange={(e) => setKarigorName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="font-medium text-slate-700 block mb-1">
                {language === "bn" ? "উৎপাদন বিবরণ / নোট" : "Production Note"}
              </label>
              <input
                type="text"
                placeholder={
                  language === "bn"
                    ? "উদা: সকালের রসগোল্লা ও চমচম তৈরির ব্যাচ"
                    : "e.g. Morning Rosogolla & Chomchom batch"
                }
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 border border-slate-200 rounded text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                {language === "bn" ? "বাতিল" : "Cancel"}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold shadow-xs disabled:opacity-50"
              >
                {isSubmitting
                  ? language === "bn"
                    ? "ইস্যু হচ্ছে..."
                    : "Issuing..."
                  : language === "bn"
                  ? "কিচেনে ইস্যু নিশ্চিত করুন"
                  : "Confirm Kitchen Issue"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

/* -------------------------------------------------------------
 * 2. RECORD SWEET PRODUCTION BATCH (মিষ্টি উৎপাদন এন্ট্রি)
 * ------------------------------------------------------------- */
interface SweetProductionModalProps {
  products: ProductOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SweetProductionModal: React.FC<SweetProductionModalProps> = ({
  products,
  open,
  onOpenChange,
}) => {
  const { language } = useLanguageStore();

  const retailSweets = products.filter(
    (p) => p.isSellable || p.productType === "RETAIL" || p.sku.startsWith("SWT-") || p.sku.startsWith("DOI-")
  );
  const rawMaterials = products.filter(
    (p) => p.productType === "RAW_MATERIAL" || p.sku.startsWith("RAW-")
  );

  const [sweetProductId, setSweetProductId] = useState(retailSweets[0]?.id ?? "");
  const [quantityProduced, setQuantityProduced] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Optional: Ingredients consumed for this batch
  const [ingredients, setIngredients] = useState<Record<string, string>>({});

  const selectedSweet = products.find((p) => p.id === sweetProductId) || retailSweets[0];

  const handleIngredientChange = (rawId: string, val: string) => {
    setIngredients((prev) => ({ ...prev, [rawId]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sweetProductId || !quantityProduced || Number(quantityProduced) <= 0) return;
    setError(null);
    setIsSubmitting(true);

    try {
      const idempotencyKey = `prod-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const ingredientsUsed = Object.entries(ingredients)
        .filter(([_, q]) => Number(q) > 0)
        .map(([productId, q]) => ({
          productId,
          quantity: Number(q),
        }));

      const res = await recordSweetProductionAction({
        sweetProductId,
        quantityProduced: Number(quantityProduced),
        ingredientsUsed: ingredientsUsed.length > 0 ? ingredientsUsed : undefined,
        note: note.trim() || undefined,
        idempotencyKey,
      });

      if (!res.success) {
        setError(res.error);
        return;
      }

      onOpenChange(false);
      setQuantityProduced("");
      setIngredients({});
      setNote("");
    } catch (err: any) {
      setError(err?.message || "Failed to record sweet production");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 animate-in fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-lg p-6 shadow-2xl border border-slate-200 z-50 animate-in zoom-in-95 focus:outline-none max-h-[92vh] overflow-y-auto">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-100 text-emerald-700 rounded-md">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <Dialog.Title className="text-base font-semibold text-slate-900">
                  {language === "bn" ? "মিষ্টি উৎপাদন ও স্টক ইন" : "Sweet Production Batch"}
                </Dialog.Title>
                <Dialog.Description className="text-xs text-slate-500">
                  {language === "bn"
                    ? "তৈরিকৃত তাজা মিষ্টি কাউন্টারের স্টকে যোগ করুন"
                    : "Add freshly produced sweets directly to POS counter stock"}
                </Dialog.Description>
              </div>
            </div>
            <Dialog.Close asChild>
              <button className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          {error && (
            <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
            <div>
              <label className="font-medium text-slate-700 block mb-1">
                {language === "bn" ? "প্রস্তুতকৃত মিষ্টির নাম *" : "Produced Sweet Item *"}
              </label>
              <select
                value={sweetProductId}
                onChange={(e) => setSweetProductId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
              >
                {retailSweets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — ({language === "bn" ? "বর্তমান স্টক: " : "Current Stock: "}
                    {p.stockQty} {p.unit})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-medium text-slate-700 block mb-1">
                {language === "bn" ? "উৎপাদনের পরিমাণ" : "Quantity Produced"} (
                {selectedSweet?.unit ?? "kg"}) *
              </label>
              <input
                required
                type="number"
                step="any"
                min="0.1"
                placeholder="e.g. 15 (kg)"
                value={quantityProduced}
                onChange={(e) => setQuantityProduced(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 tabular-nums font-bold text-sm"
              />
            </div>

            {/* Optional: Raw materials consumed for this batch */}
            {rawMaterials.length > 0 && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">
                    {language === "bn"
                      ? "ব্যবহৃত কাঁচামাল (ঐচ্ছিক স্বয়ংক্রিয় হিসাব)"
                      : "Ingredients Consumed (Optional Auto-deduct)"}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {language === "bn" ? "স্টক থেকে স্বয়ংক্রিয়ভাবে কাটা হবে" : "Deducted from raw stock"}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {rawMaterials.map((rm) => (
                    <div key={rm.id} className="flex items-center justify-between bg-white p-2 rounded border border-slate-200">
                      <div className="min-w-0 pr-2">
                        <span className="font-medium text-slate-800 block truncate">{rm.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {language === "bn" ? "স্টক: " : "Stock: "}{rm.stockQty} {rm.unit}
                        </span>
                      </div>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        placeholder="0"
                        value={ingredients[rm.id] || ""}
                        onChange={(e) => handleIngredientChange(rm.id, e.target.value)}
                        className="w-16 px-2 py-1 text-right bg-slate-50 border border-slate-300 rounded font-bold text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="font-medium text-slate-700 block mb-1">
                {language === "bn" ? "ব্যাচ বিবরণ / নোট" : "Batch Description / Note"}
              </label>
              <input
                type="text"
                placeholder={
                  language === "bn"
                    ? "উদা: সকালের ফ্রেশ রসগোল্লা তৈরি"
                    : "e.g. Fresh morning batch ready for sale"
                }
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 border border-slate-200 rounded text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                {language === "bn" ? "বাতিল" : "Cancel"}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow-xs disabled:opacity-50"
              >
                {isSubmitting
                  ? language === "bn"
                    ? "যোগ হচ্ছে..."
                    : "Adding..."
                  : language === "bn"
                  ? "কাউন্টারে স্টক ইন করুন"
                  : "Complete & Stock In"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

/* -------------------------------------------------------------
 * 3. REPORT WASTAGE / SPOILAGE MODAL (নষ্ট / অপচয় রিপোর্ট)
 * ------------------------------------------------------------- */
interface ReportWastageModalProps {
  products: ProductOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ReportWastageModal: React.FC<ReportWastageModalProps> = ({
  products,
  open,
  onOpenChange,
}) => {
  const { language } = useLanguageStore();

  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedProduct = products.find((p) => p.id === productId) || products[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !quantity || Number(quantity) <= 0 || !reason.trim()) return;
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await reportWastageAction({
        productId,
        quantity: Number(quantity),
        reason: reason.trim(),
      });

      if (!res.success) {
        setError(res.error);
        return;
      }

      onOpenChange(false);
      setQuantity("");
      setReason("");
    } catch (err: any) {
      setError(err?.message || "Failed to record wastage");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 animate-in fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-lg p-6 shadow-2xl border border-slate-200 z-50 animate-in zoom-in-95 focus:outline-none">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-rose-100 text-rose-700 rounded-md">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <Dialog.Title className="text-base font-semibold text-slate-900">
                  {language === "bn" ? "অপচয় ও নষ্ট মালামাল রিপোর্ট" : "Report Spoilage / Wastage"}
                </Dialog.Title>
                <Dialog.Description className="text-xs text-slate-500">
                  {language === "bn"
                    ? "দুধ নষ্ট হওয়া, মিষ্টি নষ্ট হওয়া বা অপচয় লিখে স্টক সমন্বয় করুন"
                    : "Record curdled milk, spoiled sweets, or damaged items"}
                </Dialog.Description>
              </div>
            </div>
            <Dialog.Close asChild>
              <button className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          {error && (
            <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
            <div>
              <label className="font-medium text-slate-700 block mb-1">
                {language === "bn" ? "নষ্ট পণ্যের নাম *" : "Select Item *"}
              </label>
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({language === "bn" ? "স্টক: " : "Stock: "}
                    {p.stockQty} {p.unit})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-medium text-slate-700 block mb-1">
                {language === "bn" ? "নষ্টের পরিমাণ" : "Wastage Quantity"} (
                {selectedProduct?.unit ?? "unit"}) *
              </label>
              <input
                required
                type="number"
                step="any"
                min="0.01"
                placeholder={`e.g. 2 (${selectedProduct?.unit ?? "unit"})`}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 tabular-nums font-bold"
              />
            </div>

            <div>
              <label className="font-medium text-slate-700 block mb-1">
                {language === "bn" ? "নষ্ট হওয়ার কারণ *" : "Reason for Wastage *"}
              </label>
              <input
                required
                type="text"
                placeholder={
                  language === "bn"
                    ? "উদা: গরমে দুধ টকে নষ্ট হয়ে গেছে"
                    : "e.g. Milk curdled due to summer heat"
                }
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 border border-slate-200 rounded text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                {language === "bn" ? "বাতিল" : "Cancel"}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold shadow-xs disabled:opacity-50"
              >
                {isSubmitting
                  ? language === "bn"
                    ? "রেকর্ড হচ্ছে..."
                    : "Recording..."
                  : language === "bn"
                  ? "অপচয় সমন্বয় করুন"
                  : "Record Wastage"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
