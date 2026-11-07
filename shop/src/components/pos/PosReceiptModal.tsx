"use client";

import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Printer, Download, Plus, CheckCircle, X } from "lucide-react";
import { formatMoney } from "@/components/shared/MoneyText";
import { formatDhakaDate } from "@/components/shared/DateTimeText";
import { toBnDigits } from "@/lib/bangla-numbers";
import { useHydratedLanguage } from "@/stores/language";
import { useOrganizationStore } from "@/stores/organization";
import { cn } from "@/lib/utils";

export interface ReceiptData {
  invoiceNo: string;
  customerName?: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  subtotal: number;
  discount: number;
  total: number;
  paid: number;
  due: number;
  change: number;
  accountName: string;
  date: Date;
}

interface PosReceiptModalProps {
  open: boolean;
  receipt: ReceiptData | null;
  onNewSale: () => void;
  shopProfile?: {
    name: string;
    address?: string | null;
    phone?: string | null;
    vatNumber?: string | null;
    receiptFooter?: string | null;
  };
}

export const PosReceiptModal: React.FC<PosReceiptModalProps> = ({
  open,
  receipt,
  onNewSale,
  shopProfile,
}) => {
  const { language } = useHydratedLanguage();
  const [receiptLang, setReceiptLang] = useState<"bn" | "en">(language);
  const isBn = receiptLang === "bn";

  const storedShop = useOrganizationStore((s) => s.shopInfo);
  const activeShop = shopProfile?.name ? {
    name: shopProfile.name,
    address: shopProfile.address || "",
    phone: shopProfile.phone || "",
    vatNumber: shopProfile.vatNumber || "",
    receiptFooter: shopProfile.receiptFooter || "",
  } : storedShop;

  if (!receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => { if (!isOpen) onNewSale(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 animate-in fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-lg p-5 shadow-2xl z-50 animate-in zoom-in-95 focus:outline-none">
          <Dialog.Title className="sr-only">Sale Receipt</Dialog.Title>
          <Dialog.Description className="sr-only">Print or view completed sale receipt</Dialog.Description>
          
          {/* Header Controls (Hidden when printing) */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 print:hidden">
            <div className="flex items-center gap-2 text-emerald-600 font-semibold text-xs sm:text-sm">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{isBn ? "বিক্রয় সম্পন্ন হয়েছে" : "Sale Completed"}</span>
            </div>

            {/* Language Switcher */}
            <div className="flex items-center gap-1.5">
              <div className="inline-flex rounded-md border border-slate-200 p-0.5 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setReceiptLang("bn")}
                  className={cn(
                    "px-2.5 py-1 rounded text-xs font-bold transition-colors",
                    isBn ? "bg-rose-600 text-white" : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  বাংলা
                </button>
                <button
                  type="button"
                  onClick={() => setReceiptLang("en")}
                  className={cn(
                    "px-2.5 py-1 rounded text-xs font-bold transition-colors",
                    !isBn ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  EN
                </button>
              </div>

              <button
                onClick={onNewSale}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Printable Thermal Receipt Paper Container */}
          <div
            id="thermal-receipt"
            className="my-3 p-4 bg-white border border-slate-200 rounded text-slate-900 text-sm font-mono select-text"
          >
            {/* Store Header */}
            <div className="text-center pb-2 border-b border-dashed border-slate-300">
              <h2 className="font-bold text-base text-slate-900 uppercase">
                {activeShop.name}
              </h2>
              {activeShop.address && (
                <p className="text-xs text-slate-600 mt-0.5">{activeShop.address}</p>
              )}
              {activeShop.phone && (
                <p className="text-xs text-slate-600 font-mono">
                  {isBn ? "মোবাইল: " : "Phone: "}{isBn ? toBnDigits(activeShop.phone) : activeShop.phone}
                </p>
              )}
              {activeShop.vatNumber && (
                <p className="text-xs text-slate-500 font-mono">
                  {isBn ? toBnDigits(activeShop.vatNumber) : activeShop.vatNumber}
                </p>
              )}
              <div className="mt-1 pt-1 border-t border-dotted border-slate-200 flex justify-between items-center text-xs text-slate-600">
                <span className="font-semibold font-mono">{isBn ? toBnDigits(receipt.invoiceNo) : receipt.invoiceNo}</span>
                <span>{formatDhakaDate(receipt.date, true, receiptLang)}</span>
              </div>
            </div>

            {/* Customer Info if applicable */}
            {receipt.customerName && (
              <div className="py-1.5 text-xs sm:text-sm border-b border-dashed border-slate-300 flex justify-between">
                <span className="text-slate-500">{isBn ? "ক্রেতার নাম:" : "Customer:"}</span>
                <span className="font-semibold">{receipt.customerName}</span>
              </div>
            )}

            {/* Line Items */}
            <div className="py-2 border-b border-dashed border-slate-300 space-y-1.5">
              <div className="flex justify-between font-bold text-xs text-slate-600 uppercase">
                <span>{isBn ? "আইটেম" : "Item"}</span>
                <span>{isBn ? "পরিমাণ x দর" : "Qty x Rate"}</span>
                <span>{isBn ? "মোট" : "Total"}</span>
              </div>
              {receipt.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-baseline text-xs sm:text-sm">
                  <div className="truncate max-w-[130px] font-sans">
                    {item.name}
                  </div>
                  <div className="text-xs text-slate-600 font-mono">
                    {isBn ? toBnDigits(item.quantity) : item.quantity} x {formatMoney(item.unitPrice, receiptLang)}
                  </div>
                  <div className="font-semibold font-mono">{formatMoney(item.lineTotal, receiptLang)}</div>
                </div>
              ))}
            </div>

            {/* Calculation Breakdown */}
            <div className="py-2 border-b border-dashed border-slate-300 space-y-1 text-xs sm:text-sm">
              <div className="flex justify-between text-slate-600">
                <span>{isBn ? "উপমোট (সাবটোটাল):" : "Subtotal:"}</span>
                <span className="font-mono">{formatMoney(receipt.subtotal, receiptLang)}</span>
              </div>
              {receipt.discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>{isBn ? "মূল্যছাড় (-):" : "Discount (-):"}</span>
                  <span className="font-mono">-{formatMoney(receipt.discount, receiptLang)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-slate-900 text-sm sm:text-base pt-1 border-t border-slate-200">
                <span>{isBn ? "সর্বমোট বিল:" : "Total Amount:"}</span>
                <span className="font-mono font-bold text-slate-900">{formatMoney(receipt.total, receiptLang)}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>{isBn ? "পরিশোধিত:" : "Paid:"} ({receipt.accountName})</span>
                <span className="font-mono font-semibold">{formatMoney(receipt.paid, receiptLang)}</span>
              </div>
              {receipt.change > 0 && (
                <div className="flex justify-between font-semibold text-emerald-700">
                  <span>{isBn ? "ফেরত:" : "Change:"}</span>
                  <span className="font-mono">{formatMoney(receipt.change, receiptLang)}</span>
                </div>
              )}
              {receipt.due > 0 && (
                <div className="flex justify-between font-bold text-amber-700">
                  <span>{isBn ? "বাকি টাকা:" : "Due Balance:"}</span>
                  <span className="font-mono">{formatMoney(receipt.due, receiptLang)}</span>
                </div>
              )}
            </div>

            {/* Receipt Footer */}
            <div className="pt-2 text-center text-xs text-slate-600">
              <p>{activeShop.receiptFooter || "স্বাদে ও ঐতিহ্যে অনন্য • ধন্যবাদ আবার আসবেন!"}</p>
            </div>
          </div>

          {/* Action Buttons (Hidden when printing) */}
          <div className="grid grid-cols-2 gap-2 mt-4 print:hidden">
            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs sm:text-sm font-semibold transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>{isBn ? "রশিদ প্রিন্ট (Thermal)" : "Print Receipt"}</span>
            </button>
            <button
              onClick={onNewSale}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-xs sm:text-sm font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>{isBn ? "পরবর্তী বিক্রয়" : "Next Sale"}</span>
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
