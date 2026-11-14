"use client";

import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Printer, CheckCircle2, User, Phone, Calendar } from "lucide-react";
import { MoneyText } from "@/components/shared/MoneyText";
import { DateTimeText } from "@/components/shared/DateTimeText";
import { useHydratedLanguage } from "@/stores/language";
import { useHydratedOrganization } from "@/stores/organization";

interface RepaymentReceiptData {
  receiptId: string;
  customerName: string;
  amount: number;
  remainingDue: number;
  accountName: string;
  date: string;
}

interface DueRepaymentReceiptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: RepaymentReceiptData | null;
}

export const DueRepaymentReceiptModal: React.FC<DueRepaymentReceiptModalProps> = ({
  open,
  onOpenChange,
  data,
}) => {
  const { language } = useHydratedLanguage();
  const isBn = language === "bn";
  const { shopInfo } = useHydratedOrganization();

  if (!data) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 animate-in fade-in duration-200" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4 print:hidden">
            <div className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
              <Dialog.Title className="text-base font-bold text-slate-900">
                {isBn ? "বাকি আদায়ের রসিদ" : "Due Repayment Receipt"}
              </Dialog.Title>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                <Printer className="w-4 h-4" />
                <span>{isBn ? "প্রিন্ট" : "Print"}</span>
              </button>
              <button
                onClick={() => onOpenChange(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Printable Voucher Paper */}
          <div className="p-4 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 space-y-4 text-xs font-sans">
            {/* Store Name Header */}
            <div className="text-center pb-3 border-b border-slate-200">
              <div className="text-base font-black text-slate-900">{shopInfo.name || "মিষ্টি মেলা"}</div>
              {shopInfo.address && <div className="text-[11px] text-slate-500">{shopInfo.address}</div>}
              {shopInfo.phone && <div className="text-[11px] text-slate-500 font-mono">মোবাইল: {shopInfo.phone}</div>}
              <div className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                {isBn ? "বাকি আদায় মানি রিসিট" : "Money Receipt"}
              </div>
            </div>

            {/* Receipt Details */}
            <div className="space-y-1.5 text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">{isBn ? "রসিদ নম্বর:" : "Receipt No:"}</span>
                <span className="font-mono font-bold">#{data.receiptId.slice(0, 8).toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{isBn ? "তারিখ ও সময়:" : "Date & Time:"}</span>
                <span className="font-mono">
                  <DateTimeText date={data.date} />
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{isBn ? "কাস্টমার নাম:" : "Customer Name:"}</span>
                <span className="font-bold text-slate-900">{data.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{isBn ? "পেমেন্ট মাধ্যম:" : "Payment Account:"}</span>
                <span className="font-semibold">{data.accountName}</span>
              </div>
            </div>

            {/* Amount Box */}
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                {isBn ? "আদায়কৃত মোট টাকা" : "Amount Received"}
              </span>
              <div className="text-2xl font-black text-emerald-700 font-mono mt-1">
                <MoneyText amount={data.amount} />
              </div>
            </div>

            {/* Remaining Balance */}
            <div className="flex justify-between items-center p-2 rounded-lg bg-white border border-slate-200">
              <span className="font-semibold text-slate-600">{isBn ? "অবশিষ্ট বাকি:" : "Remaining Due:"}</span>
              <span className="font-mono font-bold text-red-600">
                <MoneyText amount={data.remainingDue} />
              </span>
            </div>

            {/* Footer Signature */}
            <div className="pt-6 flex justify-between items-end text-[10px] text-slate-400">
              <div>
                <div className="w-24 border-b border-slate-300 mb-1" />
                <span>{isBn ? "কাস্টমারের স্বাক্ষর" : "Customer Signature"}</span>
              </div>
              <div className="text-right">
                <div className="w-24 border-b border-slate-300 mb-1 ml-auto" />
                <span>{isBn ? "গ্রহীতার স্বাক্ষর" : "Authorized Signature"}</span>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
