"use client";

import React, { useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Printer, Calendar, Phone, User, X, CheckCircle2 } from "lucide-react";
import { MoneyText } from "@/components/shared/MoneyText";
import { DateTimeText } from "@/components/shared/DateTimeText";

const BENGALI_MONTHS = [
  "",
  "জানুয়ারি",
  "ফেব্রুয়ারি",
  "মার্চ",
  "এপ্রিল",
  "মে",
  "জুন",
  "জুলাই",
  "আগস্ট",
  "সেপ্টেম্বর",
  "অক্টোবর",
  "নভেম্বর",
  "ডিসেম্বর",
];

interface PayslipModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: {
    id: string;
    employeeName: string;
    employeePhone: string;
    designation: string;
    month: number;
    year: number;
    baseSalary: number;
    bonus: number;
    deduction: number;
    netPayable: number;
    paidAmount: number;
    status: string;
    notes?: string | null;
    paymentDate?: string | null;
    accountName?: string | null;
  } | null;
}

export function PayslipModal({ isOpen, onClose, record }: PayslipModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!record) return null;

  const handlePrint = () => {
    window.print();
  };

  const monthName = BENGALI_MONTHS[record.month] || `মাস ${record.month}`;

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 animate-in fade-in" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] rounded-2xl bg-card p-6 shadow-2xl border max-h-[90vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="flex items-center justify-between pb-3 border-b mb-4">
            <div>
              <Dialog.Title className="text-lg font-bold flex items-center gap-2">
                কর্মচারী বেতন রশিদ (Employee Payslip)
              </Dialog.Title>
              <Dialog.Description className="text-xs text-muted-foreground mt-0.5">
                {monthName} {record.year} • {record.employeeName}
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

          {/* Printable Voucher */}
          <div ref={printRef} className="p-4 space-y-4 text-xs font-sans bg-white text-zinc-900 rounded-lg border">
            {/* Header */}
            <div className="text-center pb-3 border-b border-dashed border-zinc-300">
              <h2 className="text-xl font-black tracking-tight">মিষ্টি মেলা সুইটস ও বেকারি</h2>
              <p className="text-xs text-zinc-600">উন্নত মানের মিষ্টি ও কনফেকশনারি পণ্য বিক্রেতা</p>
              <div className="mt-2 inline-block px-3 py-1 bg-zinc-100 rounded-md font-mono text-xs font-bold">
                মাসিক বেতন ভাউচার: {monthName} {record.year}
              </div>
            </div>

            {/* Employee Information */}
            <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200 text-xs grid grid-cols-2 gap-3">
              <div>
                <span className="font-semibold text-zinc-500 block">কর্মীর নাম:</span>
                <p className="font-bold text-sm text-zinc-900 mt-0.5">{record.employeeName}</p>
                <p className="text-zinc-600 flex items-center gap-1 mt-0.5 font-mono">
                  <Phone className="w-3 h-3 text-zinc-400" /> {record.employeePhone}
                </p>
              </div>
              <div className="text-right">
                <span className="font-semibold text-zinc-500 block">পদবি:</span>
                <p className="font-bold text-sm text-zinc-800 mt-0.5">{record.designation}</p>
                {record.paymentDate && (
                  <p className="text-zinc-500 mt-0.5">
                    পরিশোধের তারিখ: <DateTimeText date={record.paymentDate} showTime={false} />
                  </p>
                )}
              </div>
            </div>

            {/* Salary Breakdown Table */}
            <div className="border border-zinc-200 rounded-lg overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-100 text-zinc-700 font-semibold border-b border-zinc-200">
                  <tr>
                    <th className="py-2 px-3">বিবরণ (Description)</th>
                    <th className="py-2 px-3 text-right">পরিমাণ (৳)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  <tr>
                    <td className="py-2 px-3">মূল বেতন (Base Salary)</td>
                    <td className="py-2 px-3 text-right font-mono font-medium">
                      <MoneyText amount={record.baseSalary} />
                    </td>
                  </tr>
                  {record.bonus > 0 && (
                    <tr className="text-emerald-700 bg-emerald-50/50">
                      <td className="py-2 px-3">উৎসব / কাজের বোনাস (Incentive / Bonus)</td>
                      <td className="py-2 px-3 text-right font-mono font-medium">
                        +<MoneyText amount={record.bonus} />
                      </td>
                    </tr>
                  )}
                  {record.deduction > 0 && (
                    <tr className="text-rose-700 bg-rose-50/50">
                      <td className="py-2 px-3">অনুপস্থিতি / অগ্রিম কর্তন (Deductions)</td>
                      <td className="py-2 px-3 text-right font-mono font-medium">
                        -<MoneyText amount={record.deduction} />
                      </td>
                    </tr>
                  )}
                  <tr className="bg-zinc-50 font-bold border-t border-zinc-300">
                    <td className="py-2.5 px-3 text-zinc-900">নিট প্রদেয় বেতন (Net Payable)</td>
                    <td className="py-2.5 px-3 text-right font-mono text-sm text-zinc-900">
                      <MoneyText amount={record.netPayable} />
                    </td>
                  </tr>
                  <tr className="text-emerald-800 font-semibold">
                    <td className="py-2 px-3">পরিশোধিত অর্থ (Disbursed Amount)</td>
                    <td className="py-2 px-3 text-right font-mono">
                      <MoneyText amount={record.paidAmount} />
                    </td>
                  </tr>
                  {record.netPayable - record.paidAmount > 0 && (
                    <tr className="text-rose-700 font-bold">
                      <td className="py-2 px-3">অবশিষ্ট বকেয়া (Remaining Due)</td>
                      <td className="py-2 px-3 text-right font-mono">
                        <MoneyText amount={record.netPayable - record.paidAmount} />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Account & Notes */}
            <div className="space-y-1 text-xs text-zinc-600 pt-1">
              {record.accountName && (
                <div className="flex justify-between">
                  <span>পরিশোধের মাধ্যম (Paid Via):</span>
                  <span className="font-semibold text-zinc-800">{record.accountName}</span>
                </div>
              )}
              {record.notes && (
                <div className="p-2 bg-amber-50 rounded border border-amber-200 text-amber-900 text-xs">
                  <span className="font-bold">নোট: </span>{record.notes}
                </div>
              )}
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-8 pt-8 mt-6 border-t border-zinc-200 text-xs text-center text-zinc-500">
              <div>
                <div className="border-t border-dashed border-zinc-400 pt-1">কর্মচারীর স্বাক্ষর</div>
              </div>
              <div>
                <div className="border-t border-dashed border-zinc-400 pt-1">ম্যানেজার / ক্যাশিয়ার</div>
              </div>
            </div>

            <p className="text-[10px] text-center text-zinc-400 pt-2 font-mono">
              সিস্টেম জেনারেটেড বেতন ভাউচার • মিষ্টি মেলা
            </p>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
