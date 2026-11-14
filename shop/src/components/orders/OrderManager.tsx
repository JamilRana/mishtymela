"use client";

import React, { useState, useMemo } from "react";
import {
  Calendar,
  Clock,
  Plus,
  Search,
  Truck,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Phone,
  Printer,
  Eye,
  Filter,
  DollarSign,
  PackageCheck,
  ChevronRight,
} from "lucide-react";
import { MoneyText } from "@/components/shared/MoneyText";
import { DateTimeText } from "@/components/shared/DateTimeText";
import { Pagination } from "@/components/shared/Pagination";
import { OrderStatus } from "@prisma/client";
import { NewOrderModal } from "./NewOrderModal";
import { OrderDetailModal } from "./OrderDetailModal";
import { OrderDeliveryModal } from "./OrderDeliveryModal";
import { OrderChallanSlipModal } from "./OrderChallanSlipModal";
import { useRouter, useSearchParams } from "next/navigation";

export interface OrderListItem {
  id: string;
  orderNo: string;
  contactId?: string | null;
  customerName: string;
  customerPhone: string;
  deliveryDate: string;
  subtotal: number;
  discount: number;
  advancePaid: number;
  total: number;
  dueBalance: number;
  status: OrderStatus;
  notes?: string | null;
  convertedSaleId?: string | null;
  createdAt: string;
  itemCount: number;
  items: Array<{
    id: string;
    productId: string;
    productName: string;
    sku: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
}

interface OrderManagerProps {
  orders: OrderListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  metrics: {
    pendingCount: number;
    readyCount: number;
    deliveredCount: number;
    totalAdvanceCollected: number;
    totalOutstandingDue: number;
  };
  products: Array<{
    id: string;
    name: string;
    sku: string;
    sellingPrice: number;
    stock: number;
    unit?: string | null;
  }>;
  customers: Array<{
    id: string;
    name: string;
    phone: string;
  }>;
  accounts: Array<{
    id: string;
    name: string;
    type: string;
  }>;
}

const STATUS_BADGES: Record<
  OrderStatus,
  { labelBn: string; labelEn: string; bg: string; text: string }
> = {
  PENDING: {
    labelBn: "অপেক্ষমান",
    labelEn: "Pending",
    bg: "bg-amber-500/10 border-amber-500/30",
    text: "text-amber-700 dark:text-amber-400",
  },
  CONFIRMED: {
    labelBn: "নিশ্চিত",
    labelEn: "Confirmed",
    bg: "bg-blue-500/10 border-blue-500/30",
    text: "text-blue-700 dark:text-blue-400",
  },
  IN_PREPARATION: {
    labelBn: "প্রস্তুতি চলছে",
    labelEn: "In Preparation",
    bg: "bg-purple-500/10 border-purple-500/30",
    text: "text-purple-700 dark:text-purple-400",
  },
  READY: {
    labelBn: "প্রস্তুত",
    labelEn: "Ready",
    bg: "bg-indigo-500/10 border-indigo-500/30",
    text: "text-indigo-700 dark:text-indigo-400",
  },
  DELIVERED: {
    labelBn: "ডেলিভার্ড",
    labelEn: "Delivered",
    bg: "bg-emerald-500/10 border-emerald-500/30",
    text: "text-emerald-700 dark:text-emerald-400",
  },
  CANCELLED: {
    labelBn: "বাতিল",
    labelEn: "Cancelled",
    bg: "bg-rose-500/10 border-rose-500/30",
    text: "text-rose-700 dark:text-rose-400",
  },
};

export function OrderManager({
  orders,
  totalCount,
  page,
  pageSize,
  totalPages,
  metrics,
  products,
  customers,
  accounts,
}: OrderManagerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Search and filter state
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [selectedStatus, setSelectedStatus] = useState<string>(
    searchParams.get("status") || "ALL"
  );

  // Modals state
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [detailOrder, setDetailOrder] = useState<OrderListItem | null>(null);
  const [deliveryOrder, setDeliveryOrder] = useState<OrderListItem | null>(null);
  const [challanOrder, setChallanOrder] = useState<OrderListItem | null>(null);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (search.trim()) {
      params.set("search", search.trim());
    } else {
      params.delete("search");
    }
    if (selectedStatus && selectedStatus !== "ALL") {
      params.set("status", selectedStatus);
    } else {
      params.delete("status");
    }
    params.set("page", "1");
    router.push(`/orders?${params.toString()}`);
  };

