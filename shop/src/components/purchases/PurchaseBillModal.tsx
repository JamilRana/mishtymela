"use client";

import React, { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Printer, Truck, Calendar, Hash, FileText } from "lucide-react";
import { getPurchaseById } from "@/actions/purchases";
import { MoneyText } from "@/components/shared/MoneyText";
import { DateTimeText } from "@/components/shared/DateTimeText";
import { useHydratedLanguage } from "@/stores/language";
import { toBnDigits } from "@/lib/bangla-numbers";

interface PurchaseBillModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchaseId: string | null;
}

export const PurchaseBillModal: React.FC<PurchaseBillModalProps> = ({
  open,
  onOpenChange,
  purchaseId,
}) => {
  const { language } = useHydratedLanguage();
  const isBn = language === "bn";

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (open && purchaseId) {
      setLoading(true);
      getPurchaseById(purchaseId)
        .then((res) => setData(res))
        .finally(() => setLoading(false));
    } else {
      setData(null);
    }
  }, [open, purchaseId]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 animate-in fade-in duration-200" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4 print:hidden">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <Dialog.Title className="text-lg font-bold text-slate-900">
                  {isBn ? "ক্রয় চালান ও বিল বিবরণী" : "Purchase Bill Details"}
                </Dialog.Title>
                <Dialog.Description className="text-xs text-slate-500 mt-0.5 font-mono">
                  {data?.billNo}
                </Dialog.Description>
              </div>
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

          {/* Printable Area */}
          <div className="flex-1 overflow-y-auto space-y-4 text-xs">
            {loading ? (
              <div className="p-12 text-center text-slate-500">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                {isBn ? "বিল লোড হচ্ছে..." : "Loading bill..."}
              </div>
            ) : !data ? (
              <div className="p-8 text-center text-slate-500">
                {isBn ? "বিলের তথ্য পাওয়া যায়নি" : "Bill not found"}
              </div>
            ) : (
              <div>
                {/* Supplier & Bill Info Card */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      {isBn ? "সাপ্লাইয়ার বিবরণ" : "Supplier Information"}
                    </span>
                    <div className="font-bold text-slate-900 text-sm mt-0.5">{data.supplierName}</div>
                    <div className="font-mono text-slate-600 mt-0.5">{data.supplierPhone}</div>
                    {data.supplierAddress && <div className="text-slate-500">{data.supplierAddress}</div>}
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      {isBn ? "চালান নম্বর ও তারিখ" : "Bill Details"}
                    </span>
                    <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">#{data.billNo}</div>
                    <div className="text-slate-600 mt-0.5 font-mono">
                      <DateTimeText date={data.receivedDate} showTime={false} />
                    </div>
                    {data.note && <div className="text-slate-500 mt-1 italic font-sans">{data.note}</div>}
                  </div>
                </div>

                {/* Items Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden mb-4">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">{isBn ? "পণ্য / কাঁচামাল" : "Item / Raw Material"}</th>
                        <th className="py-2.5 px-3 text-right">{isBn ? "পরিমাণ" : "Qty"}</th>
                        <th className="py-2.5 px-3 text-right">{isBn ? "দর (৳)" : "Rate (৳)"}</th>
                        <th className="py-2.5 px-3 text-right">{isBn ? "মোট (৳)" : "Total (৳)"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {data.items.map((it: any, idx: number) => (
                        <tr key={it.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3 text-slate-400 font-mono">
                            {isBn ? toBnDigits(idx + 1) : idx + 1}
                          </td>
                          <td className="py-2 px-3 text-slate-900 font-semibold">
                            {it.productName}
                            {it.batchNo && (
                              <span className="text-[10px] text-slate-400 font-mono block">
                                Batch: {it.batchNo}
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-right font-mono">
                            {isBn ? toBnDigits(it.quantity) : it.quantity} {it.unit}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-slate-600">
                            <MoneyText amount={it.unitCost} />
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                            <MoneyText amount={it.lineTotal} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Financial Summary */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5 max-w-xs ml-auto text-xs">
                  <div className="flex justify-between py-0.5">
                    <span className="text-slate-500">{isBn ? "সাবটোটাল:" : "Subtotal:"}</span>
                    <span className="font-mono font-bold text-slate-800">
                      <MoneyText amount={data.subtotal} />
                    </span>
                  </div>

                  {data.taxAmount > 0 && (
                    <div className="flex justify-between py-0.5 text-slate-600">
                      <span>{isBn ? "ভ্যাট/ট্যাক্স (+):" : "Tax (+):"}</span>
                      <span className="font-mono">
                        <MoneyText amount={data.taxAmount} />
                      </span>
                    </div>
                  )}

                  {data.discount > 0 && (
                    <div className="flex justify-between py-0.5 text-emerald-700">
                      <span>{isBn ? "মূল্যছাড় (-):" : "Discount (-):"}</span>
                      <span className="font-mono">
                        <MoneyText amount={data.discount} />
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between py-1 border-t-2 border-slate-300 font-bold text-sm text-slate-900">
                    <span>{isBn ? "মোট বিল:" : "Total Bill:"}</span>
                    <span className="font-mono">
                      <MoneyText amount={data.total} />
                    </span>
                  </div>

                  <div className="flex justify-between py-0.5 text-emerald-700 font-semibold">
                    <span>{isBn ? "পরিশোধকৃত টাকা:" : "Paid:"}</span>
                    <span className="font-mono">
                      <MoneyText amount={data.paid} />
                    </span>
                  </div>

                  {data.due > 0 && (
                    <div className="flex justify-between py-1 text-red-700 font-bold bg-red-50 p-1.5 rounded-lg border border-red-100">
                      <span>{isBn ? "বাকি (Due):" : "Due Balance:"}</span>
                      <span className="font-mono">
                        <MoneyText amount={data.due} />
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
