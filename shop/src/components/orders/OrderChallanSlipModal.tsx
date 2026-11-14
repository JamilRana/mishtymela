"use client";

import React, { useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Printer, Calendar, Phone, X } from "lucide-react";
import { MoneyText } from "@/components/shared/MoneyText";
import { DateTimeText } from "@/components/shared/DateTimeText";

interface OrderChallanSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    id: string;
    orderNo: string;
    customerName: string;
    customerPhone: string;
    deliveryDate: string;
    subtotal: number;
    discount: number;
    advancePaid: number;
    total: number;
    dueBalance: number;
    status: string;
    notes?: string | null;
    createdAt: string;
    items: Array<{
      id: string;
      productName: string;
      sku: string;
      unit: string;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
    }>;
  } | null;
}

export function OrderChallanSlipModal({ isOpen, onClose, order }: OrderChallanSlipModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 animate-in fade-in" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-xl translate-x-[-50%] translate-y-[-50%] rounded-2xl bg-card p-6 shadow-2xl border max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b mb-4">
            <div>
              <Dialog.Title className="text-lg font-bold flex items-center gap-2">
                অর্ডার ডেলিভারি চালান / স্লিপ
              </Dialog.Title>
              <Dialog.Description className="text-xs text-muted-foreground mt-0.5">
                Advance Order Delivery Slip &amp; Receipt Voucher
              </Dialog.Description>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-lg shadow-sm hover:bg-primary/90 print:hidden font-medium"
              >
                <Printer className="w-3.5 h-3.5" />
                প্রিন্ট (Print)
              </button>
              <button
                onClick={onClose}
                className="p-1.5 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Printable Area */}
          <div ref={printRef} className="p-4 space-y-4 text-xs font-sans bg-white text-zinc-900 rounded-lg border">
            {/* Header */}
            <div className="text-center pb-3 border-b border-dashed border-zinc-300">
              <h2 className="text-xl font-black tracking-tight">মিষ্টি মেলা সুইটস ও বেকারি</h2>
              <p className="text-xs text-zinc-600">উন্নত মানের মিষ্টি ও কনফেকশনারি পণ্য বিক্রেতা</p>
              <div className="mt-2 inline-block px-3 py-1 bg-zinc-100 rounded-md font-mono text-xs font-bold">
                অর্ডার নং: {order.orderNo}
              </div>
            </div>

            {/* Delivery & Customer Info */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-zinc-50 rounded-lg border border-zinc-200 text-xs">
              <div>
                <span className="font-semibold text-zinc-500 block">গ্রাহকের বিবরণ:</span>
                <p className="font-bold text-sm text-zinc-900 mt-0.5">{order.customerName}</p>
                <p className="text-zinc-600 flex items-center gap-1 mt-0.5 font-mono">
                  <Phone className="w-3 h-3 text-zinc-400" /> {order.customerPhone}
                </p>
              </div>
              <div className="text-right">
                <span className="font-semibold text-zinc-500 block">ডেলিভারির নির্ধারিত তারিখ:</span>
                <p className="font-bold text-sm text-amber-700 mt-0.5 flex items-center justify-end gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <DateTimeText date={order.deliveryDate} showTime={false} />
                </p>
                <p className="text-zinc-500 mt-0.5">
                  বুকিং তারিখ: <DateTimeText date={order.createdAt} showTime={false} />
                </p>
              </div>
            </div>

            {/* Order Items Table */}
            <div className="border border-zinc-200 rounded-lg overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-100 text-zinc-700 font-semibold border-b border-zinc-200">
                  <tr>
                    <th className="py-2 px-3">পণ্য (Item)</th>
                    <th className="py-2 px-2 text-center">পরিমাণ</th>
                    <th className="py-2 px-2 text-right">দর (৳)</th>
                    <th className="py-2 px-3 text-right">মোট (৳)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {order.items.map((item, idx) => (
                    <tr key={item.id || idx}>
                      <td className="py-2 px-3 font-medium text-zinc-900">
                        {item.productName}
                        {item.sku && <span className="block text-[10px] text-zinc-400 font-mono">[{item.sku}]</span>}
                      </td>
                      <td className="py-2 px-2 text-center font-mono font-medium">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="py-2 px-2 text-right font-mono">
                        <MoneyText amount={item.unitPrice} />
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-zinc-900">
                        <MoneyText amount={item.lineTotal} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Breakdown */}
            <div className="space-y-1.5 pt-2 border-t border-dashed border-zinc-300 text-xs">
              <div className="flex justify-between text-zinc-600">
                <span>উপমোট (Subtotal):</span>
                <span className="font-mono font-semibold">
                  <MoneyText amount={order.subtotal} />
                </span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>ছাড় (Discount):</span>
                  <span className="font-mono font-semibold">
                    -<MoneyText amount={order.discount} />
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-zinc-900 pt-1 border-t">
                <span>সর্বমোট মূল্য (Total Bill):</span>
                <span className="font-mono">
                  <MoneyText amount={order.total} />
                </span>
              </div>
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>অগ্রিম পরিশোধ (Advance Paid):</span>
                <span className="font-mono">
                  <MoneyText amount={order.advancePaid} />
                </span>
              </div>
              <div className="flex justify-between text-base font-black text-rose-700 pt-1 border-t">
                <span>ডেলিভারির সময় প্রদেয় বাকি (Due on Delivery):</span>
                <span className="font-mono">
                  <MoneyText amount={order.dueBalance} />
                </span>
              </div>
            </div>

            {/* Notes */}
            {order.notes && (
              <div className="p-2.5 bg-amber-50 rounded border border-amber-200 text-xs text-amber-900">
                <span className="font-bold block">বিশেষ নির্দেশনা / নোট:</span>
                <p className="mt-0.5">{order.notes}</p>
              </div>
            )}

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-8 pt-8 mt-6 border-t border-zinc-200 text-xs text-center text-zinc-500">
              <div>
                <div className="border-t border-dashed border-zinc-400 pt-1">গ্রাহকের স্বাক্ষর</div>
              </div>
              <div>
                <div className="border-t border-dashed border-zinc-400 pt-1">কর্তৃপক্ষের স্বাক্ষর</div>
              </div>
            </div>

            <p className="text-[10px] text-center text-zinc-400 pt-2 font-mono">
              সিস্টেম জেনারেটেড অর্ডার স্লিপ • মিষ্টি মেলা পিওএস
            </p>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