  const handleStatusFilter = (status: string) => {
    setSelectedStatus(status);
    const params = new URLSearchParams(searchParams.toString());
    if (status && status !== "ALL") {
      params.set("status", status);
    } else {
      params.delete("status");
    }
    params.set("page", "1");
    router.push(`/orders?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`/orders?${params.toString()}`);
  };

  // Helper for delivery schedule urgency badge
  const getDeliveryUrgency = (dateStr: string, status: OrderStatus) => {
    if (status === "DELIVERED" || status === "CANCELLED") return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);

    const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/30">
          <AlertCircle className="w-2.5 h-2.5" /> মেয়াদোত্তীর্ণ ({Math.abs(diffDays)} দিন পার)
        </span>
      );
    }
    if (diffDays === 0) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40">
          <Clock className="w-2.5 h-2.5" /> আজই ডেলিভারি (Today)
        </span>
      );
    }
    if (diffDays === 1) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/30">
          <Calendar className="w-2.5 h-2.5" /> আগামীকাল (Tomorrow)
        </span>
      );
    }
    return (
      <span className="text-[10px] text-muted-foreground">
        {diffDays} দিন পর
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="p-3 bg-card rounded-xl border shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-medium">মোট অর্ডার</span>
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div className="text-xl font-bold font-mono">{totalCount}</div>
          <span className="text-[10px] text-muted-foreground">সর্বমোট বুকিং</span>
        </div>

        <div className="p-3 bg-card rounded-xl border shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-medium">অপেক্ষমান</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-600">
            {metrics.pendingCount}
          </div>
          <span className="text-[10px] text-muted-foreground">প্রস্তুতি ও কনফার্মেশন</span>
        </div>

        <div className="p-3 bg-card rounded-xl border shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-medium">ডেলিভারির জন্য প্রস্তুত</span>
            <PackageCheck className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-bold font-mono text-indigo-600">
            {metrics.readyCount}
          </div>
          <span className="text-[10px] text-muted-foreground">প্যাকেট রেডি</span>
        </div>

        <div className="p-3 bg-card rounded-xl border shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-medium">অগ্রিম জমা</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-600">
            <MoneyText amount={metrics.totalAdvanceCollected} />
          </div>
          <span className="text-[10px] text-muted-foreground">সংগৃহীত ক্যাশ</span>
        </div>

        <div className="p-3 bg-card rounded-xl border shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-medium">বকেয়া বাকি</span>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-xl font-bold font-mono text-rose-600">
            <MoneyText amount={metrics.totalOutstandingDue} />
          </div>
          <span className="text-[10px] text-muted-foreground">ডেলিভারিতে আদায়যোগ্য</span>
        </div>
      </div>

      {/* Control Header & Tabs */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: "ALL", label: "সকল অর্ডার" },
            { id: "PENDING", label: "অপেক্ষমান" },
            { id: "CONFIRMED", label: "নিশ্চিত" },
            { id: "IN_PREPARATION", label: "প্রস্তুতি চলছে" },
            { id: "READY", label: "প্রস্তুত" },
            { id: "DELIVERED", label: "ডেলিভার্ড" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleStatusFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                selectedStatus === tab.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/50 hover:bg-muted text-muted-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Action & Search */}
        <div className="flex items-center gap-2">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 md:w-64">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="অর্ডার নং, নাম বা ফোন..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border rounded-lg bg-background outline-none focus:ring-2 focus:ring-primary/20"
            />
          </form>

          <button
            onClick={() => setIsNewOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium shadow-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            নতুন অর্ডার বুকিং
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="border rounded-xl bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/50 border-b text-muted-foreground font-semibold">
              <tr>
                <th className="py-3 px-3">অর্ডার নং</th>
                <th className="py-3 px-3">গ্রাহক</th>
                <th className="py-3 px-3">ডেলিভারির তারিখ</th>
                <th className="py-3 px-3">পণ্য বিবরণী</th>
                <th className="py-3 px-3 text-right">মোট বিল</th>
                <th className="py-3 px-3 text-right">অগ্রিম / বাকি</th>
                <th className="py-3 px-3 text-center">স্ট্যাটাস</th>
                <th className="py-3 px-3 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    কোন অর্ডার পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                orders.map((o) => {
                  const badge = STATUS_BADGES[o.status] || STATUS_BADGES.PENDING;
                  return (
                    <tr key={o.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-3">
                        <span className="font-mono font-bold text-foreground block">
                          {o.orderNo}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          <DateTimeText date={o.createdAt} showTime={false} />
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-semibold text-foreground block">
                          {o.customerName}
                        </span>
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
                          <Phone className="w-3 h-3 text-muted-foreground/60" />
                          {o.customerPhone}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-foreground flex items-center gap-1 font-mono">
                            <Calendar className="w-3 h-3 text-muted-foreground" />
                            <DateTimeText date={o.deliveryDate} showTime={false} />
                          </span>
                          {getDeliveryUrgency(o.deliveryDate, o.status)}
                        </div>
                      </td>

                      <td className="py-3 px-3 max-w-[200px]">
                        <span className="line-clamp-1 font-medium text-foreground">
                          {o.items.map((i) => `${i.productName} (${i.quantity} ${i.unit})`).join(", ")}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {o.itemCount} টি পণ্য তালিকাভুক্ত
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-foreground">
                        <MoneyText amount={o.total} />
                      </td>

                      <td className="py-3 px-3 text-right font-mono">
                        <span className="text-emerald-600 block">
                          অগ্রিম: <MoneyText amount={o.advancePaid} />
                        </span>
                        {o.dueBalance > 0 ? (
                          <span className="text-rose-600 font-semibold block">
                            বাকি: <MoneyText amount={o.dueBalance} />
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-[10px] block">
                            পরিশোধিত
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium border ${badge.bg} ${badge.text}`}
                        >
                          {badge.labelBn}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setChallanOrder(o)}
                            title="চালান স্লিপ প্রিন্ট"
                            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setDetailOrder(o)}
                            title="বিস্তারিত দেখুন"
                            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {o.status === "READY" && (
                            <button
                              onClick={() => setDeliveryOrder(o)}
                              title="ডেলিভারি সম্পন্ন করুন"
                              className="px-2 py-1 text-[11px] bg-emerald-600 text-white rounded font-medium hover:bg-emerald-700 flex items-center gap-1 shadow-sm"
                            >
                              <Truck className="w-3 h-3" />
                              ডেলিভারি
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-3 border-t">
            <Pagination
              currentPage={page}
              totalItems={totalCount}
              pageSize={pageSize}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>

      {/* New Order Modal */}
      <NewOrderModal
        isOpen={isNewOpen}
        onClose={() => setIsNewOpen(false)}
        products={products}
        customers={customers}
        accounts={accounts}
      />

      {/* Detail Modal */}
      <OrderDetailModal
        isOpen={!!detailOrder}
        onClose={() => setDetailOrder(null)}
        order={detailOrder}
        onOpenDelivery={() => {
          if (detailOrder) {
            setDeliveryOrder(detailOrder);
            setDetailOrder(null);
          }
        }}
        onOpenChallan={() => {
          if (detailOrder) {
            setChallanOrder(detailOrder);
          }
        }}
      />

      {/* Delivery Settlement Modal */}
      <OrderDeliveryModal
        isOpen={!!deliveryOrder}
        onClose={() => setDeliveryOrder(null)}
        order={deliveryOrder}
        accounts={accounts}
      />

      {/* Printable Challan Slip Modal */}
      <OrderChallanSlipModal
        isOpen={!!challanOrder}
        onClose={() => setChallanOrder(null)}
        order={challanOrder}
      />
    </div>
  );
}
