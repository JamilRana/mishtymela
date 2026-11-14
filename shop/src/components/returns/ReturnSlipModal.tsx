"use client";

import React, { useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Printer, X, RotateCcw, Calendar, CheckCircle2 } from "lucide-react";
import { MoneyText } from "@/components/shared/MoneyText";
import { DateTimeText } from "@/components/shared/DateTimeText";

interface ReturnSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: {
    id: string;
    returnNo: string;
    invoiceNo: string;
    customerName: string;
    refundAmount: number;
    reason?: string | null;
    createdAt: string;
    items: Array<{
      id: string;
      productName: string;
      sku: string;
      unit: string;
      quantity: number;
      refundRate: number;
      lineTotal: number;
      restocked: boolean;
    }>;
  } | null;
}

export function ReturnSlipModal({ isOpen, onClose, record }: ReturnSlipModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!record) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 animate-in fade-in" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] rounded-2xl bg-card p-6 shadow-2xl border max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b mb-4">
            <div>
              <Dialog.Title className="text-lg font-bold flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-rose-600" />
                বিক্রয় ফেরত ভাউচার (Sales Return Slip)
              </Dialog.Title>
              <Dialog.Description className="text-xs text-muted-foreground mt-0.5">
                {record.returnNo} • ইনভয়েস: {record.invoiceNo}
              </Dialog.Description>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-lg shadow-sm hover:bg-primary/90 print:hidden font-medium"
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
              <div className="mt-2 inline-block px-3 py-1 bg-rose-50 text-rose-800 rounded-md font-mono text-xs font-bold border border-rose-200">
                বিক্রয় ফেরত স্লিপ: {record.returnNo}
              </div>
            </div>

            {/* Info */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-zinc-50 rounded-lg border border-zinc-200 text-xs">
              <div>
                <span className="font-semibold text-zinc-500 block">মূল ইনভয়েস:</span>
                <p className="font-mono font-bold text-sm text-zinc-900 mt-0.5">{record.invoiceNo}</p>
                <p className="text-zinc-600 mt-0.5 font-medium">গ্রাহক: {record.customerName}</p>
              </div>
              <div className="text-right">
                <span className="font-semibold text-zinc-500 block">ফেরতের তারিখ:</span>
                <p className="font-bold text-xs text-zinc-800 mt-0.5">
                  <DateTimeText date={record.createdAt} showTime={true} />
                </p>
              </div>
            </div>

            {/* Items Table */}
            <div className="border border-zinc-200 rounded-lg overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-100 text-zinc-700 font-semibold border-b border-zinc-200">
                  <tr>
                    <th className="py-2 px-3">ফেরত পণ্য (Item)</th>
                    <th className="py-2 px-2 text-center">পরিমাণ</th>
                    <th className="py-2 px-2 text-right">দর (৳)</th>
                    <th className="py-2 px-3 text-right">মোট (৳)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {record.items.map((item, idx) => (
                    <tr key={item.id || idx}>
                      <td className="py-2 px-3">
                        <span className="font-medium text-zinc-900 block">{item.productName}</span>
                        <span className={`text-[10px] ${item.restocked ? "text-emerald-700" : "text-rose-700"}`}>
                          {item.restocked ? "✓ পুনরায় স্টকে গৃহীত" : "✗ বিনষ্ট হিসেবে গণ্য"}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-center font-mono">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="py-2 px-2 text-right font-mono">
                        <MoneyText amount={item.refundRate} />
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-zinc-900">
                        <MoneyText amount={item.lineTotal} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total Refund Amount */}
            <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200 flex justify-between items-center text-sm font-bold">
              <span className="text-zinc-800">মোট রিফান্ড / ফেরত মূল্য:</span>
              <span className="font-mono text-base text-rose-700">
                <MoneyText amount={record.refundAmount} />
              </span>
            </div>

            {record.reason && (
              <div className="p-2 bg-amber-50 rounded border border-amber-200 text-amber-900 text-xs">
                <span className="font-bold">ফেরতের কারণ: </span>{record.reason}
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
              সিস্টেম জেনারেটেড বিক্রয় ফেরত রশিদ • মিষ্টি মেলা
            </p>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
