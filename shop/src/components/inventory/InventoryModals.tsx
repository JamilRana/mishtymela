"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  Layers,
  Factory,
} from "lucide-react";
import {
  receiveStockAction,
  adjustStockAction,
  issueKitchenStockAction,
  reportWastageAction,
  recordSweetProductionAction,
  bulkIssueFactoryAction,
  recordMultiSweetProductionAction,
} from "@/actions/inventory";
import { useHydratedLanguage } from "@/stores/language";

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
  const { language } = useHydratedLanguage();
  const isBn = language === "bn";

  const [productId, setProductId] = useState(preselectedProductId || (products[0]?.id ?? ""));
  const [quantity, setQuantity] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [accountId, setAccountId] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state whenever modal is opened or preselected item changes
  useEffect(() => {
    if (open) {
      const targetId = preselectedProductId || products[0]?.id || "";
      setProductId(targetId);
      const targetProd = products.find((p) => p.id === targetId);
      if (targetProd && targetProd.avgCost > 0) {
        setUnitCost(String(targetProd.avgCost));
      } else {
        setUnitCost("");
      }
      setQuantity("");
      setError(null);
    }
  }, [open, preselectedProductId]);

  const handleProductSelect = (id: string) => {
    setProductId(id);
    const targetProd = products.find((p) => p.id === id);
    if (targetProd && targetProd.avgCost > 0) {
      setUnitCost(String(targetProd.avgCost));
    }
  };

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
                  {isBn ? "মালামাল রিসিভ (Stock In)" : "Receive Stock (Stock In)"}
                </Dialog.Title>
                <Dialog.Description className="text-xs text-slate-500">
                  {isBn
                    ? "সাপ্লায়ার থেকে ক্রয়কৃত মালামাল স্টক ইন এবং গড় খরচ হিসাব"
                    : "Record supplier purchase and recalculate average cost"}
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
                onChange={(e) => handleProductSelect(e.target.value)}
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
              <p className="text-xs text-slate-500 mt-1">
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
                {isBn ? "বাতিল" : "Cancel"}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-xs disabled:opacity-50"
              >
                {isSubmitting
                  ? (isBn ? "রিসিভ হচ্ছে..." : "Receiving...")
                  : (isBn ? "স্টক ইন নিশ্চিত করুন" : "Confirm Stock In")}
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
  const { language } = useHydratedLanguage();
  const isBn = language === "bn";

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
                  {isBn ? "স্টক সমন্বয় (Stock Adjustment)" : "Stock Adjustment"}
                </Dialog.Title>
                <Dialog.Description className="text-xs text-slate-500">
                  {isBn
                    ? "ভাঙচুর, ঘাটতি বা অডিট গণনায় মজুদের হিসাব সংশোধন"
                    : "Correct inventory for damage, breakage, loss, or count audit"}
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
              <p className="text-xs text-slate-500 mt-1">
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
                {isBn ? "বাতিল" : "Cancel"}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold shadow-xs disabled:opacity-50"
              >
                {isSubmitting
                  ? (isBn ? "সংরক্ষণ হচ্ছে..." : "Saving...")
                  : (isBn ? "সমন্বয় সংরক্ষণ করুন" : "Save Adjustment")}
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
  preselectedProductId?: string;
}

