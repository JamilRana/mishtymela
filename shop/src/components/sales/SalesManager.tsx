"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Search,
  Receipt,
  X,
  CreditCard,
  Ban,
  Printer,
  AlertCircle,
  Clock,
  User,
  ShoppingBag,
  Edit3,
  Check,
  RotateCcw,
} from "lucide-react";
import { MoneyText, formatMoney } from "@/components/shared/MoneyText";
import { DateTimeText } from "@/components/shared/DateTimeText";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Pagination } from "@/components/shared/Pagination";
import { recordSalePaymentAction, voidSaleAction, updateSaleAction } from "@/actions/sales";
import { useLanguageStore } from "@/stores/language";
import { useOrganizationStore } from "@/stores/organization";
import { cn } from "@/lib/utils";

interface SaleTransaction {
  id: string;
  amount: number;
  accountName: string;
  occurredAt: string;
  voidedAt: string | null;
}

interface SaleItemData {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  lineTotal: number;
}

interface SaleRecord {
  id: string;
  invoiceNo: string;
  customerName: string;
  subtotal: number;
  discount: number;
  total: number;
  paid: number;
  due: number;
  status: "COMPLETED" | "VOID";
  createdAt: string;
  voidedAt: string | null;
  items: SaleItemData[];
  transactions: SaleTransaction[];
}

interface SalesAccount {
  id: string;
  name: string;
}

interface SalesManagerProps {
  sales: SaleRecord[];
  totalCount?: number;
  currentPage?: number;
  pageSize?: number;
  totalPages?: number;
  accounts: SalesAccount[];
  shopProfile?: {
    name?: string | null;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    vatNumber?: string | null;
    receiptFooter?: string | null;
  } | null;
}

