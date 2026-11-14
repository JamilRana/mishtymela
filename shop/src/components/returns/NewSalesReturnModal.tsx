"use client";

import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { searchSaleForReturn, createSalesReturnAction } from "@/actions/returns";
import { MoneyText } from "@/components/shared/MoneyText";
import { RotateCcw, Search, AlertCircle, Loader2, X, CheckCircle, Package } from "lucide-react";
import { useRouter } from "next/navigation";

interface NewSalesReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Array<{ id: string; name: string; type: string }>;
  onSuccess?: () => void;
}

interface ReturnItemState {
  productId: string;
  productName: string;
  unit: string;
  availableQty: number;
  returnQty: number;
  refundRate: number;
  restocked: boolean;
}

export function NewSalesReturnModal({
  isOpen,
  onClose,
  accounts,
  onSuccess,
}: NewSalesReturnModalProps) {
  const router = useRouter();

  const [invoiceQuery, setInvoiceQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [saleData, setSaleData] = useState<any | null>(null);
  const [returnItems, setReturnItems] = useState<ReturnItemState[]>([]);
  const [accountId, setAccountId] = useState<string>(accounts[0]?.id ?? "");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleSearchInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceQuery.trim()) return;

    setSearching(true);
    setSearchError(null);
    setSaleData(null);
    setReturnItems([]);

    try {
      const res = await searchSaleForReturn(invoiceQuery.trim());
      if (!res) {
        setSearchError("কোনো সক্রিয় ইনভয়েস পাওয়া যায়নি। অনুগ্রহ করে সঠিক ইনভয়েস নম্বর দিন।");
        return;
      }
      setSaleData(res);
      setReturnItems(
        res.items.map((i: any) => ({
          productId: i.productId,
          productName: i.productName,
          unit: i.unit,
          availableQty: i.availableToReturnQuantity,
          returnQty: 0,
          refundRate: i.unitPrice,
          restocked: true,
        }))
      );
    } catch (err: any) {
      setSearchError(err?.message || "Error searching invoice");
    } finally {
      setSearching(false);
    }
  };

  const handleQtyChange = (pId: string, qty: number) => {
    setReturnItems((prev) =>
      prev.map((item) =>
        item.productId === pId
          ? { ...item, returnQty: Math.max(0, Math.min(item.availableQty, qty)) }
          : item
      )
    );
  };

  const handleRestockToggle = (pId: string, restocked: boolean) => {
    setReturnItems((prev) =>
      prev.map((item) => (item.productId === pId ? { ...item, restocked } : item))
    );
  };

  // Total refund
  const totalRefund = returnItems.reduce(
    (sum, item) => sum + item.returnQty * item.refundRate,
    0
  );

  const hasItemsToReturn = returnItems.some((i) => i.returnQty > 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);

    const itemsToSubmit = returnItems
      .filter((i) => i.returnQty > 0)
      .map((i) => ({
        productId: i.productId,
        quantity: i.returnQty,
        refundRate: i.refundRate,
        restocked: i.restocked,
      }));

    if (itemsToSubmit.length === 0) {
      setActionError("কমপক্ষে একটি পণ্যের ফেরতের পরিমাণ উল্লেখ করুন।");
      return;
    }

    if (totalRefund > 0 && !accountId) {
      setActionError("রিফান্ডের জন্য একটি পেমেন্ট অ্যাকাউন্ট নির্বাচন করুন।");
      return;
    }

    setSubmitting(true);
    try {
      const res = await createSalesReturnAction({
        saleId: saleData.id,
        items: itemsToSubmit,
        refundAmount: totalRefund,
        accountId: totalRefund > 0 ? accountId : undefined,
        reason: reason.trim() || null,
      });

      if (!res.success) {
        setActionError(res.error || "Failed to process sales return.");
        return;
      }

      onClose();
      if (onSuccess) onSuccess();
      router.refresh();
    } catch (err: any) {
      setActionError(err?.message || "Unexpected error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 animate-in fade-in" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] rounded-2xl bg-card p-6 shadow-2xl border max-h-[92vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b mb-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <Dialog.Title className="text-base font-bold">
                  নতুন বিক্রয় ফেরত গ্রহণ (New Sales Return)
                </Dialog.Title>
                <Dialog.Description className="text-xs text-muted-foreground">
                  ইনভয়েস থেকে পণ্য ফেরত গ্রহণ, স্টক সমন্বয় ও গ্রাহক রিফান্ড
                </Dialog.Description>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Invoice Search Bar */}
          <form onSubmit={handleSearchInvoice} className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="ইনভয়েস নম্বর লিখুন (উদাঃ INV-000001)..."
                value={invoiceQuery}
                onChange={(e) => setInvoiceQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border rounded-lg bg-background outline-none focus:ring-2 focus:ring-primary/20 font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={searching || !invoiceQuery.trim()}
              className="px-3.5 py-1.5 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium disabled:opacity-50 flex items-center gap-1.5"
            >
              {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              অনুসন্ধান
            </button>
          </form>

          {searchError && (
            <div className="p-3 mb-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{searchError}</span>
            </div>
          )}

          {saleData && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {actionError && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg flex items-center gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

              {/* Invoice Summary */}
              <div className="p-3 bg-muted/30 border rounded-lg text-xs grid grid-cols-3 gap-2">
                <div>
                  <span className="text-muted-foreground block">ইনভয়েস নং:</span>
                  <span className="font-mono font-bold text-foreground">{saleData.invoiceNo}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">গ্রাহক:</span>
                  <span className="font-semibold text-foreground">{saleData.customerName}</span>
                </div>
                <div className="text-right">
                  <span className="text-muted-foreground block">ইনভয়েস মূল্য:</span>
                  <span className="font-mono font-bold text-foreground">
                    <MoneyText amount={saleData.total} />
                  </span>
                </div>
              </div>

              {/* Return Items Selection Table */}
              <div className="border rounded-lg overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-muted/50 border-b text-muted-foreground font-semibold">
                    <tr>
                      <th className="py-2 px-3">পণ্য</th>
                      <th className="py-2 px-2 text-center">ফেরতযোগ্য</th>
                      <th className="py-2 px-2 text-center">ফেরত পরিমাণ</th>
                      <th className="py-2 px-2 text-center">স্টক পুনরুদ্ধার?</th>
                      <th className="py-2 px-3 text-right">রিফান্ড (৳)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {returnItems.map((item) => (
                      <tr key={item.productId} className="hover:bg-muted/20">
                        <td className="py-2 px-3">
                          <span className="font-medium text-foreground block">{item.productName}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            দর: ৳{item.refundRate} / {item.unit}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-center font-mono text-muted-foreground">
                          {item.availableQty} {item.unit}
                        </td>
                        <td className="py-2 px-2 text-center">
                          <input
                            type="number"
                            min="0"
                            max={item.availableQty}
                            step="any"
                            value={item.returnQty}
                            onChange={(e) =>
                              handleQtyChange(item.productId, parseFloat(e.target.value) || 0)
                            }
                            className="w-16 px-1.5 py-1 text-center font-mono border rounded bg-background text-xs"
                          />
                        </td>
                        <td className="py-2 px-2 text-center">
                          <label className="inline-flex items-center gap-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={item.restocked}
                              onChange={(e) =>
                                handleRestockToggle(item.productId, e.target.checked)
                              }
                              className="rounded border-zinc-300 text-primary"
                            />
                            <span className="text-[10px] text-muted-foreground">স্টকে যোগ</span>
                          </label>
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-foreground">
                          <MoneyText amount={item.returnQty * item.refundRate} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total Refund & Account */}
              <div className="p-3 bg-muted/40 rounded-lg space-y-2 text-xs border">
                <div className="flex justify-between items-center text-sm font-bold">
                  <span className="text-foreground">সর্বমোট রিফান্ড মূল্য:</span>
                  <span className="font-mono text-base text-rose-600">
                    <MoneyText amount={totalRefund} />
                  </span>
                </div>

                {totalRefund > 0 && (
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                    <div>
                      <label className="font-semibold block mb-1">রিফান্ড প্রদানের একাউন্ট:</label>
                      <select
                        value={accountId}
                        onChange={(e) => setAccountId(e.target.value)}
                        className="w-full px-2 py-1.5 border rounded bg-background text-xs"
                        required
                      >
                        {accounts.map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            {acc.name} ({acc.type})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-semibold block mb-1">ফেরতের কারণ / নোট:</label>
                      <input
                        type="text"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="উদাঃ মিষ্টির স্বাদ পরিবর্তনের অভিযোগ"
                        className="w-full px-2 py-1.5 border rounded bg-background text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="px-4 py-2 text-xs border rounded-lg hover:bg-muted font-medium"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submitting || !hasItemsToReturn}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs bg-rose-600 text-white rounded-lg hover:bg-rose-700 font-medium disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  ফেরত ও রিফান্ড সম্পন্ন করুন
                </button>
              </div>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
