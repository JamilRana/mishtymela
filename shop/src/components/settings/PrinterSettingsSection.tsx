"use client";

import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Printer,
  Plus,
  Trash2,
  CheckCircle,
  Wifi,
  Usb,
  Bluetooth,
  Sliders,
  AlertCircle,
  Loader2,
  X,
  Play,
  KeyRound,
  ShieldCheck,
} from "lucide-react";
import {
  savePrinterSettingAction,
  deletePrinterSettingAction,
  setDefaultPrinterAction,
} from "@/actions/printers";
import { buildTestReceiptEscPos } from "@/lib/escpos";
import { useRouter } from "next/navigation";

interface PrinterSettingItem {
  id: string;
  name: string;
  connectionType: string;
  paperWidth: number;
  ipAddress?: string | null;
  port?: number | null;
  autoCut: boolean;
  openCashDrawer: boolean;
  isDefault: boolean;
}

interface PrinterSettingsSectionProps {
  printers: PrinterSettingItem[];
}

export function PrinterSettingsSection({ printers }: PrinterSettingsSectionProps) {
  const router = useRouter();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrinter, setEditingPrinter] = useState<PrinterSettingItem | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [connectionType, setConnectionType] = useState<"USB" | "BLUETOOTH" | "NETWORK">("USB");
  const [paperWidth, setPaperWidth] = useState<58 | 80>(80);
  const [ipAddress, setIpAddress] = useState("");
  const [port, setPort] = useState<number>(9100);
  const [autoCut, setAutoCut] = useState(true);
  const [openCashDrawer, setOpenCashDrawer] = useState(true);
  const [isDefault, setIsDefault] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenAdd = () => {
    setEditingPrinter(null);
    setName("");
    setConnectionType("USB");
    setPaperWidth(80);
    setIpAddress("");
    setPort(9100);
    setAutoCut(true);
    setOpenCashDrawer(true);
    setIsDefault(printers.length === 0);
    setError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: PrinterSettingItem) => {
    setEditingPrinter(p);
    setName(p.name);
    setConnectionType(p.connectionType as any);
    setPaperWidth(p.paperWidth as any);
    setIpAddress(p.ipAddress || "");
    setPort(p.port || 9100);
    setAutoCut(p.autoCut);
    setOpenCashDrawer(p.openCashDrawer);
    setIsDefault(p.isDefault);
    setError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await savePrinterSettingAction({
        id: editingPrinter?.id,
        name: name.trim(),
        connectionType,
        paperWidth,
        ipAddress: ipAddress.trim() || null,
        port,
        autoCut,
        openCashDrawer,
        isDefault,
      });

      if (!res.success) {
        setError(res.error || "Failed to save printer settings.");
        return;
      }

      setIsModalOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this printer configuration?")) return;
    try {
      await deletePrinterSettingAction(id);
      router.refresh();
    } catch (err) {
      alert("Failed to delete printer");
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultPrinterAction(id);
      router.refresh();
    } catch (err) {
      alert("Failed to set default printer");
    }
  };

  const handleTestPrint = (p: PrinterSettingItem) => {
    const bytes = buildTestReceiptEscPos({
      width: p.paperWidth as 58 | 80,
      autoCut: p.autoCut,
      openCashDrawer: p.openCashDrawer,
    });

    // Create a downloadable or printable blob simulation
    const blob = new Blob([bytes.buffer as ArrayBuffer], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `test-receipt-${p.name.toLowerCase().replace(/\s+/g, "-")}.bin`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Printer className="w-4 h-4 text-primary" />
            থার্মাল প্রিন্টার ও হার্ডওয়্যার সেটআপ (ESC/POS)
          </h3>
          <p className="text-xs text-muted-foreground">
            POS ক্যাশ কাউন্টার রসিদ প্রিন্টার, পেপার সাইজ (৫৮মিমি / ৮০মিমি) ও ক্যাশ ড্রয়ার নিয়ন্ত্রণ
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          নতুন প্রিন্টার যোগ করুন
        </button>
      </div>

      {/* Printer List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {printers.length === 0 ? (
          <div className="col-span-2 p-8 border border-dashed rounded-xl text-center text-xs text-muted-foreground">
            <Printer className="w-8 h-8 mx-auto mb-2 opacity-30" />
            কোন প্রিন্টার সেটআপ করা নেই। ডিফল্ট ব্রাউজার প্রিন্টার ব্যবহৃত হচ্ছে।
          </div>
        ) : (
          printers.map((p) => (
            <div
              key={p.id}
              className={`p-4 rounded-xl border transition-all ${
                p.isDefault
                  ? "bg-card border-primary/40 ring-1 ring-primary/20 shadow-sm"
                  : "bg-card hover:bg-muted/30"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-foreground">{p.name}</span>
                    {p.isDefault && (
                      <span className="inline-flex items-center gap-1 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-semibold border border-primary/20">
                        <CheckCircle className="w-2.5 h-2.5" /> ডিফল্ট
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      {p.connectionType === "NETWORK" ? (
                        <Wifi className="w-3.5 h-3.5 text-blue-500" />
                      ) : p.connectionType === "BLUETOOTH" ? (
                        <Bluetooth className="w-3.5 h-3.5 text-indigo-500" />
                      ) : (
                        <Usb className="w-3.5 h-3.5 text-emerald-500" />
                      )}
                      {p.connectionType}
                    </span>
                    <span>•</span>
                    <span className="font-mono font-medium">{p.paperWidth}mm Thermal</span>
                    {p.ipAddress && (
                      <>
                        <span>•</span>
                        <span className="font-mono text-[11px]">{p.ipAddress}:{p.port || 9100}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(p)}
                    className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded"
                    title="সম্পাদনা"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-muted rounded"
                    title="মুছে ফেলুন"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Hardware Features & Actions */}
              <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span className={p.autoCut ? "text-emerald-600 font-medium" : ""}>
                    {p.autoCut ? "✓ অটো-কাট সক্রিয়" : "অটো-কাট বন্ধ"}
                  </span>
                  <span>•</span>
                  <span className={p.openCashDrawer ? "text-emerald-600 font-medium" : ""}>
                    {p.openCashDrawer ? "✓ ক্যাশ ড্রয়ার কিক" : "ড্রয়ার বন্ধ"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTestPrint(p)}
                    className="px-2 py-1 text-[11px] border rounded hover:bg-muted font-medium inline-flex items-center gap-1"
                  >
                    <Play className="w-2.5 h-2.5" />
                    টেস্ট প্রিন্ট
                  </button>
                  {!p.isDefault && (
                    <button
                      onClick={() => handleSetDefault(p.id)}
                      className="px-2 py-1 text-[11px] text-primary hover:bg-primary/10 rounded font-medium"
                    >
                      ডিফল্ট করুন
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Printer Modal */}
      <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 animate-in fade-in" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] rounded-2xl bg-card p-6 shadow-2xl border">
            <div className="flex items-center justify-between pb-3 border-b mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <Dialog.Title className="text-base font-bold">
                    {editingPrinter ? "প্রিন্টার সেটিংস পরিবর্তন" : "নতুন প্রিন্টার সংযোগ"}
                  </Dialog.Title>
                  <Dialog.Description className="text-xs text-muted-foreground">
                    ESC/POS থার্মাল রিসিপ্ট প্রিন্টার কনফিগারেশন
                  </Dialog.Description>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg flex items-start gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold">প্রিন্টারের নাম (Name) *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="উদাঃ POS Counter Thermal Printer"
                  className="w-full px-3 py-1.5 border rounded-lg text-xs bg-background outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Connection Type & Paper Width */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">কানেকশন মোড:</label>
                  <select
                    value={connectionType}
                    onChange={(e) => setConnectionType(e.target.value as any)}
                    className="w-full px-3 py-1.5 border rounded-lg text-xs bg-background outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="USB">USB Cable</option>
                    <option value="BLUETOOTH">Bluetooth</option>
                    <option value="NETWORK">Network (Ethernet / WiFi)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold">কাগজের সাইজ (Paper Width):</label>
                  <select
                    value={paperWidth}
                    onChange={(e) => setPaperWidth(parseInt(e.target.value, 10) as any)}
                    className="w-full px-3 py-1.5 border rounded-lg text-xs bg-background outline-none focus:ring-2 focus:ring-primary/20 font-mono"
                  >
                    <option value={80}>80 mm (Standard)</option>
                    <option value={58}>58 mm (Compact)</option>
                  </select>
                </div>
              </div>

              {/* Network settings */}
              {connectionType === "NETWORK" && (
                <div className="grid grid-cols-3 gap-2 p-3 bg-muted/40 rounded-lg border">
                  <div className="col-span-2 space-y-1">
                    <label className="text-xs font-semibold">IP Address *</label>
                    <input
                      type="text"
                      required
                      value={ipAddress}
                      onChange={(e) => setIpAddress(e.target.value)}
                      placeholder="192.168.1.100"
                      className="w-full px-2 py-1 border rounded text-xs font-mono bg-background"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold">Port</label>
                    <input
                      type="number"
                      value={port}
                      onChange={(e) => setPort(parseInt(e.target.value, 10) || 9100)}
                      placeholder="9100"
                      className="w-full px-2 py-1 border rounded text-xs font-mono bg-background"
                    />
                  </div>
                </div>
              )}

              {/* Hardware Toggles */}
              <div className="space-y-2 pt-2 border-t text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoCut}
                    onChange={(e) => setAutoCut(e.target.checked)}
                    className="rounded border-zinc-300 text-primary"
                  />
                  <span>স্বয়ংক্রিয় পেপার কাটার সক্রিয় রাখুন (Auto-Cut Paper)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={openCashDrawer}
                    onChange={(e) => setOpenCashDrawer(e.target.checked)}
                    className="rounded border-zinc-300 text-primary"
                  />
                  <span>প্রিন্ট শেষে ক্যাশ ড্রয়ার খুলুন (Kick Drawer via RJ11)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-medium text-primary">
                  <input
                    type="checkbox"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    className="rounded border-zinc-300 text-primary"
                  />
                  <span>প্রধান বিক্রয় কাউন্টার প্রিন্টার (Default Printer) হিসেবে নির্ধারণ করুন</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={loading}
                  className="px-4 py-2 text-xs border rounded-lg hover:bg-muted font-medium"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium disabled:opacity-50"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