export const SalesManager: React.FC<SalesManagerProps> = ({
  sales,
  totalCount,
  currentPage,
  pageSize: initialPageSize = 25,
  accounts,
  shopProfile,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, language } = useLanguageStore();

  const isServerPaginated = totalCount !== undefined;
  const currentQ = searchParams.get("q") || "";
  const currentStatus = searchParams.get("status") || "all";

  const storedShop = useOrganizationStore((s) => s.shopInfo);
  const activeShop = {
    name: shopProfile?.name || storedShop.name,
    address: shopProfile?.address || storedShop.address,
    phone: shopProfile?.phone || storedShop.phone,
    email: shopProfile?.email || storedShop.email,
    vatNumber: shopProfile?.vatNumber || storedShop.vatNumber,
    receiptFooter: shopProfile?.receiptFooter || storedShop.receiptFooter,
  };

  const [search, setSearch] = useState(currentQ);
  const [statusFilter, setStatusFilter] = useState(currentStatus);
  const [selectedSale, setSelectedSale] = useState<SaleRecord | null>(null);

  // Invoice Display & Language Options
  const [invoiceLang, setInvoiceLang] = useState<"bn" | "en">(language);
  const [invoiceFormat, setInvoiceFormat] = useState<"a4" | "thermal">("a4");

  // Admin Invoice Editing State
  const [isEditingInvoice, setIsEditingInvoice] = useState(false);
  const [editCustomerName, setEditCustomerName] = useState("");
  const [editDiscount, setEditDiscount] = useState("0");
  const [editPaid, setEditPaid] = useState("0");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);

  // Collect Payment dialog state
  const [collectModalOpen, setCollectModalOpen] = useState(false);
  const [collectAmount, setCollectAmount] = useState("");
  const [collectAccountId, setCollectAccountId] = useState(accounts[0]?.id ?? "");
  const [isCollecting, setIsCollecting] = useState(false);
  const [collectError, setCollectError] = useState<string | null>(null);

  // Void confirmation dialog state
  const [voidConfirmOpen, setVoidConfirmOpen] = useState(false);
  const [isVoiding, setIsVoiding] = useState(false);

  // Client pagination fallback state
  const [clientPage, setClientPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const activePage = isServerPaginated ? (currentPage ?? 1) : clientPage;

  // Navigation handlers for server pagination
  const handlePageChange = (newPage: number) => {
    if (isServerPaginated) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", String(newPage));
      router.push(`/sales?${params.toString()}`);
    } else {
      setClientPage(newPage);
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    if (isServerPaginated) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("pageSize", String(newSize));
      params.set("page", "1");
      router.push(`/sales?${params.toString()}`);
    }
  };

  const handleStatusChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    if (isServerPaginated) {
      const params = new URLSearchParams(searchParams.toString());
      if (newStatus !== "all") {
        params.set("status", newStatus);
      } else {
        params.delete("status");
      }
      params.set("page", "1");
      router.push(`/sales?${params.toString()}`);
    }
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isServerPaginated) {
      const params = new URLSearchParams(searchParams.toString());
      if (search.trim()) {
        params.set("q", search.trim());
      } else {
        params.delete("q");
      }
      params.set("page", "1");
      router.push(`/sales?${params.toString()}`);
    }
  };

  // If server paginated, sales are already sliced by server
  const filtered = isServerPaginated
    ? sales
    : sales.filter((s) => {
        const q = search.trim().toLowerCase();
        const matchesSearch =
          q === "" ||
          s.invoiceNo.toLowerCase().includes(q) ||
          s.customerName.toLowerCase().includes(q);

        let matchesStatus = true;
        if (statusFilter === "paid") matchesStatus = s.status === "COMPLETED" && s.due <= 0;
        else if (statusFilter === "due") matchesStatus = s.status === "COMPLETED" && s.due > 0;
        else if (statusFilter === "void") matchesStatus = s.status === "VOID";

        return matchesSearch && matchesStatus;
      });

  const paginatedSales = isServerPaginated ? sales : filtered.slice((clientPage - 1) * pageSize, clientPage * pageSize);
  const totalItemsCount = isServerPaginated ? (totalCount ?? sales.length) : filtered.length;

  const handleCollectPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSale || !collectAmount || !collectAccountId) return;
    setCollectError(null);
    setIsCollecting(true);

    try {
      const res = await recordSalePaymentAction({
        saleId: selectedSale.id,
        amount: Number(collectAmount),
        accountId: collectAccountId,
      });

      if (!res.success) {
        setCollectError(res.error);
        return;
      }

      setCollectModalOpen(false);
      setSelectedSale(null);
      setCollectAmount("");
    } catch (err: any) {
      setCollectError(err?.message || "Failed to record payment");
    } finally {
      setIsCollecting(false);
    }
  };

  const handleVoidSale = async () => {
    if (!selectedSale) return;
    setIsVoiding(true);
    try {
      const res = await voidSaleAction(selectedSale.id);
      if (!res.success) {
        alert(res.error);
        return;
      }
      setSelectedSale(null);
      setVoidConfirmOpen(false);
    } catch (err: any) {
      alert(err?.message || "Failed to void sale");
    } finally {
      setIsVoiding(false);
    }
  };

  const handleSaveInvoiceEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSale) return;
    setEditError(null);
    setEditSuccess(null);
    setIsSavingEdit(true);

    try {
      const res = await updateSaleAction({
        saleId: selectedSale.id,
        customerName: editCustomerName.trim(),
        discount: Number(editDiscount || 0),
        paid: Number(editPaid || 0),
      });

      if (!res.success) {
        setEditError(res.error);
        return;
      }

      // Update current modal state
      setSelectedSale({
        ...selectedSale,
        customerName: res.sale.customerName,
        discount: res.sale.discount,
        total: res.sale.total,
        paid: res.sale.paid,
        due: res.sale.due,
      });

      setEditSuccess(
        invoiceLang === "bn"
          ? "ইনভয়েস সফলভাবে আপডেট হয়েছে!"
          : "Invoice details updated successfully!"
      );
      setIsEditingInvoice(false);
    } catch (err: any) {
      setEditError(err?.message || "Failed to update invoice");
    } finally {
      setIsSavingEdit(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 border border-slate-200 rounded-md">
        <div className="flex flex-1 items-center gap-2">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={language === "bn" ? "ইনভয়েস বা কাস্টমার খুঁজুন (Enter)..." : "Search by invoice # or customer (Enter)..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </form>

          <select
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
          >
            <option value="all">{language === "bn" ? "সকল বিক্রয়" : "All Invoices"}</option>
            <option value="paid">{language === "bn" ? "পরিশোধিত" : "Fully Paid"}</option>
            <option value="due">{language === "bn" ? "বাকি / ক্রেডিট" : "Due / Credit"}</option>
            <option value="void">{language === "bn" ? "বাতিলকৃত" : "Voided"}</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider font-semibold">
              <th className="py-3 px-4">{t("invoiceNo")}</th>
              <th className="py-3 px-4">{t("date")}</th>
              <th className="py-3 px-4">{t("customer")}</th>
              <th className="py-3 px-4 text-right">{t("total")}</th>
              <th className="py-3 px-4 text-right">{t("paid")}</th>
              <th className="py-3 px-4 text-right">{t("due")}</th>
              <th className="py-3 px-4 text-center">{t("status")}</th>
              <th className="py-3 px-4 text-right">{t("actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedSales.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  <Receipt className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-1" />
                  {language === "bn" ? "কোন বিক্রয় পাওয়া যায়নি।" : "No sales invoices recorded yet."}
                </td>
              </tr>
            ) : (
              paginatedSales.map((s) => (
                <tr
                  key={s.id}
                  onClick={() => setSelectedSale(s)}
                  className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                >
                  <td className="py-3 px-4 font-mono font-bold text-blue-600">
                    {s.invoiceNo}
                  </td>
                  <td className="py-3 px-4">
                    <DateTimeText date={s.createdAt} />
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-800">
                    {s.customerName}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">
                    <MoneyText amount={s.total} />
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-slate-700">
                    <MoneyText amount={s.paid} />
                  </td>
                  <td className="py-3 px-4 text-right font-bold">
                    {s.due > 0 ? (
                      <MoneyText amount={s.due} className="text-amber-600" />
                    ) : (
                      <span className="text-slate-400 font-normal">৳0.00</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {s.status === "VOID" ? (
                      <StatusBadge type="void" />
                    ) : s.due > 0 ? (
                      <StatusBadge type="due" />
                    ) : (
                      <StatusBadge type="completed" />
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSale(s);
                      }}
                      className="px-2 py-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded font-semibold"
                    >
                      {language === "bn" ? "রশিদ দেখুন" : "View"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {totalItemsCount > 0 && (
          <Pagination
            currentPage={activePage}
            totalItems={totalItemsCount}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        )}
      </div>

      {/* Sale Detail & Printable Invoice Modal */}
      {selectedSale && (
        <Dialog.Root
          open={Boolean(selectedSale)}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedSale(null);
              setIsEditingInvoice(false);
              setEditError(null);
              setEditSuccess(null);
            }
          }}
        >
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 animate-in fade-in" />
            <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-lg p-5 shadow-2xl border border-slate-200 z-50 animate-in zoom-in-95 focus:outline-none max-h-[92vh] overflow-y-auto">
              {/* Header Dialog Controls */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 print:hidden">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <Dialog.Title className="text-sm font-bold text-slate-900">
                      {invoiceLang === "bn" ? "ইনভয়েস:" : "Invoice:"}{" "}
                      <span className="font-mono text-blue-600">{selectedSale.invoiceNo}</span>
                    </Dialog.Title>
                    <Dialog.Description className="text-[11px] text-slate-500">
                      {selectedSale.customerName} • <DateTimeText date={selectedSale.createdAt} />
                    </Dialog.Description>
                  </div>
                </div>
                <Dialog.Close asChild>
                  <button className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100">
                    <X className="w-4 h-4" />
                  </button>
                </Dialog.Close>
              </div>

              {/* Admin Toolbar: Language, Format, and Edit Controls (Hidden when printing) */}
              <div className="my-3 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs print:hidden space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {/* Language Switcher */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-slate-500">
                      {invoiceLang === "bn" ? "ভাষা:" : "Language:"}
                    </span>
                    <div className="inline-flex rounded-md border border-slate-200 p-0.5 bg-white">
                      <button
                        type="button"
                        onClick={() => setInvoiceLang("bn")}
                        className={cn(
                          "px-2.5 py-1 text-xs font-bold rounded transition-colors",
                          invoiceLang === "bn"
                            ? "bg-rose-600 text-white shadow-2xs"
                            : "text-slate-600 hover:text-slate-900"
                        )}
                      >
                        বাংলা (BN)
                      </button>
                      <button
                        type="button"
                        onClick={() => setInvoiceLang("en")}
                        className={cn(
                          "px-2.5 py-1 text-xs font-bold rounded transition-colors",
                          invoiceLang === "en"
                            ? "bg-slate-900 text-white shadow-2xs"
                            : "text-slate-600 hover:text-slate-900"
                        )}
                      >
                        English (EN)
                      </button>
                    </div>
                  </div>

                  {/* Format Selector */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-slate-500">
                      {invoiceLang === "bn" ? "ফরম্যাট:" : "Format:"}
                    </span>
                    <div className="inline-flex rounded-md border border-slate-200 p-0.5 bg-white">
                      <button
                        type="button"
                        onClick={() => setInvoiceFormat("a4")}
                        className={cn(
                          "px-2.5 py-1 text-xs font-semibold rounded transition-colors",
                          invoiceFormat === "a4"
                            ? "bg-slate-900 text-white shadow-2xs font-bold"
                            : "text-slate-600 hover:text-slate-900"
                        )}
                      >
                        A4 / Standard
                      </button>
                      <button
                        type="button"
                        onClick={() => setInvoiceFormat("thermal")}
                        className={cn(
                          "px-2.5 py-1 text-xs font-semibold rounded transition-colors",
                          invoiceFormat === "thermal"
                            ? "bg-slate-900 text-white shadow-2xs font-bold"
                            : "text-slate-600 hover:text-slate-900"
                        )}
                      >
                        Thermal (80mm)
                      </button>
                    </div>
                  </div>

                  {/* Admin Change / Edit Button */}
                  {selectedSale.status === "COMPLETED" && (
                    <button
                      type="button"
                      onClick={() => {
                        const next = !isEditingInvoice;
                        setIsEditingInvoice(next);
                        if (next) {
                          setEditCustomerName(selectedSale.customerName);
                          setEditDiscount(selectedSale.discount.toString());
                          setEditPaid(selectedSale.paid.toString());
                          setEditError(null);
                          setEditSuccess(null);
                        }
                      }}
                      className={cn(
                        "px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors",
                        isEditingInvoice
                          ? "bg-amber-100 text-amber-900 border border-amber-300"
                          : "bg-white border border-slate-300 hover:bg-slate-100 text-slate-800"
                      )}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>
                        {isEditingInvoice
                          ? invoiceLang === "bn" ? "এডিট বন্ধ" : "Close Edit"
                          : invoiceLang === "bn" ? "ইনভয়েস পরিবর্তন / এডিট" : "Edit Invoice"}
                      </span>
                    </button>
                  )}
                </div>

                {/* Edit Success Notification */}
                {editSuccess && (
                  <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded text-xs flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{editSuccess}</span>
                  </div>
                )}
              </div>

              {/* Admin Edit Form (Displayed when editing invoice) */}
              {isEditingInvoice && (
                <form
                  onSubmit={handleSaveInvoiceEdit}
                  className="p-4 bg-amber-50/80 border border-amber-200 rounded-lg text-xs space-y-3 print:hidden mb-3 animate-in fade-in"
                >
                  <div className="flex items-center justify-between font-bold text-amber-900">
                    <span className="flex items-center gap-1.5">
                      <Edit3 className="w-4 h-4 text-amber-700" />
                      <span>{invoiceLang === "bn" ? "ইনভয়েসের তথ্য পরিবর্তন" : "Change Invoice Details"}</span>
                    </span>
                    <span className="text-[11px] font-normal text-amber-700">
                      {invoiceLang === "bn" ? "অ্যাডমিন অনুমতি" : "Admin Permission"}
                    </span>
                  </div>

                  {editError && (
                    <div className="p-2 bg-rose-50 border border-rose-200 text-rose-700 rounded text-xs">
                      {editError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">
                        {invoiceLang === "bn" ? "কাস্টমারের নাম" : "Customer Name"}
                      </label>
                      <input
                        type="text"
                        value={editCustomerName}
                        onChange={(e) => setEditCustomerName(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="e.g. জনাব রহিম"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">
                        {invoiceLang === "bn" ? "মূল্যছাড় ৳ (Discount)" : "Discount (৳)"}
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={editDiscount}
                        onChange={(e) => setEditDiscount(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">
                        {invoiceLang === "bn" ? "পরিশোধিত ৳ (Paid Amount)" : "Paid Amount (৳)"}
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={editPaid}
                        onChange={(e) => setEditPaid(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-amber-200">
                    <button
                      type="button"
                      onClick={() => setIsEditingInvoice(false)}
                      className="px-3 py-1.5 border border-slate-300 bg-white hover:bg-slate-100 rounded text-slate-700 font-medium"
                    >
                      {invoiceLang === "bn" ? "বাতিল" : "Cancel"}
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingEdit}
                      className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-bold shadow-xs transition-colors disabled:opacity-50"
                    >
                      {isSavingEdit
                        ? invoiceLang === "bn" ? "সংরক্ষণ হচ্ছে..." : "Saving..."
                        : invoiceLang === "bn" ? "পরিবর্তন সংরক্ষণ করুন" : "Save Changes"}
                    </button>
                  </div>
                </form>
              )}

              {/* Printable Invoice Container (Safe Margins & Clean Print Styling) */}
              <div
                id="invoice-printable"
                className={cn(
                  "my-3 p-6 bg-white border border-slate-200 rounded text-slate-800 text-xs box-border",
                  invoiceFormat === "thermal" && "thermal-mode max-w-[78mm] mx-auto p-3 font-mono text-[11px]"
                )}
              >
                {/* Shop Official Branding Header */}
                <div className="text-center pb-3 border-b border-dashed border-slate-300">
                  <h2 className="text-lg font-bold text-slate-900 uppercase tracking-tight">
                    {activeShop.name}
                  </h2>
                  {activeShop.address && (
                    <p className="text-xs text-slate-600 mt-0.5 max-w-md mx-auto">{activeShop.address}</p>
                  )}
                  <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5 text-xs text-slate-500 font-mono mt-1">
                    {activeShop.phone && (
                      <span>{invoiceLang === "bn" ? "মোবাইল: " : "Phone: "}{activeShop.phone}</span>
                    )}
                    {activeShop.vatNumber && (
                      <span>• {activeShop.vatNumber}</span>
                    )}
                  </div>
                  <div className="mt-2 inline-block px-3 py-0.5 bg-slate-100 border border-slate-200 rounded font-bold text-[11px] text-slate-800 uppercase tracking-wider">
                    {invoiceLang === "bn" ? "ক্যাশ মেমো / ইনভয়েস" : "CASH MEMO / INVOICE"}
                  </div>
                </div>

                {/* Metadata Row */}
                <div className="my-3 flex justify-between items-start text-xs border-b border-slate-100 pb-2.5">
                  <div className="space-y-0.5">
                    <div className="text-[10px] uppercase font-semibold text-slate-400">
                      {invoiceLang === "bn" ? "ইনভয়েস নম্বর" : "Invoice No"}
                    </div>
                    <div className="font-mono font-bold text-blue-700 text-sm">{selectedSale.invoiceNo}</div>
                    <div className="text-slate-700 pt-1">
                      <span className="text-slate-500">{invoiceLang === "bn" ? "ক্রেতা:" : "Customer:"} </span>
                      <span className="font-bold text-slate-900">
                        {selectedSale.customerName || (invoiceLang === "bn" ? "খুচরা ক্রেতা" : "Walk-in Customer")}
                      </span>
                    </div>
                  </div>
                  <div className="text-right space-y-0.5">
                    <div className="text-[10px] uppercase font-semibold text-slate-400">
                      {invoiceLang === "bn" ? "তারিখ ও সময়" : "Date & Time"}
                    </div>
                    <div className="font-mono text-slate-800">
                      <DateTimeText date={selectedSale.createdAt} />
                    </div>
                    <div className="pt-1">
                      {selectedSale.status === "VOID" ? (
                        <StatusBadge type="void" />
                      ) : selectedSale.due > 0 ? (
                        <StatusBadge type="due" />
                      ) : (
                        <StatusBadge type="completed" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Void Alert Banner */}
                {selectedSale.status === "VOID" && (
                  <div className="my-3 p-2.5 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700 flex items-center gap-2">
                    <Ban className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>
                      {invoiceLang === "bn"
                        ? "এই বিক্রয়টি বাতিল করা হয়েছে। মালামাল পুনরায় স্টকে ফেরত গেছে।"
                        : "This sale was VOIDED. Stock was restored back to inventory."}
                    </span>
                  </div>
                )}

                {/* Line Items Table */}
                <div className="my-3">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-300 text-slate-600 text-[10px] uppercase font-bold">
                        <th className="py-2 text-left">{invoiceLang === "bn" ? "আইটেম / পণ্যের নাম" : "Item Description"}</th>
                        <th className="py-2 text-center">{invoiceLang === "bn" ? "পরিমাণ" : "Qty"}</th>
                        <th className="py-2 text-right">{invoiceLang === "bn" ? "দর (৳)" : "Rate (৳)"}</th>
                        <th className="py-2 text-right">{invoiceLang === "bn" ? "মোট (৳)" : "Total (৳)"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedSale.items.map((it) => (
                        <tr key={it.id}>
                          <td className="py-2 font-medium text-slate-900">{it.productName}</td>
                          <td className="py-2 text-center font-mono font-medium">{it.quantity}</td>
                          <td className="py-2 text-right font-mono text-slate-600">
                            {formatMoney(it.unitPrice)}
                          </td>
                          <td className="py-2 text-right font-bold text-slate-900 font-mono">
                            {formatMoney(it.lineTotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals Summary */}
                <div className="bg-slate-50 p-3 rounded border border-slate-200 text-xs space-y-1.5 mt-3">
                  <div className="flex justify-between text-slate-600">
                    <span>{invoiceLang === "bn" ? "উপমোট (সাবটোটাল):" : "Subtotal:"}</span>
                    <span className="font-mono font-medium">{formatMoney(selectedSale.subtotal)}</span>
                  </div>
                  {selectedSale.discount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-medium">
                      <span>{invoiceLang === "bn" ? "মূল্যছাড় (-):" : "Discount (-):"}</span>
                      <span className="font-mono">-{formatMoney(selectedSale.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-sm text-slate-900 pt-1.5 border-t border-slate-200">
                    <span>{invoiceLang === "bn" ? "সর্বমোট প্রদেয় বিল:" : "Grand Total:"}</span>
                    <span className="font-mono text-blue-700">{formatMoney(selectedSale.total)}</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>{invoiceLang === "bn" ? "পরিশোধিত টাকা:" : "Paid Amount:"}</span>
                    <span className="font-mono font-semibold text-emerald-700">{formatMoney(selectedSale.paid)}</span>
                  </div>
                  {selectedSale.due > 0 && (
                    <div className="flex justify-between text-amber-700 font-bold">
                      <span>{invoiceLang === "bn" ? "বাকি টাকা:" : "Due Balance:"}</span>
                      <span className="font-mono">{formatMoney(selectedSale.due)}</span>
                    </div>
                  )}
                </div>

                {/* Receipt Footer Message */}
                {activeShop.receiptFooter && (
                  <div className="mt-4 pt-3 border-t border-dashed border-slate-300 text-center text-xs text-slate-500 font-medium italic">
                    {activeShop.receiptFooter}
                  </div>
                )}

                {/* Standard A4 Signature Block (Only visible on standard A4 layout during print) */}
                {invoiceFormat === "a4" && (
                  <div className="mt-10 pt-4 hidden print:flex justify-between items-end text-xs text-slate-600">
                    <div className="text-center">
                      <div className="w-36 border-t border-slate-400 mb-1" />
                      <span>{invoiceLang === "bn" ? "ক্রেতার স্বাক্ষর" : "Customer Signature"}</span>
                    </div>
                    <div className="text-center">
                      <div className="w-36 border-t border-slate-400 mb-1" />
                      <span>{invoiceLang === "bn" ? "কর্তৃপক্ষের স্বাক্ষর" : "Authorized Signature"}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions Footer (Hidden when printing) */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-200 print:hidden">
                {selectedSale.status === "COMPLETED" ? (
                  <button
                    onClick={() => setVoidConfirmOpen(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded transition-colors"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    {invoiceLang === "bn" ? "বিক্রয় বাতিল করুন" : "Void Sale"}
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-bold shadow-xs transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>{invoiceLang === "bn" ? "ইনভয়েস প্রিন্ট করুন" : "Print Invoice"}</span>
                  </button>

                  {selectedSale.status === "COMPLETED" && selectedSale.due > 0 && (
                    <button
                      onClick={() => {
                        setCollectAmount(selectedSale.due.toString());
                        setCollectModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold shadow-xs transition-colors"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      {invoiceLang === "bn" ? "বাকি আদায় করুন" : "Collect Payment"}
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setSelectedSale(null);
                      setIsEditingInvoice(false);
                      setEditError(null);
                      setEditSuccess(null);
                    }}
                    className="px-3 py-2 border border-slate-200 rounded text-xs font-medium text-slate-600 hover:bg-slate-50"
                  >
                    {invoiceLang === "bn" ? "বন্ধ করুন" : "Close"}
                  </button>
                </div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}

      {/* Collect Payment Modal */}
      {selectedSale && (
        <Dialog.Root open={collectModalOpen} onOpenChange={setCollectModalOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 animate-in fade-in" />
            <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-lg p-6 shadow-2xl border border-slate-200 z-50 animate-in zoom-in-95 focus:outline-none">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <Dialog.Title className="text-base font-semibold text-slate-900">
                  Collect Due Payment
                </Dialog.Title>
                <Dialog.Close asChild>
                  <button className="text-slate-400 hover:text-slate-600 p-1">
                    <X className="w-4 h-4" />
                  </button>
                </Dialog.Close>
              </div>

              {collectError && (
                <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700">
                  {collectError}
                </div>
              )}

              <form onSubmit={handleCollectPayment} className="mt-4 space-y-3 text-xs">
                <div>
                  <label className="font-medium text-slate-700 block mb-1">
                    Payment Amount (৳) — Max Due: {formatMoney(selectedSale.due)}
                  </label>
                  <input
                    required
                    type="number"
                    min="1"
                    max={selectedSale.due}
                    step="0.01"
                    value={collectAmount}
                    onChange={(e) => setCollectAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold tabular-nums"
                  />
                </div>

                <div>
                  <label className="font-medium text-slate-700 block mb-1">
                    Deposit To Account
                  </label>
                  <select
                    value={collectAccountId}
                    onChange={(e) => setCollectAccountId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setCollectModalOpen(false)}
                    className="px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCollecting}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold disabled:opacity-50"
                  >
                    {isCollecting ? "Posting..." : "Confirm Payment"}
                  </button>
                </div>
              </form>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}

      {/* Void Confirmation Modal */}
      <ConfirmDialog
        open={voidConfirmOpen}
        onOpenChange={setVoidConfirmOpen}
        title="Void Sale Confirmation"
        description={`Are you sure you want to void invoice ${selectedSale?.invoiceNo}? This will atomically restore all sold items back to inventory at their snapshot cost and reverse linked payment transactions.`}
        confirmLabel="Void Sale & Restore Stock"
        variant="danger"
        isLoading={isVoiding}
        onConfirm={handleVoidSale}
      />
    </div>
  );
};
