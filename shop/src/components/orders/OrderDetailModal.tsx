"use client";

import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { MoneyText } from "@/components/shared/MoneyText";
import { DateTimeText } from "@/components/shared/DateTimeText";
import { OrderStatus } from "@prisma/client";
import { updateOrderStatusAction } from "@/actions/orders";
import {
  Clock,
  CheckCircle,
  AlertCircle,
  Truck,
  PackageCheck,
  Ban,
  Printer,
  ChevronRight,
  Phone,
  User,
  Calendar,
  FileText,
  Loader2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface OrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
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
  } | null;
  onOpenDelivery: () => void;
  onOpenChallan: () => void;
}

const STATUS_STEPS: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
  OrderStatus.IN_PREPARATION,
  OrderStatus.READY,
  OrderStatus.DELIVERED,
];

const STATUS_LABELS: Record<OrderStatus, { bn: string; en: string }> = {
  PENDING: { bn: "অপেক্ষমান", en: "Pending" },
  CONFIRMED: { bn: "নিশ্চিত", en: "Confirmed" },
  IN_PREPARATION: { bn: "প্রস্তুতি চলছে", en: "In Preparation" },
  READY: { bn: "প্রস্তুত", en: "Ready" },
  DELIVERED: { bn: "ডেলিভার্ড", en: "Delivered" },
  CANCELLED: { bn: "বাতিল", en: "Cancelled" },
};

