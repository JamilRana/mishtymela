"use client";

import React, { useState } from "react";
import {
  ArrowDownRight,
  RefreshCw,
  Search,
  Boxes,
  History,
  AlertTriangle,
  ArrowUpRight,
  TrendingDown,
  TrendingUp,
  ChefHat,
  Sparkles,
  Trash2,
} from "lucide-react";
import { MoneyText } from "@/components/shared/MoneyText";
import { QuantityText } from "@/components/shared/QuantityText";
import { DateTimeText } from "@/components/shared/DateTimeText";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  ReceiveStockModal,
  AdjustStockModal,
  IssueKitchenModal,
  SweetProductionModal,
  ReportWastageModal,
  BulkIssueFactoryModal,
  MultiSweetProductionModal,
} from "./InventoryModals";
import { Pagination } from "@/components/shared/Pagination";
import { useHydratedLanguage } from "@/stores/language";
import { cn } from "@/lib/utils";

interface InventoryProduct {
  id: string;
  name: string;
  sku: string;
  unit: string;
  sellingPrice: number;
  avgCost: number;
  stockQty: number;
  reorderLevel: number;
  categoryName: string;
  productType?: "RETAIL" | "RAW_MATERIAL" | "PACKAGING";
  isSellable?: boolean;
}

interface StockMovementItem {
  id: string;
  productName: string;
  sku: string;
  type: string;
  quantityDelta: number;
  unitCost: number;
  balanceAfter: number;
  note: string | null;
  createdAt: string;
}

interface InventoryAccount {
  id: string;
  name: string;
}

