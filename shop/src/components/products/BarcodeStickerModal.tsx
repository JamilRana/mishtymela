"use client";

import React, { useState, useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Barcode, Printer, X, Sparkles, AlertCircle } from "lucide-react";
import { generateBarcodeSvg } from "@/lib/barcode";
import { MoneyText } from "@/components/shared/MoneyText";

interface BarcodeStickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    name: string;
    sku: string;
    sellingPrice: number;
    unit?: string | null;
  } | null;
}

export function BarcodeStickerModal({ isOpen, onClose, product }: BarcodeStickerModalProps) {
  const printAreaRef = useRef<HTMLDivElement>(null);

  const [quantity, setQuantity] = useState<number>(12);
  const [includePrice, setIncludePrice] = useState(true);
  const [includeDate, setIncludeDate] = useState(true);
  const [mfgDate, setMfgDate] = useState(() => new Date().toISOString().slice(0, 10));

  if (!product) return null;

  const barcodeSvgString = generateBarcodeSvg(product.sku, {
    height: 32,
    moduleWidth: 1.2,
    includeText: true,
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 animate-in fade-in" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] rounded-2xl bg-card p-6 shadow-2xl border max-h-[92vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b mb-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                <Barcode className="w-5 h-5" />
              </div>
              <div>
                <Dialog.Title className="text-base font-bold">
                  বারকোড স্টিকার প্রিন্ট (Barcode Label Sheet)
                </Dialog.Title>
                <Dialog.Description className="text-xs text-muted-foreground">
                  {product.name} [{product.sku}]
                </Dialog.Description>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-lg shadow-sm hover:bg-primary/90 print:hidden font-medium"
              >
                <Printer className="w-3.5 h-3.5" />
                প্রিন্ট (Print Labels)
              </button>
              <button
                onClick={onClose}
                className="p-1.5 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Controls */}
          <div className="grid grid-cols-3 gap-3 p-3 bg-muted/40 rounded-lg text-xs mb-4 border">
            <div>
              <label className="font-semibold block mb-1">স্টিকার সংখ্যা (Quantity):</label>
              <input
                type="number"
                min="1"
                max="100"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
                className="w-full px-2 py-1 border rounded bg-background font-mono text-center"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">উৎপাদন / প্যাকিং তারিখ:</label>
              <input
                type="date"
                value={mfgDate}
                onChange={(e) => setMfgDate(e.target.value)}
                className="w-full px-2 py-1 border rounded bg-background font-mono text-xs"
              />
            </div>
            <div className="flex flex-col justify-end space-y-1">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includePrice}
                  onChange={(e) => setIncludePrice(e.target.checked)}
                  className="rounded border-zinc-300 text-primary"
                />
                <span>মূল্য প্রদর্শন করুন</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeDate}
                  onChange={(e) => setIncludeDate(e.target.checked)}
                  className="rounded border-zinc-300 text-primary"
                />
                <span>তারিখ প্রদর্শন করুন</span>
              </label>
            </div>
          </div>

          {/* Printable Labels Grid */}
          <div
            ref={printAreaRef}
            className="p-4 bg-zinc-100 dark:bg-zinc-900 rounded-lg border max-h-96 overflow-y-auto"
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Array.from({ length: Math.min(100, Math.max(1, quantity)) }).map((_, idx) => (
                <div
                  key={idx}
                  className="p-2.5 bg-white text-zinc-900 rounded border border-zinc-300 shadow-sm flex flex-col items-center justify-between text-center select-none"
                  style={{ minHeight: "110px" }}
                >
                  <div className="w-full">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                      মিষ্টি মেলা
                    </span>
                    <span className="text-xs font-bold text-zinc-900 line-clamp-1">
                      {product.name}
                    </span>
                  </div>

                  {/* Barcode SVG */}
                  <div
                    className="my-1 scale-90"
                    dangerouslySetInnerHTML={{ __html: barcodeSvgString }}
                  />

                  <div className="w-full flex items-center justify-between text-[10px] border-t border-zinc-200 pt-1 font-mono">
                    {includePrice ? (
                      <span className="font-bold text-zinc-900">
                        ৳{product.sellingPrice} {product.unit ? `/${product.unit}` : ""}
                      </span>
                    ) : (
                      <span />
                    )}
                    {includeDate && (
                      <span className="text-zinc-500">{mfgDate}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
