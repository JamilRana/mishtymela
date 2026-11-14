"use client";

import React, { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, BookOpen, User, Phone, MapPin, Download } from "lucide-react";
import { getContactById } from "@/actions/contacts";
import { MoneyText } from "@/components/shared/MoneyText";
import { DateTimeText } from "@/components/shared/DateTimeText";
import { useHydratedLanguage } from "@/stores/language";

interface ContactLedgerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactId: string | null;
}

export const ContactLedgerModal: React.FC<ContactLedgerModalProps> = ({
  open,
  onOpenChange,
  contactId,
}) => {
  const { language } = useHydratedLanguage();
  const isBn = language === "bn";

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (open && contactId) {
      setLoading(true);
      getContactById(contactId)
        .then((res) => {
          setData(res);
        })
        .finally(() => setLoading(false));
    } else {
      setData(null);
    }
  }, [open, contactId]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 animate-in fade-in duration-200" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-3xl translate-x-[-50%] translate-y-[-50%] rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <Dialog.Title className="text-lg font-bold text-slate-900">
                  {data?.name || (isBn ? "খাতার বিবরণী" : "Ledger Statement")}
                </Dialog.Title>
                <Dialog.Description className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                  <span className="font-mono">{data?.phone}</span>
                  {data?.address && <span>• {data.address}</span>}
                </Dialog.Description>
              </div>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* KPI Strip */}
          {data && (
            <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 mb-4 text-center">
              <div>
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  {isBn ? "প্রারম্ভিক জের" : "Opening Balance"}
                </div>
                <div className="text-sm font-bold text-slate-800 mt-0.5">
                  <MoneyText amount={data.openingBalance} />
                </div>
              </div>
              <div>
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  {data.type === "CUSTOMER"
                    ? (isBn ? "সর্বোচ্চ বাকি সীমা" : "Credit Limit")
                    : (isBn ? "পদবি" : "Designation")}
                </div>
                <div className="text-sm font-bold text-slate-800 mt-0.5">
                  {data.type === "CUSTOMER" ? (
                    data.creditLimit ? <MoneyText amount={data.creditLimit} /> : "—"
                  ) : (
                    data.designation || "—"
                  )}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  {isBn ? "বর্তমান ব্যালেন্স / বাকি" : "Current Balance / Due"}
                </div>
                <div className={`text-base font-bold mt-0.5 ${data.currentDue > 0 ? "text-red-600" : "text-emerald-600"}`}>
                  <MoneyText amount={data.currentDue} />
                </div>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl">
            {loading ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                {isBn ? "বিবরণী লোড হচ্ছে..." : "Loading ledger statement..."}
              </div>
            ) : !data?.ledgerEntries || data.ledgerEntries.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                {isBn ? "কোন লেনদেনের রেকর্ড পাওয়া যায়নি" : "No ledger transactions recorded yet."}
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">{isBn ? "তারিখ" : "Date"}</th>
                    <th className="py-2.5 px-3">{isBn ? "বিবরণ" : "Description"}</th>
                    <th className="py-2.5 px-3 text-right">{isBn ? "ডেবিট (৳)" : "Debit (৳)"}</th>
                    <th className="py-2.5 px-3 text-right">{isBn ? "ক্রেডিট (৳)" : "Credit (৳)"}</th>
                    <th className="py-2.5 px-3 text-right">{isBn ? "ব্যালেন্স (৳)" : "Balance (৳)"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.ledgerEntries.map((l: any) => (
                    <tr key={l.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-slate-500 font-mono whitespace-nowrap">
                        <DateTimeText date={l.date} showTime={false} />
                      </td>
                      <td className="py-2 px-3 font-medium text-slate-800">
                        {l.description || l.refType}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-medium text-red-600">
                        {l.debit > 0 ? <MoneyText amount={l.debit} /> : "—"}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-medium text-emerald-600">
                        {l.credit > 0 ? <MoneyText amount={l.credit} /> : "—"}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                        <MoneyText amount={l.balanceAfter} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer */}
          <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-end">
            <button
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
            >
              {isBn ? "বন্ধ করুন" : "Close"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