export const IssueKitchenModal: React.FC<IssueKitchenModalProps> = ({
  products,
  open,
  onOpenChange,
  preselectedProductId,
}) => {
  const { language } = useHydratedLanguage();
  // Filter raw materials first, or all products
  const rawMaterials = useMemo(
    () => products.filter((p) => p.productType === "RAW_MATERIAL" || p.sku.startsWith("RAW-")),
    [products]
  );
  const eligibleProducts = rawMaterials.length > 0 ? rawMaterials : products;

  const [productId, setProductId] = useState(preselectedProductId || (eligibleProducts[0]?.id ?? ""));
  const [quantity, setQuantity] = useState("");
  const [karigorName, setKarigorName] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setProductId(preselectedProductId || (eligibleProducts[0]?.id ?? ""));
      setQuantity("");
      setError(null);
    }
  }, [open, preselectedProductId]);

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
  const { language } = useHydratedLanguage();

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
                  <span className="text-xs text-slate-500">
                    {language === "bn" ? "স্টক থেকে স্বয়ংক্রিয়ভাবে কাটা হবে" : "Deducted from raw stock"}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {rawMaterials.map((rm) => (
                    <div key={rm.id} className="flex items-center justify-between bg-white p-2 rounded border border-slate-200">
                      <div className="min-w-0 pr-2">
                        <span className="font-medium text-slate-800 block truncate">{rm.name}</span>
                        <span className="text-xs text-slate-500 font-mono">
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
  const { language } = useHydratedLanguage();

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

/* -------------------------------------------------------------
 * 4. BULK ISSUE FACTORY MODAL (একত্রে কারখানায় কাঁচামাল বরাদ্দ)
 * (e.g. চিনি ৫০ কেজি, সয়াবিন তেল ২০ লিটার, দুধ ১০০ লিটার)
 * ------------------------------------------------------------- */
interface BulkIssueFactoryModalProps {
  products: ProductOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const BulkIssueFactoryModal: React.FC<BulkIssueFactoryModalProps> = ({
  products,
  open,
  onOpenChange,
}) => {
  const { language } = useHydratedLanguage();
  const isBn = language === "bn";

  const rawMaterials = useMemo(
    () => products.filter((p) => p.productType === "RAW_MATERIAL" || p.sku.startsWith("RAW-")),
    [products]
  );
  const eligibleProducts = rawMaterials.length > 0 ? rawMaterials : products;

  const [items, setItems] = useState<Array<{ productId: string; quantity: string }>>([
    { productId: eligibleProducts[0]?.id || "", quantity: "" },
  ]);
  const [karigorName, setKarigorName] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setItems([{ productId: eligibleProducts[0]?.id || "", quantity: "" }]);
      setKarigorName("");
      setNote("");
      setError(null);
    }
  }, [open]);

  const handleAddItem = () => {
    setItems((prev) => [...prev, { productId: eligibleProducts[0]?.id || "", quantity: "" }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: "productId" | "quantity", value: string) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = items
      .filter((i) => i.productId && Number(i.quantity) > 0)
      .map((i) => ({ productId: i.productId, quantity: Number(i.quantity) }));

    if (validItems.length === 0) {
      setError(isBn ? "কমপক্ষে একটি কাঁচামাল ও পরিমাণ দিন" : "Please specify at least one raw material and quantity");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const res = await bulkIssueFactoryAction({
        items: validItems,
        karigorName: karigorName.trim() || undefined,
        note: note.trim() || undefined,
      });

      if (!res.success) {
        setError(res.error);
        return;
      }

      onOpenChange(false);
    } catch (err: any) {
      setError(err?.message || "Failed to allocate raw materials to factory");
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
              <div className="p-2 bg-amber-100 text-amber-700 rounded-md">
                <ChefHat className="w-5 h-5" />
              </div>
              <div>
                <Dialog.Title className="text-base font-semibold text-slate-900">
                  {isBn ? "কারখানায় কাঁচামাল বরাদ্দ (Bulk Factory Issue)" : "Bulk Allocate to Factory"}
                </Dialog.Title>
                <Dialog.Description className="text-xs text-slate-500">
                  {isBn
                    ? "একত্রে চিনি, তেল, দুধ ও অন্যান্য কাঁচামাল কারিগরকে মিষ্টি তৈরির জন্য বরাদ্দ করুন"
                    : "Allocate sugar, oil, milk, and other materials to factory at once"}
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

          <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
            {/* Karigor and Note Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-medium text-slate-700 block mb-1">
                  {isBn ? "দায়িত্বপ্রাপ্ত কারিগরের নাম" : "Karigor / Head Chef"}
                </label>
                <input
                  type="text"
                  placeholder={isBn ? "উদা: সুবল কারিগর / প্রধান শেফ" : "e.g. Master Chef Subol"}
                  value={karigorName}
                  onChange={(e) => setKarigorName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">
                  {isBn ? "ব্যাচ নোট বা বিবরণ" : "Batch Note / Purpose"}
                </label>
                <input
                  type="text"
                  placeholder={isBn ? "উদা: সকালের মিষ্টি ব্যাচের জন্য বরাদ্দ" : "e.g. Morning batch production"}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Raw Material Rows */}
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                <span className="font-bold text-slate-700">
                  {isBn ? "বরাদ্দকৃত কাঁচামালের তালিকা" : "Allocated Raw Materials"}
                </span>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isBn ? "+ আরও কাঁচামাল যোগ করুন" : "+ Add Item"}</span>
                </button>
              </div>

              <div className="space-y-2">
                {items.map((item, idx) => {
                  const selProd = eligibleProducts.find((p) => p.id === item.productId);
                  return (
                    <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2 rounded border border-slate-200">
                      <div className="flex-1">
                        <select
                          required
                          value={item.productId}
                          onChange={(e) => handleItemChange(idx, "productId", e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs font-medium focus:ring-1 focus:ring-blue-500"
                        >
                          {eligibleProducts.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} — (স্টক: {p.stockQty} {p.unit})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-32">
                        <input
                          required
                          type="number"
                          step="any"
                          min="0.1"
                          placeholder={`পরিমাণ (${selProd?.unit || "unit"})`}
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs font-bold tabular-nums text-right focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 border border-slate-200 rounded text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                {isBn ? "বাতিল" : "Cancel"}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold shadow-xs disabled:opacity-50"
              >
                {isSubmitting
                  ? isBn ? "বরাদ্দ হচ্ছে..." : "Allocating..."
                  : isBn ? "কারখানায় বরাদ্দ সম্পন্ন করুন" : "Confirm Allocation"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

/* -------------------------------------------------------------
 * 5. MULTI-SWEET PRODUCTION MODAL (কারখানা থেকে প্রস্তুতকৃত মিষ্টি স্টক ইন)
 * Receive multiple sweet items produced from allocated materials
 * ------------------------------------------------------------- */
interface MultiSweetProductionModalProps {
  products: ProductOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MultiSweetProductionModal: React.FC<MultiSweetProductionModalProps> = ({
  products,
  open,
  onOpenChange,
}) => {
  const { language } = useHydratedLanguage();
  const isBn = language === "bn";

  const retailSweets = useMemo(
    () =>
      products.filter(
        (p) =>
          p.isSellable ||
          p.productType === "RETAIL" ||
          p.sku.startsWith("SWT-") ||
          p.sku.startsWith("DOI-")
      ),
    [products]
  );
  const eligibleSweets = retailSweets.length > 0 ? retailSweets : products;

  const rawMaterials = useMemo(
    () => products.filter((p) => p.productType === "RAW_MATERIAL" || p.sku.startsWith("RAW-")),
    [products]
  );

  const [sourceMode, setSourceMode] = useState<"FROM_ALLOCATED" | "DIRECT_CONSUMPTION">("FROM_ALLOCATED");
  const [producedItems, setProducedItems] = useState<Array<{ sweetProductId: string; quantity: string; unitCost: string }>>([
    {
      sweetProductId: eligibleSweets[0]?.id || "",
      quantity: "",
      unitCost: eligibleSweets[0]?.avgCost ? String(eligibleSweets[0].avgCost) : "",
    },
  ]);

  // Ingredients when mode is DIRECT_CONSUMPTION
  const [consumedIngredients, setConsumedIngredients] = useState<Array<{ productId: string; quantity: string }>>([]);

  const [karigorName, setKarigorName] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setSourceMode("FROM_ALLOCATED");
      const defaultProd = eligibleSweets[0];
      setProducedItems([
        {
          sweetProductId: defaultProd?.id || "",
          quantity: "",
          unitCost: defaultProd?.avgCost ? String(defaultProd.avgCost) : "",
        },
      ]);
      setConsumedIngredients([]);
      setKarigorName("");
      setNote("");
      setError(null);
    }
  }, [open]);

  const handleModeChange = (mode: "FROM_ALLOCATED" | "DIRECT_CONSUMPTION") => {
    setSourceMode(mode);
    if (mode === "DIRECT_CONSUMPTION" && consumedIngredients.length === 0) {
      const defaultRaw = rawMaterials[0] || products[0];
      setConsumedIngredients([{ productId: defaultRaw?.id || "", quantity: "" }]);
    }
  };

  const handleAddIngredient = () => {
    const defaultRaw = rawMaterials[0] || products[0];
    setConsumedIngredients((prev) => [
      ...prev,
      { productId: defaultRaw?.id || "", quantity: "" },
    ]);
  };

  const handleRemoveIngredient = (index: number) => {
    setConsumedIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  const handleIngredientChange = (index: number, field: "productId" | "quantity", value: string) => {
    setConsumedIngredients((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleAddSweet = () => {
    const defaultProd = eligibleSweets[0];
    setProducedItems((prev) => [
      ...prev,
      {
        sweetProductId: defaultProd?.id || "",
        quantity: "",
        unitCost: defaultProd?.avgCost ? String(defaultProd.avgCost) : "",
      },
    ]);
  };

  const handleRemoveSweet = (index: number) => {
    setProducedItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSweetChange = (index: number, field: "sweetProductId" | "quantity" | "unitCost", value: string) => {
    setProducedItems((prev) => {
      const next = [...prev];
      if (field === "sweetProductId") {
        const prod = products.find((p) => p.id === value);
        next[index] = {
          ...next[index],
          sweetProductId: value,
          unitCost: prod?.avgCost ? String(prod.avgCost) : next[index].unitCost,
        };
      } else {
        next[index] = { ...next[index], [field]: value };
      }
      return next;
    });
  };

  // Live Automatic Cost Calculations
  const totalRawCost = useMemo(() => {
    return consumedIngredients.reduce((acc, ing) => {
      const p = products.find((prod) => prod.id === ing.productId);
      const qty = Number(ing.quantity) || 0;
      const cost = Number(p?.avgCost) || 0;
      return acc + qty * cost;
    }, 0);
  }, [consumedIngredients, products]);

  const totalProducedQty = useMemo(() => {
    return producedItems.reduce((acc, item) => acc + (Number(item.quantity) || 0), 0);
  }, [producedItems]);

  const calculatedCostPerUnit =
    totalProducedQty > 0 && totalRawCost > 0
      ? Math.round(totalRawCost / totalProducedQty)
      : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validProduced = producedItems
      .filter((p) => p.sweetProductId && Number(p.quantity) > 0)
      .map((p) => ({
        sweetProductId: p.sweetProductId,
        quantity: Number(p.quantity),
        unitCost: p.unitCost ? Number(p.unitCost) : calculatedCostPerUnit ? calculatedCostPerUnit : undefined,
      }));

    if (validProduced.length === 0) {
      setError(isBn ? "কমপক্ষে একটি মিষ্টি ও পরিমাণ প্রদান করুন" : "Please specify at least one finished sweet and quantity");
      return;
    }

    const validConsumed = consumedIngredients
      .filter((i) => i.productId && Number(i.quantity) > 0)
      .map((i) => ({ productId: i.productId, quantity: Number(i.quantity) }));

    if (sourceMode === "DIRECT_CONSUMPTION" && validConsumed.length === 0) {
      setError(isBn ? "সরাসরি উৎপাদনের জন্য ব্যবহৃত কাঁচামাল ও পরিমাণ দিন" : "Please specify consumed raw materials");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const res = await recordMultiSweetProductionAction({
        producedItems: validProduced,
        consumedIngredients: validConsumed.length > 0 ? validConsumed : undefined,
        sourceMode,
        karigorName: karigorName.trim() || undefined,
        note: note.trim() || undefined,
      });

      if (!res.success) {
        setError(res.error);
        return;
      }

      onOpenChange(false);
    } catch (err: any) {
      setError(err?.message || "Failed to record production batch");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 animate-in fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl bg-white rounded-lg p-6 shadow-2xl border border-slate-200 z-50 animate-in zoom-in-95 focus:outline-none max-h-[92vh] overflow-y-auto">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-100 text-emerald-700 rounded-md">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <Dialog.Title className="text-base font-semibold text-slate-900">
                  {isBn ? "প্রস্তুতকৃত মিষ্টি কাউন্টারে গ্রহণ (Production Receipt)" : "Receive Produced Sweets"}
                </Dialog.Title>
                <Dialog.Description className="text-xs text-slate-500">
                  {isBn
                    ? "কারখানায় তৈরিকৃত মিষ্টি কাউন্টারের বিক্রয়যোগ্য স্টকে যোগ করুন"
                    : "Add freshly produced sweets from kitchen directly into counter stock"}
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

          {/* Mode Switcher */}
          <div className="mt-4 p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-xs space-y-2">
            <span className="font-bold text-blue-900 block">
              {isBn ? "কাঁচামালের উৎস নির্ধারণ করুন:" : "Production Source Mode:"}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSourceMode("FROM_ALLOCATED")}
                className={`p-2.5 rounded text-left border transition-all ${
                  sourceMode === "FROM_ALLOCATED"
                    ? "bg-white border-blue-600 text-blue-950 shadow-xs font-semibold"
                    : "bg-transparent border-transparent text-slate-600 hover:bg-white/50"
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold">
                  <span className={`w-2 h-2 rounded-full ${sourceMode === "FROM_ALLOCATED" ? "bg-blue-600" : "bg-slate-300"}`} />
                  <span>{isBn ? "পূর্বে বরাদ্দকৃত কাঁচামাল থেকে" : "From Pre-Allocated Stock"}</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                  {isBn
                    ? "চিনি, তেল ও দুধ আগেই কারখানায় বরাদ্দ করা হয়েছে। পুনরায় কাঁচামাল কাটা হবে না।"
                    : "Raw materials were already issued to kitchen. No extra deduction."}
                </p>
              </button>

              <button
                type="button"
                onClick={() => setSourceMode("DIRECT_CONSUMPTION")}
                className={`p-2.5 rounded text-left border transition-all ${
                  sourceMode === "DIRECT_CONSUMPTION"
                    ? "bg-white border-blue-600 text-blue-950 shadow-xs font-semibold"
                    : "bg-transparent border-transparent text-slate-600 hover:bg-white/50"
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold">
                  <span className={`w-2 h-2 rounded-full ${sourceMode === "DIRECT_CONSUMPTION" ? "bg-blue-600" : "bg-slate-300"}`} />
                  <span>{isBn ? "সরাসরি কাঁচামাল সহ উৎপাদন" : "Direct All-in-One Run"}</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                  {isBn
                    ? "মিষ্টির সাথে সাথে ব্যবহৃত কাঁচামালও এখন স্টক থেকে কাটা হবে।"
                    : "Deduct consumed ingredients in this same step."}
                </p>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
            {/* Karigor and Note */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-medium text-slate-700 block mb-1">
                  {isBn ? "প্রস্তুতকারী কারিগরের নাম" : "Karigor / Maker Name"}
                </label>
                <input
                  type="text"
                  placeholder={isBn ? "উদা: সুবল কারিগর" : "e.g. Subol"}
                  value={karigorName}
                  onChange={(e) => setKarigorName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">
                  {isBn ? "উৎপাদন ব্যাচ নোট" : "Production Batch Note"}
                </label>
                <input
                  type="text"
                  placeholder={isBn ? "উদা: আজকের সকালের ফ্রেশ মিষ্টি" : "e.g. Fresh morning production"}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Consumed Raw Materials Section (Visible when DIRECT_CONSUMPTION is active) */}
            {sourceMode === "DIRECT_CONSUMPTION" && (
              <div className="space-y-2 p-3 bg-amber-50/70 border border-amber-200 rounded-lg">
                <div className="flex items-center justify-between pb-1 border-b border-amber-200/60">
                  <span className="font-bold text-amber-900 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-amber-700" />
                    <span>{isBn ? "ব্যবহৃত কাঁচামালের তালিকা (Raw Materials Consumed) *" : "Consumed Raw Materials *"}</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleAddIngredient}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 hover:text-amber-950"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isBn ? "+ কাঁচামাল যোগ করুন" : "+ Add Ingredient"}</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {consumedIngredients.map((ing, idx) => {
                    const selRaw = (rawMaterials.length > 0 ? rawMaterials : products).find((p) => p.id === ing.productId);
                    const rawCost = Number(selRaw?.avgCost) || 0;
                    const lineCost = (Number(ing.quantity) || 0) * rawCost;

                    return (
                      <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded border border-amber-200">
                        <div className="flex-1">
                          <select
                            required
                            value={ing.productId}
                            onChange={(e) => handleIngredientChange(idx, "productId", e.target.value)}
                            className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-medium focus:ring-1 focus:ring-amber-500"
                          >
                            {(rawMaterials.length > 0 ? rawMaterials : products).map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} — (স্টক: {p.stockQty} {p.unit} | খরচ: ৳{Math.round(p.avgCost)})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="w-28">
                          <input
                            required
                            type="number"
                            step="any"
                            min="0.01"
                            placeholder={`পরিমাণ (${selRaw?.unit || "unit"})`}
                            value={ing.quantity}
                            onChange={(e) => handleIngredientChange(idx, "quantity", e.target.value)}
                            className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-bold tabular-nums text-right focus:ring-1 focus:ring-amber-500"
                          />
                        </div>

                        <div className="w-24 text-right font-mono text-[11px] text-amber-800 font-semibold tabular-nums">
                          ৳ {Math.round(lineCost)}
                        </div>

                        {consumedIngredients.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveIngredient(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded"
                            title="Remove ingredient"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Auto Cost Calculation Summary */}
                <div className="flex items-center justify-between pt-1.5 border-t border-amber-200 text-xs text-amber-900 font-semibold">
                  <span>{isBn ? "মোট কাঁচামাল খরচ:" : "Total Raw Material Cost:"}</span>
                  <span className="tabular-nums font-bold text-sm">৳ {Math.round(totalRawCost)}</span>
                </div>
              </div>
            )}

            {/* Finished Sweets List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                <div>
                  <span className="font-bold text-slate-700">
                    {isBn ? "প্রস্তুতকৃত মিষ্টির তালিকা (Finished Sweets)" : "Produced Sweets"}
                  </span>
                  <p className="text-[11px] text-slate-500">
                    {sourceMode === "DIRECT_CONSUMPTION" && calculatedCostPerUnit
                      ? isBn
                        ? `প্রতি কেজির স্বয়ংক্রিয় উৎপাদন খরচ: ৳ ${calculatedCostPerUnit}`
                        : `Auto-calculated unit cost: $${calculatedCostPerUnit}`
                      : isBn
                      ? "উৎপাদন খরচ পূর্বে সংরক্ষিত গড় খরচে স্বয়ংক্রিয়ভাবে হিসাব হবে"
                      : "Unit cost is automatically derived from weighted average"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddSweet}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isBn ? "+ আরও মিষ্টি যোগ করুন" : "+ Add Sweet Item"}</span>
                </button>
              </div>

              <div className="space-y-2">
                {producedItems.map((item, idx) => {
                  const selSweet = eligibleSweets.find((p) => p.id === item.sweetProductId);
                  const effectiveUnitCost =
                    calculatedCostPerUnit ||
                    (selSweet?.avgCost ? Math.round(selSweet.avgCost) : 0);

                  return (
                    <div key={idx} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-slate-50 p-2.5 rounded border border-slate-200">
                      <div className="flex-1">
                        <select
                          required
                          value={item.sweetProductId}
                          onChange={(e) => handleSweetChange(idx, "sweetProductId", e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs font-semibold focus:ring-1 focus:ring-blue-500"
                        >
                          {eligibleSweets.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} — (বর্তমান মজুদ: {p.stockQty} {p.unit})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-full sm:w-36">
                        <input
                          required
                          type="number"
                          step="any"
                          min="0.1"
                          placeholder={`পরিমাণ (${selSweet?.unit || "কেজি"})`}
                          value={item.quantity}
                          onChange={(e) => handleSweetChange(idx, "quantity", e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs font-bold tabular-nums text-right focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      {/* Unit Cost: Auto-suggested from raw materials / historical average, but editable for labor/overhead overrides */}
                      <div className="w-full sm:w-32 relative">
                        <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-slate-400 text-xs">
                          ৳
                        </div>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          placeholder={String(effectiveUnitCost || 0)}
                          value={item.unitCost}
                          onChange={(e) => handleSweetChange(idx, "unitCost", e.target.value)}
                          className="w-full pl-6 pr-2 py-1.5 bg-white border border-slate-200 rounded text-xs font-bold tabular-nums text-right focus:ring-1 focus:ring-blue-500"
                          title={isBn ? "প্রতি কেজির উৎপাদন খরচ (স্বয়ংক্রিয় বা কাস্টম)" : "Unit production cost (auto-calculated or custom override)"}
                        />
                        <span className="text-[10px] text-slate-400 block text-right pr-1">
                          {item.unitCost ? (isBn ? "কাস্টম খরচ" : "custom") : (isBn ? "স্বয়ংক্রিয়" : "auto")}
                        </span>
                      </div>

                      {producedItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSweet(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition-colors self-end sm:self-center"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 border border-slate-200 rounded text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                {isBn ? "বাতিল" : "Cancel"}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow-xs disabled:opacity-50"
              >
                {isSubmitting
                  ? isBn ? "স্টক ইন হচ্ছে..." : "Processing..."
                  : isBn ? "কাউন্টারে স্টক ইন সম্পন্ন করুন" : "Add to Counter Stock"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