interface InventoryManagerProps {
  products: InventoryProduct[];
  movements: StockMovementItem[];
  accounts: InventoryAccount[];
  initialReceiveId?: string;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({
  products,
  movements,
  accounts,
  initialReceiveId,
}) => {
  const { language } = useHydratedLanguage();
  const [activeTab, setActiveTab] = useState<"levels" | "ledger">("levels");
  const [search, setSearch] = useState("");
  const [isReceiveOpen, setIsReceiveOpen] = useState(Boolean(initialReceiveId));
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [isIssueKitchenOpen, setIsIssueKitchenOpen] = useState(false);
  const [isSweetProductionOpen, setIsSweetProductionOpen] = useState(false);
  const [isReportWastageOpen, setIsReportWastageOpen] = useState(false);
  const [isBulkIssueOpen, setIsBulkIssueOpen] = useState(false);
  const [isMultiProductionOpen, setIsMultiProductionOpen] = useState(false);
  const [preselectedId, setPreselectedId] = useState<string | undefined>(initialReceiveId);

  // Pagination states
  const [levelsPage, setLevelsPage] = useState(1);
  const [levelsPageSize, setLevelsPageSize] = useState(25);
  const [ledgerPage, setLedgerPage] = useState(1);
  const [ledgerPageSize, setLedgerPageSize] = useState(25);

  // Filter products in Stock Levels tab
  const filteredProducts = products.filter((p) => {
    const q = search.trim().toLowerCase();
    return q === "" || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
  });

  // Filter movements in Movements Ledger tab
  const filteredMovements = movements.filter((m) => {
    const q = search.trim().toLowerCase();
    return q === "" || m.productName.toLowerCase().includes(q) || m.sku.toLowerCase().includes(q);
  });

  const paginatedProducts = filteredProducts.slice((levelsPage - 1) * levelsPageSize, levelsPage * levelsPageSize);
  const paginatedMovements = filteredMovements.slice((ledgerPage - 1) * ledgerPageSize, ledgerPage * ledgerPageSize);

  const totalStockValuation = products.reduce((acc, p) => acc + p.stockQty * p.avgCost, 0);
  const lowStockCount = products.filter((p) => p.stockQty <= p.reorderLevel).length;

  return (
    <div className="space-y-6">
      {/* Top Action & Overview Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 border border-slate-200 rounded-md">
        <div className="flex items-center gap-6">
          <div>
            <span className="text-xs text-slate-500 uppercase font-semibold">
              {language === "bn" ? "মোট স্টক মূল্য" : "Total Inventory Value"}
            </span>
            <div className="text-xl font-bold text-slate-900 mt-0.5">
              <MoneyText amount={totalStockValuation} />
            </div>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div>
            <span className="text-xs text-slate-500 uppercase font-semibold">
              {language === "bn" ? "স্বল্প স্টক আইটেম" : "Low Stock SKUs"}
            </span>
            <div className="text-xl font-bold text-amber-600 mt-0.5">
              {lowStockCount} <span className="text-xs font-normal text-slate-500">{language === "bn" ? "আইটেমে রি-অর্ডার প্রয়োজন" : "items need reorder"}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* 1. Receive Produced Sweets from Factory (Bulk / Batch) */}
          <button
            onClick={() => setIsMultiProductionOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded shadow-xs transition-colors"
            title={language === "bn" ? "কারখানায় তৈরিকৃত মিষ্টি কাউন্টারে যোগ করুন" : "Receive produced sweets from kitchen into counter stock"}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{language === "bn" ? "+ মিষ্টি উৎপাদন গ্রহণ" : "+ Receive Sweets"}</span>
          </button>

          {/* 2. Bulk Issue Raw Materials to Factory */}
          <button
            onClick={() => setIsBulkIssueOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded shadow-xs transition-colors"
            title={language === "bn" ? "একত্রে চিনি, তেল, দুধ ইত্যাদি কারখানায় বরাদ্দ" : "Bulk allocate raw materials to kitchen"}
          >
            <ChefHat className="w-3.5 h-3.5" />
            <span>{language === "bn" ? "কারখানায় বরাদ্দ" : "Allocate to Factory"}</span>
          </button>

          {/* 3. Receive Stock */}
          <button
            onClick={() => {
              setPreselectedId(undefined);
              setIsReceiveOpen(true);
            }}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded shadow-xs transition-colors"
          >
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span>{language === "bn" ? "মালামাল রিসিভ" : "Receive Stock"}</span>
          </button>

          {/* 4. Spoilage / Wastage */}
          <button
            onClick={() => setIsReportWastageOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 px-2.5 py-2 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold rounded transition-colors"
            title={language === "bn" ? "নষ্ট বা ক্ষতিগ্রস্থ পণ্যের হিসাব লিখুন" : "Record damaged or spoiled items"}
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
            <span>{language === "bn" ? "অপচয় / নষ্ট" : "Wastage"}</span>
          </button>

          {/* 5. Adjust Stock */}
          <button
            onClick={() => setIsAdjustOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 px-2.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            <span>{language === "bn" ? "সমন্বয়" : "Adjust"}</span>
          </button>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center border-b border-slate-200 gap-6">
          <button
            onClick={() => setActiveTab("levels")}
            className={cn(
              "pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors",
              activeTab === "levels"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            )}
          >
            <Boxes className="w-4 h-4" />
            <span>{language === "bn" ? "স্টক তালিকা ও মূল্য" : "Stock Levels & Valuation"}</span>
          </button>
          <button
            onClick={() => setActiveTab("ledger")}
            className={cn(
              "pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors",
              activeTab === "ledger"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            )}
          >
            <History className="w-4 h-4" />
            <span>{language === "bn" ? `মুভমেন্ট খতিয়ান (${movements.length})` : `Movements Ledger (${movements.length})`}</span>
          </button>
        </div>

        <div className="relative max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={language === "bn" ? "পণ্য বা SKU দিয়ে খুঁজুন..." : "Filter by product or SKU..."}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setLevelsPage(1);
              setLedgerPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* TAB 1: Stock Levels */}
      {activeTab === "levels" && (
        <div className="bg-white border border-slate-200 rounded-md overflow-x-auto shadow-xs">
          <table className="w-full min-w-[700px] text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-xs tracking-wider font-semibold">
                <th className="py-3 px-4">{language === "bn" ? "পণ্য ও SKU" : "Item & SKU"}</th>
                <th className="py-3 px-4 text-right">{language === "bn" ? "মজুদ পরিমাণ" : "Stock Qty"}</th>
                <th className="py-3 px-4 text-right">{language === "bn" ? "একক গড় খরচ" : "Avg Unit Cost"}</th>
                <th className="py-3 px-4 text-right">{language === "bn" ? "মোট মজুদ মূল্য" : "Inventory Value"}</th>
                <th className="py-3 px-4 text-center">{language === "bn" ? "অবস্থা" : "Health"}</th>
                <th className="py-3 px-4 text-right">{language === "bn" ? "অ্যাকশন" : "Action"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedProducts.map((p) => {
                const stockVal = p.stockQty * p.avgCost;
                const isOutOfStock = p.stockQty <= 0;
                const isLow = p.stockQty <= p.reorderLevel && !isOutOfStock;

                return (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-slate-900">{p.name}</span>
                        {p.productType === "RAW_MATERIAL" && (
                          <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded text-xs font-semibold">
                            {language === "bn" ? "কাঁচামাল" : "Raw Material"}
                          </span>
                        )}
                        {p.productType === "PACKAGING" && (
                          <span className="bg-purple-50 text-purple-800 border border-purple-200 px-2 py-0.5 rounded text-xs font-semibold">
                            {language === "bn" ? "প্যাকেজিং" : "Packaging"}
                          </span>
                        )}
                        {p.isSellable && (
                          <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-xs font-semibold">
                            POS
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">{p.sku}</div>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      <QuantityText quantity={p.stockQty} unit={p.unit} />
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-600">
                      <MoneyText amount={p.avgCost} />
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      <MoneyText amount={stockVal} />
                    </td>
                    <td className="py-3 px-4 text-center">
                      {isOutOfStock ? (
                        <StatusBadge type="out_of_stock" />
                      ) : isLow ? (
                        <StatusBadge type="low_stock" />
                      ) : (
                        <StatusBadge type="in_stock" />
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {p.productType === "RAW_MATERIAL" && (
                          <button
                            onClick={() => {
                              setPreselectedId(p.id);
                              setIsIssueKitchenOpen(true);
                            }}
                            className="px-2 py-1 text-xs font-semibold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 rounded transition-colors"
                            title="Issue to Kitchen"
                          >
                            {language === "bn" ? "কিচেন ইস্যু" : "Issue"}
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setPreselectedId(p.id);
                            setIsReceiveOpen(true);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                        >
                          Stock In
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredProducts.length > 0 && (
            <Pagination
              currentPage={levelsPage}
              totalItems={filteredProducts.length}
              pageSize={levelsPageSize}
              onPageChange={setLevelsPage}
              onPageSizeChange={setLevelsPageSize}
            />
          )}
        </div>
      )}

      {/* TAB 2: Movements Ledger */}
      {activeTab === "ledger" && (
        <div className="bg-white border border-slate-200 rounded-md overflow-x-auto shadow-xs">
          <table className="w-full min-w-[780px] text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-xs tracking-wider font-semibold">
                <th className="py-3 px-4">{language === "bn" ? "তারিখ ও সময়" : "Date & Time"}</th>
                <th className="py-3 px-4">{language === "bn" ? "পণ্য ও SKU" : "Item & SKU"}</th>
                <th className="py-3 px-4">{language === "bn" ? "মুভমেন্টের ধরন" : "Movement Type"}</th>
                <th className="py-3 px-4 text-right">{language === "bn" ? "পরিবর্তন" : "Change"}</th>
                <th className="py-3 px-4 text-right">{language === "bn" ? "একক খরচ" : "Unit Cost"}</th>
                <th className="py-3 px-4 text-right">{language === "bn" ? "পরবর্তী ব্যালেন্স" : "Balance After"}</th>
                <th className="py-3 px-4">{language === "bn" ? "বিবরণ / কারণ" : "Note / Reason"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedMovements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    {language === "bn" ? "কোন স্টক মুভমেন্ট রেকর্ড নেই" : "No stock movements recorded"}
                  </td>
                </tr>
              ) : (
                paginatedMovements.map((m) => {
                  const isPositive = m.quantityDelta > 0;
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <DateTimeText date={m.createdAt} />
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{m.productName}</div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">{m.sku}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold",
                            m.type === "PURCHASE" && "bg-blue-50 text-blue-700 border border-blue-200",
                            m.type === "SALE" && "bg-slate-100 text-slate-700 border border-slate-200",
                            m.type === "SALE_VOID" && "bg-emerald-50 text-emerald-700 border border-emerald-200",
                            m.type === "ADJUSTMENT" && "bg-amber-50 text-amber-700 border border-amber-200",
                            m.type === "PRODUCTION" && "bg-purple-50 text-purple-700 border border-purple-200"
                          )}
                        >
                          {m.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold tabular-nums">
                        <span className={isPositive ? "text-emerald-600" : "text-rose-600"}>
                          {isPositive ? `+${m.quantityDelta}` : m.quantityDelta}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-slate-600">
                        <MoneyText amount={m.unitCost} />
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 tabular-nums">
                        {m.balanceAfter}
                      </td>
                      <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                        {m.note || "-"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {filteredMovements.length > 0 && (
            <Pagination
              currentPage={ledgerPage}
              totalItems={filteredMovements.length}
              pageSize={ledgerPageSize}
              onPageChange={setLedgerPage}
              onPageSizeChange={setLedgerPageSize}
            />
          )}
        </div>
      )}

      {/* Modals */}
      <ReceiveStockModal
        key={preselectedId || "receive-modal"}
        products={products}
        accounts={accounts}
        open={isReceiveOpen}
        onOpenChange={setIsReceiveOpen}
        preselectedProductId={preselectedId}
      />
      <BulkIssueFactoryModal
        products={products}
        open={isBulkIssueOpen}
        onOpenChange={setIsBulkIssueOpen}
      />
      <MultiSweetProductionModal
        products={products}
        open={isMultiProductionOpen}
        onOpenChange={setIsMultiProductionOpen}
      />
      <AdjustStockModal
        products={products}
        open={isAdjustOpen}
        onOpenChange={setIsAdjustOpen}
      />
      <IssueKitchenModal
        products={products}
        open={isIssueKitchenOpen}
        onOpenChange={setIsIssueKitchenOpen}
        preselectedProductId={preselectedId}
      />
      <SweetProductionModal
        products={products}
        open={isSweetProductionOpen}
        onOpenChange={setIsSweetProductionOpen}
      />
      <ReportWastageModal
        products={products}
        open={isReportWastageOpen}
        onOpenChange={setIsReportWastageOpen}
      />
    </div>
  );
};