export function OrderDetailModal({
  isOpen,
  onClose,
  order,
  onOpenDelivery,
  onOpenChallan,
}: OrderDetailModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!order) return null;

  const handleStatusChange = async (nextStatus: OrderStatus) => {
    setError(null);
    setLoading(true);
    try {
      const res = await updateOrderStatusAction({
        orderId: order.id,
        status: nextStatus,
      });

      if (!res.success) {
        setError(res.error || "Failed to update order status.");
        return;
      }

      router.refresh();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Error updating status");
    } finally {
      setLoading(false);
    }
  };

  const currentStepIndex = STATUS_STEPS.indexOf(order.status);

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 animate-in fade-in" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] rounded-2xl bg-card p-6 shadow-2xl border max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b mb-4">
            <div>
              <Dialog.Title className="text-xl font-bold flex items-center gap-2">
                অর্ডার বিবরণী (Order Details)
              </Dialog.Title>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-muted rounded">
                  {order.orderNo}
                </span>
                <span className="text-xs text-muted-foreground">
                  বুকিং: <DateTimeText date={order.createdAt} showTime={true} />
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenChallan}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border rounded-lg hover:bg-muted font-medium"
              >
                <Printer className="w-3.5 h-3.5" />
                চালান স্লিপ প্রিন্ট
              </button>
              <button
                onClick={onClose}
                className="p-1.5 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Status Lifecycle Stepper */}
          {order.status !== "CANCELLED" ? (
            <div className="py-2 mb-4">
              <div className="flex items-center justify-between relative">
                {STATUS_STEPS.map((step, idx) => {
                  const isPassed = currentStepIndex >= idx;
                  const isCurrent = currentStepIndex === idx;

                  return (
                    <div key={step} className="flex-1 flex flex-col items-center relative z-10">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                          isCurrent
                            ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                            : isPassed
                            ? "bg-emerald-600 text-white"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {isPassed && !isCurrent ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                      </div>
                      <span
                        className={`text-[10px] mt-1 text-center font-medium ${
                          isCurrent
                            ? "text-primary font-bold"
                            : isPassed
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        {STATUS_LABELS[step]?.bn}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 rounded-lg text-xs flex items-center gap-2">
              <Ban className="w-4 h-4 shrink-0" />
              <span>এই অর্ডারটি বাতিল (CANCELLED) করা হয়েছে।</span>
            </div>
          )}

          {/* Customer & Delivery Information */}
          <div className="grid grid-cols-2 gap-4 p-3 bg-muted/30 rounded-lg text-xs border mb-4">
            <div className="space-y-1">
              <span className="text-muted-foreground block font-medium">গ্রাহক তথ্য (Customer):</span>
              <p className="font-bold text-sm text-foreground flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-muted-foreground" />
                {order.customerName}
              </p>
              <p className="font-mono text-muted-foreground flex items-center gap-1.5">
                <Phone className="w-3 h-3 text-muted-foreground" />
                {order.customerPhone}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground block font-medium">ডেলিভারির সময় (Delivery Schedule):</span>
              <p className="font-bold text-sm text-amber-600 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <DateTimeText date={order.deliveryDate} showTime={false} />
              </p>
              <p className="text-muted-foreground">
                স্ট্যাটাস: <span className="font-semibold text-foreground">{STATUS_LABELS[order.status]?.bn}</span>
              </p>
            </div>
          </div>

          {/* Order Items Table */}
          <div className="border rounded-lg overflow-hidden text-xs mb-4">
            <table className="w-full">
              <thead className="bg-muted/50 border-b text-muted-foreground font-semibold">
                <tr>
                  <th className="py-2 px-3 text-left">পণ্য</th>
                  <th className="py-2 px-2 text-center">পরিমাণ</th>
                  <th className="py-2 px-2 text-right">দর (৳)</th>
                  <th className="py-2 px-3 text-right">মোট (৳)</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {order.items.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/20">
                    <td className="py-2 px-3">
                      <span className="font-medium text-foreground">{item.productName}</span>
                      {item.sku && (
                        <span className="block text-[10px] text-muted-foreground font-mono">
                          {item.sku}
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-2 text-center font-mono font-medium">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="py-2 px-2 text-right font-mono">
                      <MoneyText amount={item.unitPrice} />
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-foreground">
                      <MoneyText amount={item.lineTotal} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Summary */}
          <div className="p-3 bg-muted/40 rounded-lg space-y-1.5 text-xs border mb-4">
            <div className="flex justify-between text-muted-foreground">
              <span>উপমোট:</span>
              <span className="font-mono font-semibold">
                <MoneyText amount={order.subtotal} />
              </span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>ছাড়:</span>
                <span className="font-mono font-semibold">
                  -<MoneyText amount={order.discount} />
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold pt-1 border-t">
              <span>সর্বমোট বিল:</span>
              <span className="font-mono">
                <MoneyText amount={order.total} />
              </span>
            </div>
            <div className="flex justify-between text-emerald-600 font-semibold">
              <span>অগ্রিম পরিশোধ (Advance Paid):</span>
              <span className="font-mono">
                <MoneyText amount={order.advancePaid} />
              </span>
            </div>
            <div className="flex justify-between text-sm font-bold text-rose-600 pt-1 border-t">
              <span>ডেলিভারি বাকি (Due on Delivery):</span>
              <span className="font-mono">
                <MoneyText amount={order.dueBalance} />
              </span>
            </div>
          </div>

          {/* Order Notes */}
          {order.notes && (
            <div className="p-2.5 bg-muted/30 border rounded-lg text-xs space-y-0.5 mb-4">
              <span className="font-semibold text-muted-foreground flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" /> নির্দেশনা / নোট:
              </span>
              <p className="text-foreground">{order.notes}</p>
            </div>
          )}

          {/* Workflow Actions */}
          <div className="border-t pt-3 flex flex-wrap items-center justify-between gap-2">
            {order.status !== "DELIVERED" && order.status !== "CANCELLED" && (
              <button
                onClick={() => handleStatusChange(OrderStatus.CANCELLED)}
                disabled={loading}
                className="px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg font-medium"
              >
                অর্ডার বাতিল করুন
              </button>
            )}

            <div className="flex items-center gap-2 ml-auto">
              {order.status === "PENDING" && (
                <button
                  onClick={() => handleStatusChange(OrderStatus.CONFIRMED)}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium"
                >
                  {loading && <Loader2 className="w-3 h-3 animate-spin" />}
                  অর্ডার নিশ্চিত করুন (Confirm)
                </button>
              )}

              {order.status === "CONFIRMED" && (
                <button
                  onClick={() => handleStatusChange(OrderStatus.IN_PREPARATION)}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium"
                >
                  {loading && <Loader2 className="w-3 h-3 animate-spin" />}
                  প্রস্তুতি শুরু করুন (In Preparation)
                </button>
              )}

              {order.status === "IN_PREPARATION" && (
                <button
                  onClick={() => handleStatusChange(OrderStatus.READY)}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                >
                  {loading && <Loader2 className="w-3 h-3 animate-spin" />}
                  প্রস্তুত চিহ্নিত করুন (Mark Ready)
                </button>
              )}

              {order.status === "READY" && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenDelivery();
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-bold shadow-sm"
                >
                  <Truck className="w-4 h-4" />
                  ডেলিভারি সম্পন্ন করুন (Deliver)
                </button>
              )}

              {order.status === "DELIVERED" && (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium text-xs rounded-lg">
                  <CheckCircle className="w-4 h-4" /> সম্পন্ন ও ডেলিভার্ড
                </span>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
