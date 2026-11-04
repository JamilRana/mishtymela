"use client";

import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Printer, Download, Plus, CheckCircle, X } from "lucide-react";
import { formatMoney } from "@/components/shared/MoneyText";
import { formatDhakaDate } from "@/components/shared/DateTimeText";
import { useLanguageStore } from "@/stores/language";
import { useOrganizationStore } from "@/stores/organization";

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
  const { t, language } = useLanguageStore();
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
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-lg p-6 shadow-2xl z-50 animate-in zoom-in-95 focus:outline-none">
          <Dialog.Title className="sr-only">Sale Receipt</Dialog.Title>
          <Dialog.Description className="sr-only">Print or view completed sale receipt</Dialog.Description>
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm">
              <CheckCircle className="w-5 h-5" />
              {t("saleCompleted")}
            </div>
            <button
              onClick={onNewSale}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Printable Receipt Paper Container */}
          <div
            id="thermal-receipt"
            className="my-4 p-4 bg-slate-50 border border-slate-200 rounded text-slate-800 text-xs font-mono select-text"
          >
            {/* Store Header */}
            <div className="text-center pb-2 border-b border-dashed border-slate-300">
              <h2 className="font-bold text-sm text-slate-900 uppercase">
                {activeShop.name || t("shopTitle")}
              </h2>
              {activeShop.address && (
                <p className="text-[10px] text-slate-600">{activeShop.address}</p>
              )}
              {activeShop.phone && (
                <p className="text-[10px] text-slate-500 font-mono">
                  {language === "bn" ? "মোবাইল: " : "Tel: "}{activeShop.phone}
                </p>
              )}
              {activeShop.vatNumber && (
                <p className="text-[9px] text-slate-400 font-mono">{activeShop.vatNumber}</p>
              )}
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                {receipt.invoiceNo}
              </p>
              <p className="text-[10px] text-slate-500">
                {formatDhakaDate(receipt.date, true)}
              </p>
            </div>

            {/* Customer Info if applicable */}
            {receipt.customerName && (
              <div className="py-1 text-[11px] border-b border-dashed border-slate-300">
                <span className="text-slate-500">{language === "bn" ? "কাস্টমার: " : "Customer: "}</span>
                <span className="font-semibold">{receipt.customerName}</span>
              </div>
            )}

            {/* Line Items */}
            <div className="py-2 border-b border-dashed border-slate-300 space-y-1">
              <div className="flex justify-between font-semibold text-[10px] text-slate-500 uppercase">
                <span>{language === "bn" ? "আইটেম" : "Item"}</span>
                <span>{language === "bn" ? "পরিমাণ x দর" : "Qty x Price"}</span>
                <span>{language === "bn" ? "মোট" : "Total"}</span>
              </div>
              {receipt.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-baseline text-[11px]">
                  <div className="truncate max-w-[120px] font-sans">
                    {item.name}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {item.quantity} x {item.unitPrice}
                  </div>
                  <div className="font-semibold">{formatMoney(item.lineTotal)}</div>
                </div>
              ))}
            </div>

            {/* Calculation Breakdown */}
            <div className="py-2 border-b border-dashed border-slate-300 space-y-0.5 text-[11px]">
              <div className="flex justify-between text-slate-600">
                <span>{t("subtotal")}:</span>
                <span>{formatMoney(receipt.subtotal)}</span>
              </div>
              {receipt.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>{t("discount")}:</span>
                  <span>-{formatMoney(receipt.discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-slate-900 text-xs pt-1 border-t border-slate-200">
                <span>{t("totalAmount")}:</span>
                <span>{formatMoney(receipt.total)}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>{t("paid")} ({receipt.accountName}):</span>
                <span>{formatMoney(receipt.paid)}</span>
              </div>
              {receipt.change > 0 && (
                <div className="flex justify-between font-semibold text-emerald-700">
                  <span>{t("changeGiven")}:</span>
                  <span>{formatMoney(receipt.change)}</span>
                </div>
              )}
              {receipt.due > 0 && (
                <div className="flex justify-between font-bold text-amber-700">
                  <span>{t("creditDue")}:</span>
                  <span>{formatMoney(receipt.due)}</span>
                </div>
              )}
            </div>

            {/* Receipt Footer */}
            <div className="pt-2 text-center text-[10px] text-slate-500">
              <p>{activeShop.receiptFooter || "স্বাদে ও ঐতিহ্যে অনন্য • Thank you for shopping with us!"}</p>
              <p className="font-mono text-[9px] mt-0.5 text-slate-400">Sweet Shop Retail Core</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold transition-colors"
            >
              <Printer className="w-4 h-4" />
              {t("printThermalReceipt")}
            </button>
            <button
              onClick={onNewSale}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t("nextSale")}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
