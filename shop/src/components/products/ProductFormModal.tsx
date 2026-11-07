"use client";

import React, { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Plus, AlertCircle } from "lucide-react";
import { createProduct, updateProduct, createCategory } from "@/actions/products";
import { useHydratedLanguage } from "@/stores/language";
import type { ProductItem } from "./ProductsTable";

interface Category {
  id: string;
  name: string;
}

interface ProductFormModalProps {
  categories: Category[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: ProductItem | null;
  onSuccess?: () => void;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  categories,
  open,
  onOpenChange,
  product = null,
  onSuccess,
}) => {
  const { language } = useHydratedLanguage();
  const isBn = language === "bn";

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    barcode: "",
    imageUrl: "",
    categoryId: "",
    unit: "pcs",
    productType: "RETAIL" as "RETAIL" | "RAW_MATERIAL" | "PACKAGING",
    isSellable: true,
    sellingPrice: "",
    reorderLevel: "5",
    openingStock: "0",
    openingCost: "0",
  });

  const [localCategories, setLocalCategories] = useState<Category[]>(categories);
  const [showQuickCategory, setShowQuickCategory] = useState(false);
  const [quickCategoryName, setQuickCategoryName] = useState("");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        sku: product.sku,
        barcode: product.barcode || "",
        imageUrl: product.imageUrl || "",
        categoryId: product.categoryId || "",
        unit: product.unit || "pcs",
        productType: product.productType || "RETAIL",
        isSellable: product.isSellable ?? true,
        sellingPrice: product.sellingPrice ? product.sellingPrice.toString() : "0",
        reorderLevel: product.reorderLevel ? product.reorderLevel.toString() : "5",
        openingStock: "0",
        openingCost: "0",
      });
    } else {
      setFormData({
        name: "",
        sku: "",
        barcode: "",
        imageUrl: "",
        categoryId: "",
        unit: "pcs",
        productType: "RETAIL",
        isSellable: true,
        sellingPrice: "",
        reorderLevel: "5",
        openingStock: "0",
        openingCost: "0",
      });
    }
    setError(null);
  }, [product, open]);

  const handleQuickCategoryCreate = async () => {
    const name = quickCategoryName.trim();
    if (!name) return;
    setIsCreatingCategory(true);
    setError(null);
    try {
      const created = await createCategory(name);
      if (!created.success) {
        setError(created.error);
        return;
      }
      setLocalCategories((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setFormData((prev) => ({ ...prev, categoryId: created.id }));
      setQuickCategoryName("");
      setShowQuickCategory(false);
    } catch (err: any) {
      setError(err?.message || "Failed to create category");
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (product) {
        const res = await updateProduct(product.id, {
          name: formData.name,
          sku: formData.sku,
          barcode: formData.barcode || undefined,
          imageUrl: formData.imageUrl || undefined,
          categoryId: formData.categoryId || undefined,
          unit: formData.unit,
          productType: formData.productType,
          isSellable: formData.isSellable,
          sellingPrice: Number(formData.sellingPrice || 0),
          reorderLevel: Number(formData.reorderLevel),
        });

        if (!res.success) {
          setError(res.error);
          return;
        }
      } else {
        const res = await createProduct({
          name: formData.name,
          sku: formData.sku,
          barcode: formData.barcode || undefined,
          imageUrl: formData.imageUrl || undefined,
          categoryId: formData.categoryId || undefined,
          unit: formData.unit,
          productType: formData.productType,
          isSellable: formData.isSellable,
          sellingPrice: Number(formData.sellingPrice || 0),
          reorderLevel: Number(formData.reorderLevel),
          openingStock: Number(formData.openingStock),
          openingCost: Number(formData.openingCost),
        });

        if (!res.success) {
          setError(res.error);
          return;
        }
      }

      onSuccess?.();
      onOpenChange(false);
      if (!product) {
        setFormData({
          name: "",
          sku: "",
          barcode: "",
          imageUrl: "",
          categoryId: "",
          unit: "pcs",
          productType: "RETAIL",
          isSellable: true,
          sellingPrice: "",
          reorderLevel: "5",
          openingStock: "0",
          openingCost: "0",
        });
      }
    } catch (err: any) {
      setError(err?.message || (product ? "Failed to update product" : "Failed to create product"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 animate-in fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-lg p-6 shadow-2xl border border-slate-200 z-50 animate-in zoom-in-95 focus:outline-none max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <Dialog.Title className="text-base font-semibold text-slate-900">
                {product
                  ? (isBn ? "পণ্য সম্পাদনা" : "Edit Product")
                  : (isBn ? "নতুন পণ্য যোগ" : "Add New Product")}
              </Dialog.Title>
              <Dialog.Description className="text-xs text-slate-500 mt-0.5">
                {product
                  ? (isBn ? `SKU: ${product.sku} • তথ্য ও মূল্য পরিবর্তন করুন` : `SKU: ${product.sku} • Update details & pricing`)
                  : (isBn ? "নতুন মিষ্টি বা ইনভেন্টরি আইটেম তৈরি করুন" : "Create a sellable inventory item")}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className="text-slate-400 hover:text-slate-600 p-1 rounded">
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="font-medium text-slate-700 block mb-1">
                  Product Name *
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. ছানার রসগোল্লা (Chhana Rasgulla 1kg)"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">
                  SKU (Item Code) *
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. SWT-RAS-01"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">
                  Barcode (EAN/UPC)
                </label>
                <input
                  type="text"
                  placeholder="Optional or scan barcode"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-medium text-slate-700 block mb-1">
                  Product Image URL / মিষ্টির ছবি (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. /images/sweets/rasmalai.jpg or image link"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-xs"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-medium text-slate-700">Category</label>
                  <button
                    type="button"
                    onClick={() => setShowQuickCategory(!showQuickCategory)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{showQuickCategory ? "Select Existing" : "Add New"}</span>
                  </button>
                </div>

                {showQuickCategory ? (
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Enter new category name..."
                      value={quickCategoryName}
                      onChange={(e) => setQuickCategoryName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleQuickCategoryCreate();
                        }
                      }}
                      className="flex-1 px-3 py-1.5 bg-slate-50 border border-blue-400 rounded focus:bg-white focus:outline-none text-xs"
                    />
                    <button
                      type="button"
                      disabled={isCreatingCategory || !quickCategoryName.trim()}
                      onClick={handleQuickCategoryCreate}
                      className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold disabled:opacity-50"
                    >
                      {isCreatingCategory ? "Adding..." : "Add"}
                    </button>
                  </div>
                ) : (
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Uncategorized</option>
                    {localCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">
                  Item Type / ধরন *
                </label>
                <select
                  value={formData.productType}
                  onChange={(e) => {
                    const type = e.target.value as "RETAIL" | "RAW_MATERIAL" | "PACKAGING";
                    const isSellable = type === "RETAIL";
                    setFormData({
                      ...formData,
                      productType: type,
                      isSellable,
                      sellingPrice: isSellable ? formData.sellingPrice : "0",
                    });
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                >
                  <option value="RETAIL">Retail Item / বিক্রয়যোগ্য মিষ্টি ও পণ্য (Sellable at POS)</option>
                  <option value="PACKAGING">Packaging Box / মিষ্টির প্যাকেট ও বক্স (Not for standalone sale)</option>
                  <option value="RAW_MATERIAL">Raw Material / কাঁচামাল - দুধ, চিনি, ঘি ইত্যাদি (Not for sale)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="isSellable"
                  checked={formData.isSellable}
                  onChange={(e) => setFormData({ ...formData, isSellable: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <label htmlFor="isSellable" className="font-medium text-slate-700 text-xs cursor-pointer select-none">
                  Available at POS (পিওএস কাউন্টারে সরাসরি বিক্রয়যোগ্য)
                </label>
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">Unit of Measure</label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="pcs">pcs (Piece)</option>
                  <option value="kg">kg (Kilogram)</option>
                  <option value="litre">litre (Litre)</option>
                  <option value="pack">pack (Pack)</option>
                  <option value="box">box (Box)</option>
                </select>
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">
                  Selling Price (৳) *
                </label>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.sellingPrice}
                  onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 tabular-nums font-semibold"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">
                  Reorder Level (Alert threshold)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="5"
                  value={formData.reorderLevel}
                  onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 tabular-nums"
                />
              </div>
            </div>

            {/* In Edit mode, show current stock info; in Create mode, allow opening stock */}
            {product ? (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-md flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">Current Stock / বর্তমান মজুদ:</span>
                <span className="font-bold text-slate-900 font-mono">
                  {product.stockQty} {product.unit} (Avg Cost: ৳{product.avgCost.toFixed(2)})
                </span>
              </div>
            ) : (
              <div className="pt-3 border-t border-slate-100">
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-2">
                  Opening Stock Balance (Optional)
                </span>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-medium text-slate-700 block mb-1">Opening Quantity</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={formData.openingStock}
                      onChange={(e) => setFormData({ ...formData, openingStock: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="font-medium text-slate-700 block mb-1">
                      Cost per Unit (৳)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.openingCost}
                      onChange={(e) => setFormData({ ...formData, openingCost: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 tabular-nums"
                    />
                  </div>
                </div>
              </div>
            )}

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
                  ? (isBn ? "সংরক্ষণ হচ্ছে..." : "Saving...")
                  : product
                  ? (isBn ? "আপডেট করুন" : "Update Product")
                  : (isBn ? "সংরক্ষণ করুন" : "Save Product")}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
