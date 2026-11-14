"use client";

import React, { useState } from "react";
import {
  Search,
  Plus,
  Package,
  Tags,
  Edit2,
  Trash2,
  AlertTriangle,
  X,
  Filter,
  ArrowUpDown,
  Boxes,
  Barcode,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import { MoneyText } from "@/components/shared/MoneyText";
import { QuantityText } from "@/components/shared/QuantityText";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { toggleProductActive, deleteProduct } from "@/actions/products";
import { ProductFormModal } from "./ProductFormModal";
import { CategoryManagerModal } from "./CategoryManagerModal";
import { BarcodeStickerModal } from "./BarcodeStickerModal";
import { Pagination } from "@/components/shared/Pagination";
import { useHydratedLanguage } from "@/stores/language";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface ProductItem {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  imageUrl?: string | null;
  unit: string;
  sellingPrice: number;
  avgCost: number;
  stockQty: number;
  reorderLevel: number;
  active: boolean;
  productType?: "RETAIL" | "RAW_MATERIAL" | "PACKAGING";
  isSellable?: boolean;
  categoryName: string;
  categoryId: string | null;
}

interface Category {
  id: string;
  name: string;
}

interface ProductsTableProps {
  products: ProductItem[];
  categories: Category[];
}

export const ProductsTable: React.FC<ProductsTableProps> = ({
  products,
  categories,
}) => {
  const router = useRouter();
  const { language } = useHydratedLanguage();
  const isBn = language === "bn";

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // CRUD Edit & Delete states
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<ProductItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [barcodeProduct, setBarcodeProduct] = useState<ProductItem | null>(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product: ProductItem) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (product: ProductItem) => {
    setDeletingProduct(product);
    setDeleteError(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingProduct) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await deleteProduct(deletingProduct.id);
      if (!res.success) {
        setDeleteError(res.error);
        return;
      }
      setDeletingProduct(null);
      router.refresh();
    } catch (err: any) {
      setDeleteError(err?.message || "Failed to delete product");
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter products
  const filtered = products.filter((p) => {
    const query = search.trim().toLowerCase();
    const matchesSearch =
      query === "" ||
      p.name.toLowerCase().includes(query) ||
      p.sku.toLowerCase().includes(query) ||
      (p.barcode && p.barcode.toLowerCase().includes(query));

    const matchesCategory =
      categoryFilter === "all" || p.categoryId === categoryFilter;

    let matchesStock = true;
    if (stockFilter === "low") matchesStock = p.stockQty <= p.reorderLevel && p.stockQty > 0;
    else if (stockFilter === "out") matchesStock = p.stockQty <= 0;
    else if (stockFilter === "in") matchesStock = p.stockQty > p.reorderLevel;

    return matchesSearch && matchesCategory && matchesStock;
  });

  const paginatedProducts = filtered.slice((page - 1) * pageSize, page * pageSize);

  const getStockBadge = (product: ProductItem) => {
    if (product.stockQty <= 0) {
      return (
        <StatusBadge
          type="out_of_stock"
          label={isBn ? "স্টক শেষ" : "Out of Stock"}
        />
      );
    }
    if (product.stockQty <= product.reorderLevel) {
      return (
        <StatusBadge
          type="low_stock"
          label={isBn ? "স্বল্প স্টক" : "Low Stock"}
        />
      );
    }
    return (
      <StatusBadge
        type="in_stock"
        label={isBn ? "স্টকে আছে" : "In Stock"}
      />
    );
  };

  return (
    <div className="space-y-4">
      {/* Top Filter & Action Bar - Hallmark Integrated Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3 border border-slate-200 rounded-xl shadow-2xs">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder={isBn ? "নাম, SKU বা বারকোড দিয়ে খুঁজুন..." : "Search products by name, SKU, or barcode..."}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50/80 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-all placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Category Select */}
            <select
              value={categoryFilter}
              aria-label={isBn ? "ক্যাটেগরি ফিল্টার" : "Category filter"}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="text-xs px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-lg text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-all cursor-pointer"
            >
              <option value="all">{isBn ? "সকল ক্যাটেগরি" : "All Categories"}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Stock Level Select */}
            <select
              value={stockFilter}
              aria-label={isBn ? "স্টক লেভেল ফিল্টার" : "Stock level filter"}
              onChange={(e) => {
                setStockFilter(e.target.value);
                setPage(1);
              }}
              className="text-xs px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-lg text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-all cursor-pointer"
            >
              <option value="all">{isBn ? "সকল স্টক" : "All Stock"}</option>
              <option value="in">{isBn ? "স্টকে আছে" : "In Stock"}</option>
              <option value="low">{isBn ? "স্বল্প স্টক" : "Low Stock"}</option>
              <option value="out">{isBn ? "স্টক শেষ" : "Out of Stock"}</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsCategoryModalOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold rounded-lg transition-colors shadow-2xs"
          >
            <Tags className="w-3.5 h-3.5 text-slate-500" />
            <span>{isBn ? "ক্যাটেগরি" : "Categories"}</span>
          </button>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{isBn ? "নতুন পণ্য" : "Add Product"}</span>
          </button>
        </div>
      </div>

      {/* Desktop Data Matrix - Hallmark Clean Typography & Tabular Layout */}
      <div className="hidden md:block bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-xs">
        <table className="w-full min-w-[760px] text-left text-xs">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase text-[11px] tracking-wider font-bold">
              <th className="py-3 px-4">{isBn ? "পণ্য ও SKU" : "Item & SKU"}</th>
              <th className="py-3 px-4">{isBn ? "ক্যাটেগরি" : "Category"}</th>
              <th className="py-3 px-4 text-right">{isBn ? "বিক্রয় মূল্য" : "Selling Price"}</th>
              <th className="py-3 px-4 text-right">{isBn ? "গড় খরচ" : "Avg Cost"}</th>
              <th className="py-3 px-4 text-right">{isBn ? "বর্তমান স্টক" : "Stock Level"}</th>
              <th className="py-3 px-4 text-center">{isBn ? "অবস্থা" : "Status"}</th>
              <th className="py-3 px-4 text-right">{isBn ? "অ্যাকশন" : "Actions"}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedProducts.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center text-slate-400">
                  <Package className="w-9 h-9 mx-auto mb-2 text-slate-300 stroke-1" />
                  <p className="font-medium text-slate-500">
                    {isBn ? "কোনো পণ্য খুঁজে পাওয়া যায়নি।" : "No products found matching filters."}
                  </p>
                </td>
              </tr>
            ) : (
              paginatedProducts.map((product) => {
                return (
                  <tr key={product.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-900">{product.name}</span>
                        {product.productType === "RAW_MATERIAL" && (
                          <span className="bg-amber-50 text-amber-800 border border-amber-200/80 px-1.5 py-0.5 rounded text-[10px] font-bold">
                            কাঁচামাল
                          </span>
                        )}
                        {product.productType === "PACKAGING" && (
                          <span className="bg-purple-50 text-purple-800 border border-purple-200/80 px-1.5 py-0.5 rounded text-[10px] font-bold">
                            বক্স
                          </span>
                        )}
                        {product.isSellable && (
                          <span className="bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-1.5 py-0.5 rounded text-[10px] font-bold">
                            POS
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 font-mono">
                        <span>SKU: {product.sku}</span>
                        {product.barcode && <span>• Barcode: {product.barcode}</span>}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-[11px] font-semibold">
                        {product.categoryName}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-black text-slate-900 tabular-nums">
                      <MoneyText amount={product.sellingPrice} />
                    </td>

                    <td className="py-3.5 px-4 text-right text-slate-500 font-semibold tabular-nums">
                      <MoneyText amount={product.avgCost} />
                    </td>

                    <td className="py-3.5 px-4 text-right font-black text-slate-900 tabular-nums">
                      <QuantityText quantity={product.stockQty} unit={product.unit} />
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {getStockBadge(product)}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/inventory?receive=${product.id}`}
                          className="px-2 py-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                          title={isBn ? "মালামাল রিসিভ" : "Receive Stock"}
                        >
                          {isBn ? "স্টক ইন" : "Stock In"}
                        </Link>
                        <button
                          type="button"
                          onClick={() => setBarcodeProduct(product)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                          title={isBn ? "বারকোড স্টিকার প্রিন্ট" : "Print Barcode Sticker"}
                        >
                          <Barcode className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(product)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title={isBn ? "সম্পাদনা" : "Edit"}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(product)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          title={isBn ? "মুছুন" : "Delete"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            const res = await toggleProductActive(product.id, !product.active);
                            if (!res.success) alert(res.error);
                            else router.refresh();
                          }}
                          className={cn(
                            "px-2 py-1 text-[11px] font-bold rounded-md transition-colors",
                            product.active
                              ? "text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                              : "text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                          )}
                        >
                          {product.active
                            ? (isBn ? "নিষ্ক্রিয়" : "Deactivate")
                            : (isBn ? "সক্রিয়" : "Activate")}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Desktop Pagination */}
        {filtered.length > 0 && (
          <div className="border-t border-slate-100 bg-slate-50/50 p-3">
            <Pagination
              currentPage={page}
              totalItems={filtered.length}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        )}
      </div>

      {/* Mobile Unified High-Density Ledger Stack - Hallmark Elimination of Card-in-Card AI Slop */}
      <div className="md:hidden bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs divide-y divide-slate-100">
        {paginatedProducts.length === 0 ? (
          <div className="py-12 px-4 text-center text-slate-400">
            <Package className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-1" />
            <p className="font-medium text-slate-500 text-xs">
              {isBn ? "কোনো পণ্য খুঁজে পাওয়া যায়নি।" : "No products found."}
            </p>
          </div>
        ) : (
          paginatedProducts.map((product) => (
            <div key={product.id} className="p-3.5 space-y-2.5 hover:bg-slate-50/50 transition-colors">
              {/* Product Title, SKU, and Badge */}
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <h4 className="font-black text-slate-900 text-sm truncate">{product.name}</h4>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                    <span className="font-mono font-semibold">{product.sku}</span>
                    <span>•</span>
                    <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-semibold text-slate-700">
                      {product.categoryName}
                    </span>
                  </div>
                </div>
                <div className="shrink-0">
                  {getStockBadge(product)}
                </div>
              </div>

              {/* Price & Stock Display */}
              <div className="flex justify-between items-center text-xs py-1.5 px-2.5 bg-slate-50 rounded-lg">
                <div>
                  <span className="text-slate-500 mr-1">{isBn ? "বিক্রয় মূল্য:" : "Price:"}</span>
                  <MoneyText amount={product.sellingPrice} className="font-black text-slate-900 text-sm" />
                </div>
                <div>
                  <span className="text-slate-500 mr-1">{isBn ? "স্টক:" : "Stock:"}</span>
                  <QuantityText quantity={product.stockQty} unit={product.unit} className="font-black text-slate-900 text-sm" />
                </div>
              </div>

              {/* Mobile Action Controls */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(product)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md transition-colors"
                  >
                    <Edit2 className="w-3 h-3 text-slate-500" />
                    <span>{isBn ? "এডিট" : "Edit"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteClick(product)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md transition-colors"
                  >
                    <Trash2 className="w-3 h-3 text-rose-600" />
                    <span>{isBn ? "মুছুন" : "Delete"}</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <Link
                    href={`/inventory?receive=${product.id}`}
                    className="px-2.5 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                  >
                    {isBn ? "স্টক ইন" : "Stock In"}
                  </Link>
                  <button
                    type="button"
                    onClick={async () => {
                      const res = await toggleProductActive(product.id, !product.active);
                      if (!res.success) alert(res.error);
                      else router.refresh();
                    }}
                    className={cn(
                      "px-2.5 py-1.5 text-xs font-bold rounded-md transition-colors",
                      product.active ? "text-slate-500 hover:bg-slate-100" : "text-emerald-700 bg-emerald-50"
                    )}
                  >
                    {product.active
                      ? (isBn ? "নিষ্ক্রিয়" : "Deactivate")
                      : (isBn ? "সক্রিয়" : "Activate")}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Mobile Pagination */}
        {filtered.length > 0 && (
          <div className="p-3 bg-slate-50/50">
            <Pagination
              currentPage={page}
              totalItems={filtered.length}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        )}
      </div>

      {/* Product Create / Edit Modal */}
      <ProductFormModal
        categories={categories}
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) setEditingProduct(null);
        }}
        product={editingProduct}
        onSuccess={() => router.refresh()}
      />

      {/* Category Manager Modal */}
      <CategoryManagerModal
        categories={categories}
        open={isCategoryModalOpen}
        onOpenChange={setIsCategoryModalOpen}
      />

      {/* Delete Confirmation Modal */}
      <Dialog.Root open={Boolean(deletingProduct)} onOpenChange={(open) => { if (!open) setDeletingProduct(null); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 animate-in fade-in" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-xl p-5 shadow-2xl border border-slate-200 z-50 animate-in zoom-in-95 focus:outline-none">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-rose-50 text-rose-600 rounded-full shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <Dialog.Title className="text-base font-bold text-slate-900">
                  {isBn ? "পণ্য মুছে ফেলুন" : "Delete Product"}
                </Dialog.Title>
                <Dialog.Description className="text-xs text-slate-500 mt-1">
                  {isBn ? (
                    <>আপনি কি নিশ্চিতভাবে <strong className="text-slate-800">{deletingProduct?.name}</strong> মুছে ফেলতে চান?</>
                  ) : (
                    <>Are you sure you want to delete <strong className="text-slate-800">{deletingProduct?.name}</strong>?</>
                  )}
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <button className="text-slate-400 hover:text-slate-600 p-1 rounded-md">
                  <X className="w-4 h-4" />
                </button>
              </Dialog.Close>
            </div>

            {deleteError && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                {deleteError}
              </div>
            )}

            <div className="my-3 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1 text-slate-600">
              <p>• SKU: <span className="font-mono font-semibold text-slate-800">{deletingProduct?.sku}</span></p>
              <p>• {isBn ? "বর্তমান স্টক:" : "Current Stock:"} <span className="font-semibold text-slate-800">{deletingProduct?.stockQty} {deletingProduct?.unit}</span></p>
              <p>• {isBn ? "বিক্রয় মূল্য:" : "Selling Price:"} <span className="font-semibold text-slate-800">৳{deletingProduct?.sellingPrice}</span></p>
              <p className="text-slate-400 text-[11px] pt-1.5 border-t border-slate-200/80">
                {isBn
                  ? "বিজ্ঞপ্তি: ইতিপূর্বে বিক্রয় হওয়া পণ্যের অডিট সুরক্ষার জন্য সরাসরি মোছা সম্ভব নয়। প্রয়োজনে পণ্যটি নিষ্ক্রিয় করুন।"
                  : "Notice: Products with recorded sales history cannot be deleted to preserve financial audit trail. Use \"Deactivate\" instead."}
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingProduct(null)}
                className="px-3.5 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                {isBn ? "বাতিল" : "Cancel"}
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs disabled:opacity-50"
              >
                {isDeleting
                  ? (isBn ? "মুছে ফেলা হচ্ছে..." : "Deleting...")
                  : (isBn ? "মুছে ফেলুন" : "Confirm Delete")}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Barcode Sticker Generator Modal */}
      <BarcodeStickerModal
        isOpen={!!barcodeProduct}
        onClose={() => setBarcodeProduct(null)}
        product={barcodeProduct}
      />
    </div>
  );
};