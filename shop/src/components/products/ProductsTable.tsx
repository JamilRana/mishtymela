"use client";

import React, { useState } from "react";
import {
  Search,
  Plus,
  Package,
  Tags,
} from "lucide-react";
import { MoneyText } from "@/components/shared/MoneyText";
import { QuantityText } from "@/components/shared/QuantityText";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { toggleProductActive } from "@/actions/products";
import { ProductFormModal } from "./ProductFormModal";
import { CategoryManagerModal } from "./CategoryManagerModal";
import { Pagination } from "@/components/shared/Pagination";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ProductItem {
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
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

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

  return (
    <div className="space-y-4">
      {/* Top Filter & Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 border border-slate-200 rounded-md">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search products by name, SKU, or barcode..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={stockFilter}
            onChange={(e) => {
              setStockFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Stock Levels</option>
            <option value="in">In Stock</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded transition-colors"
          >
            <Tags className="w-3.5 h-3.5 text-slate-500" />
            Categories
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>
      </div>

      {/* Desktop Data Table */}
      <div className="hidden md:block bg-white border border-slate-200 rounded-md overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider font-semibold">
              <th className="py-3 px-4">Item & SKU</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4 text-right">Selling Price</th>
              <th className="py-3 px-4 text-right">Avg Cost</th>
              <th className="py-3 px-4 text-right">Stock Level</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedProducts.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <Package className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-1" />
                  No products found. Add your first inventory item!
                </td>
              </tr>
            ) : (
              paginatedProducts.map((product) => {
                const isOutOfStock = product.stockQty <= 0;
                const isLowStock = product.stockQty <= product.reorderLevel && !isOutOfStock;

                return (
                  <tr key={product.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-slate-900">{product.name}</span>
                        {product.productType === "RAW_MATERIAL" && (
                          <span className="bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.2 rounded text-[10px] font-medium">
                            কাঁচামাল
                          </span>
                        )}
                        {product.productType === "PACKAGING" && (
                          <span className="bg-purple-50 text-purple-800 border border-purple-200 px-1.5 py-0.2 rounded text-[10px] font-medium">
                            প্যাকেজিং বক্স
                          </span>
                        )}
                        {product.isSellable && (
                          <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.2 rounded text-[10px] font-medium">
                            POS
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 font-mono">
                        <span>{product.sku}</span>
                        {product.barcode && <span>• {product.barcode}</span>}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium">
                        {product.categoryName}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-900">
                      <MoneyText amount={product.sellingPrice} />
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500 font-medium">
                      <MoneyText amount={product.avgCost} />
                    </td>
                    <td className="py-3 px-4 text-right font-semibold">
                      <QuantityText quantity={product.stockQty} unit={product.unit} />
                    </td>
                    <td className="py-3 px-4 text-center">
                      {isOutOfStock ? (
                        <StatusBadge type="out_of_stock" />
                      ) : isLowStock ? (
                        <StatusBadge type="low_stock" />
                      ) : (
                        <StatusBadge type="in_stock" />
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/inventory?receive=${product.id}`}
                          className="px-2 py-1 text-[11px] font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
                          title="Receive Stock"
                        >
                          Stock In
                        </Link>
                        <button
                          onClick={async () => {
                            const res = await toggleProductActive(product.id, !product.active);
                            if (!res.success) alert(res.error);
                          }}
                          className={cn(
                            "px-2 py-1 text-[11px] font-medium rounded transition-colors",
                            product.active
                              ? "text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                              : "text-emerald-600 hover:bg-emerald-50"
                          )}
                        >
                          {product.active ? "Deactivate" : "Activate"}
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
          <Pagination
            currentPage={page}
            totalItems={filtered.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        )}
      </div>

      {/* Mobile Card List View */}
      <div className="md:hidden space-y-2">
        {paginatedProducts.map((product) => (
          <div key={product.id} className="p-3 bg-white border border-slate-200 rounded-md text-xs space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold text-slate-900">{product.name}</h4>
                <span className="text-[10px] text-slate-400 font-mono">{product.sku}</span>
              </div>
              {product.stockQty <= 0 ? (
                <StatusBadge type="out_of_stock" />
              ) : product.stockQty <= product.reorderLevel ? (
                <StatusBadge type="low_stock" />
              ) : (
                <StatusBadge type="in_stock" />
              )}
            </div>

            <div className="flex justify-between items-center text-slate-600 pt-1 border-t border-slate-100">
              <span>Price: <MoneyText amount={product.sellingPrice} className="font-bold text-slate-900" /></span>
              <span>Stock: <QuantityText quantity={product.stockQty} unit={product.unit} className="font-bold text-slate-900" /></span>
            </div>

            <div className="flex justify-end gap-2 pt-1 border-t border-slate-100">
              <Link
                href={`/inventory?receive=${product.id}`}
                className="text-blue-600 font-semibold"
              >
                Stock In
              </Link>
            </div>
          </div>
        ))}

        {/* Mobile Pagination */}
        {filtered.length > 0 && (
          <Pagination
            currentPage={page}
            totalItems={filtered.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            className="rounded-md border border-slate-200 mt-2"
          />
        )}
      </div>

      {/* Product Create Modal */}
      <ProductFormModal
        categories={categories}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />

      {/* Category Manager Modal */}
      <CategoryManagerModal
        categories={categories}
        open={isCategoryModalOpen}
        onOpenChange={setIsCategoryModalOpen}
      />
    </div>
  );
};
