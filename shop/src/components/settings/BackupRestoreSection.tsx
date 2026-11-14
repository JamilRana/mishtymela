"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Database,
  Cloud,
  HardDriveDownload,
  UploadCloud,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  FileJson,
  Download,
  AlertCircle,
  Server,
  Zap,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  createDatabaseBackupAction,
  listDatabaseBackupsAction,
  deleteBackupAction,
  restoreDatabaseBackupAction,
} from "@/actions/backup";
import { useHydratedLanguage } from "@/stores/language";
import { toBnDigits } from "@/lib/bangla-numbers";

interface BackupItem {
  url: string;
  pathname: string;
  filename: string;
  sizeBytes: number;
  sizeFormatted: string;
  uploadedAt: string;
}

export function BackupRestoreSection() {
  const { language } = useHydratedLanguage();
  const isBn = language === "bn";

  const [loading, setLoading] = useState(false);
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [blobConfigured, setBlobConfigured] = useState(true);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  // Restore Modal State
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [selectedBackupForRestore, setSelectedBackupForRestore] = useState<{
    filename: string;
    url?: string;
    jsonString?: string;
  } | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch available backups from Vercel Blob
  const fetchBackups = async () => {
    try {
      const res = await listDatabaseBackupsAction();
      if (res.success) {
        setBackups(res.backups || []);
        setBlobConfigured(res.blobConfigured);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  // 1. Create Backup Now
  const handleCreateBackup = async () => {
    setLoading(true);
    setStatusMessage(null);

    try {
      const res = await createDatabaseBackupAction();
      if (!res.success || !res.backup) {
        throw new Error("Failed to generate backup");
      }

      // Trigger automatic browser file download
      const blob = new Blob([res.backup.jsonContent], { type: "application/json" });
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = res.backup.filename.replace("backups/", "");
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      setStatusMessage({
        type: "success",
        text: isBn
          ? `সফলভাবে ব্যাকআপ সম্পন্ন হয়েছে (${res.backup.sizeFormatted})। ফাইলটি ডাউনলোড হয়েছে${
              res.backup.url ? " এবং Vercel Blob ক্লাউডে সংরক্ষিত হয়েছে" : ""
            }।`
          : `Backup successfully created (${res.backup.sizeFormatted}). File downloaded${
              res.backup.url ? " and saved to Vercel Blob Storage" : ""
            }.`,
      });

      // Refresh cloud list
      await fetchBackups();
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err?.message || (isBn ? "ব্যাকআপ তৈরি ব্যর্থ হয়েছে" : "Failed to create backup"),
      });
    } finally {
      setLoading(false);
    }
  };

  // 2. Upload file from PC
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setSelectedBackupForRestore({
        filename: file.name,
        jsonString: content,
      });
      setRestoreModalOpen(true);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // 3. Confirm and Execute Restore
  const handleConfirmRestore = async () => {
    if (!selectedBackupForRestore) return;

    setIsRestoring(true);
    setStatusMessage(null);

    try {
      const res = await restoreDatabaseBackupAction({
        jsonString: selectedBackupForRestore.jsonString,
        backupUrl: selectedBackupForRestore.url,
      });

      if (!res.success) {
        throw new Error("Restore failed");
      }

      setStatusMessage({
        type: "success",
        text: isBn
          ? `ডাটাবেস সফলভাবে রিস্টোর করা হয়েছে! (${new Date().toLocaleTimeString("bn-BD")})`
          : `Database successfully restored! (${new Date().toLocaleTimeString()})`,
      });
      setRestoreModalOpen(false);
      setSelectedBackupForRestore(null);

      // Reload page after 1.5s to refresh all navigation and stores
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err?.message || (isBn ? "রিস্টোর ব্যর্থ হয়েছে" : "Restore failed"),
      });
    } finally {
      setIsRestoring(false);
    }
  };

  // 4. Delete Backup
  const handleDeleteBackup = async (url: string) => {
    if (!confirm(isBn ? "আপনি কি নিশ্চিত এই ব্যাকআপটি মুছে ফেলতে চান?" : "Are you sure you want to delete this backup?")) {
      return;
    }

    try {
      await deleteBackupAction(url);
      setBackups((prev) => prev.filter((b) => b.url !== url));
      setStatusMessage({
        type: "info",
        text: isBn ? "ব্যাকআপ ফাইলটি মুছে ফেলা হয়েছে।" : "Backup deleted.",
      });
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err?.message || "Failed to delete backup",
      });
    }
  };

  return (
    <div className="bramble-card p-6 space-y-6">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--rule)]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-[#5b48f0] to-[#0a93c4] text-white shadow-xs">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[var(--ink)] tracking-tight">
              {isBn ? "ডাটাবেস ব্যাকআপ ও রিস্টোর" : "Database Backup & Disaster Recovery"}
            </h2>
            <p className="text-xs text-[var(--ink-3)]">
              {isBn
                ? "Neon PostgreSQL ও Vercel Blob ফ্রি টিয়ার উপযোগী স্বয়ংক্রিয় ও সুরক্ষিত ব্যাকআপ"
                : "Automated daily cloud backups & instant one-click restores optimized for Vercel & Neon Free Tier"}
            </p>
          </div>
        </div>

        {/* Free Tier Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="bramble-tag good text-[11px] font-semibold py-1 px-2.5">
            <Server className="w-3.5 h-3.5" />
            <span>Neon DB Free Tier</span>
          </span>
          <span className={`bramble-tag ${blobConfigured ? "info" : "plain"} text-[11px] font-semibold py-1 px-2.5`}>
            <Cloud className="w-3.5 h-3.5" />
            <span>{blobConfigured ? "Vercel Blob 1GB Free" : "Blob Ready"}</span>
          </span>
        </div>
      </div>

      {/* Status Alert Banner */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 animate-in fade-in ${
            statusMessage.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200"
              : statusMessage.type === "error"
              ? "bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-200"
              : "bg-blue-500/10 border-blue-500/30 text-blue-800 dark:text-blue-200"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          )}
          <span className="font-medium leading-relaxed">{statusMessage.text}</span>
        </div>
      )}

      {/* Informational Service Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-[var(--well)] border border-[var(--rule)] flex items-start gap-3">
          <Clock className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-[var(--ink)]">
              {isBn ? "দৈনিক স্বয়ংক্রিয় ব্যাকআপ" : "Daily Automated Cron"}
            </h4>
            <p className="text-[11px] text-[var(--ink-3)] mt-0.5">
              {isBn
                ? "প্রতিদিন রাত ৩:০০ টায় Vercel Cron-এর মাধ্যমে সম্পূর্ণ ব্যাকআপ তৈরি হয়।"
                : "Runs daily at 03:00 AM (Dhaka) via Vercel Cron into Blob Storage."}
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[var(--well)] border border-[var(--rule)] flex items-start gap-3">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-[var(--ink)]">
              {isBn ? "৩০ দিনের ব্যাকআপ সংরক্ষণ" : "30-Day Retention"}
            </h4>
            <p className="text-[11px] text-[var(--ink-3)] mt-0.5">
              {isBn
                ? "ফ্রি টিয়ার স্টোরেজ নিরাপদ রাখতে ৩০ দিনের বেশি পুরনো ব্যাকআপ নিজে থেকেই পরিষ্কার হয়।"
                : "Auto-prunes backups older than 30 days to strictly fit in Vercel 1GB Free quota."}
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[var(--well)] border border-[var(--rule)] flex items-start gap-3">
          <HardDriveDownload className="w-4 h-4 text-[var(--accent-2)] shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-[var(--ink)]">
              {isBn ? "লোকাল ও ক্লাউড রিস্টোর" : "Local & Cloud Restore"}
            </h4>
            <p className="text-[11px] text-[var(--ink-3)] mt-0.5">
              {isBn
                ? "ক্লাউড থেকে অথবা আপনার কম্পিউটার থেকে যেকোনো ফাইল এক ক্লিকে রিস্টোর করা যায়।"
                : "Restore directly from Vercel Blob cloud snapshots or upload any JSON file."}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons Bar */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          type="button"
          onClick={handleCreateBackup}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#5b48f0] to-[#0a93c4] hover:opacity-95 text-white text-xs font-bold shadow-xs transition-opacity disabled:opacity-50"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Cloud className="w-4 h-4" />
          )}
          <span>{isBn ? "এখনই ক্লাউড ব্যাকআপ নিন ও ডাউনলোড করুন" : "Create Cloud Backup & Download"}</span>
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={loading || isRestoring}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--well)] hover:bg-[var(--hover)] border border-[var(--rule)] text-xs font-semibold text-[var(--ink)] transition-colors disabled:opacity-50"
        >
          <UploadCloud className="w-4 h-4 text-[var(--ink-2)]" />
          <span>{isBn ? "কম্পিউটার থেকে ফাইল আপলোড করে রিস্টোর" : "Upload File & Restore"}</span>
        </button>

        <button
          type="button"
          onClick={fetchBackups}
          className="p-2.5 rounded-xl bg-[var(--well)] hover:bg-[var(--hover)] border border-[var(--rule)] text-[var(--ink-3)] hover:text-[var(--ink)] transition-colors ml-auto"
          title={isBn ? "তালিকা রিফ্রেশ করুন" : "Refresh List"}
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Cloud Backups Table */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-[var(--ink)] uppercase tracking-wider">
            {isBn ? "Vercel Blob ক্লাউড ব্যাকআপ তালিকা" : "Available Cloud Backups (Vercel Blob)"}
          </h3>
          <span className="text-[11px] text-[var(--ink-3)] font-mono">
            {isBn ? `মোট: ${toBnDigits(backups.length)}টি ব্যাকআপ` : `Total: ${backups.length} snapshots`}
          </span>
        </div>

        {backups.length === 0 ? (
          <div className="py-8 text-center rounded-xl bg-[var(--well)] border border-[var(--rule)] text-xs text-[var(--ink-3)]">
            <FileJson className="w-8 h-8 mx-auto mb-2 opacity-40 text-[var(--ink-3)]" />
            <p className="font-medium">
              {blobConfigured
                ? isBn
                  ? "এখনও কোনো ক্লাউড ব্যাকআপ ফাইল নেই। 'এখনই ক্লাউড ব্যাকআপ নিন' বাটনে ক্লিক করুন।"
                  : "No cloud snapshots found yet. Click 'Create Cloud Backup & Download' to generate one."
                : isBn
                ? "Vercel Blob টোকেন কনফিগার করা হলে এখানে স্বয়ংক্রিয় ক্লাউড ব্যাকআপ জমা হবে। আপনি যেকোনো সময় লোকাল ফাইল ডাউনলোড ও রিস্টোর করতে পারবেন।"
                : "Vercel Blob storage is not yet connected. Local download & file-based restore remain 100% functional."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[var(--rule)] bg-[var(--well)]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--rule)] text-[var(--ink-3)] font-semibold">
                  <th className="py-2.5 px-3">{isBn ? "ফাইলের নাম" : "Snapshot File"}</th>
                  <th className="py-2.5 px-3">{isBn ? "তারিখ ও সময়" : "Created At"}</th>
                  <th className="py-2.5 px-3">{isBn ? "সাইজ" : "Size"}</th>
                  <th className="py-2.5 px-3 text-right">{isBn ? "অ্যাকশন" : "Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--rule)]">
                {backups.map((b) => (
                  <tr key={b.url} className="hover:bg-[var(--hover)] transition-colors">
                    <td className="py-2.5 px-3 font-mono text-[11px] font-semibold text-[var(--ink)] flex items-center gap-2">
                      <FileJson className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                      <span className="truncate max-w-[220px] sm:max-w-xs">{b.filename}</span>
                    </td>
                    <td className="py-2.5 px-3 text-[var(--ink-2)] tabular-nums">
                      {new Date(b.uploadedAt).toLocaleString(isBn ? "bn-BD" : "en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-[var(--ink-3)]">
                      {b.sizeFormatted}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={b.url}
                          download
                          className="p-1.5 rounded-lg bg-[var(--sheet-solid)] hover:bg-[var(--hover)] border border-[var(--rule)] text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors"
                          title={isBn ? "ডাউনলোড" : "Download"}
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedBackupForRestore({
                              filename: b.filename,
                              url: b.url,
                            });
                            setRestoreModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[var(--accent-soft)] hover:opacity-90 text-[var(--accent)] text-[11px] font-bold transition-opacity"
                        >
                          {isBn ? "রিস্টোর" : "Restore"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteBackup(b.url)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                          title={isBn ? "মুছে ফেলুন" : "Delete"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Safety Confirmation Dialog for Restore */}
      <Dialog.Root open={restoreModalOpen} onOpenChange={setRestoreModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 animate-in fade-in" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-[#0c0e18] rounded-2xl p-6 shadow-2xl border border-[var(--rule-strong)] z-50 animate-in zoom-in-95 focus:outline-none text-xs text-[var(--ink)]">
            <div className="flex items-center gap-3 pb-3 border-b border-[var(--rule)]">
              <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--ink)]">
                  {isBn ? "ব্যাকআপ রিস্টোর নিশ্চিতকরণ" : "Confirm Database Restore"}
                </h3>
                <p className="text-[11px] text-[var(--ink-3)] font-mono truncate max-w-[260px]">
                  {selectedBackupForRestore?.filename}
                </p>
              </div>
            </div>

            <div className="py-4 space-y-3">
              <p className="text-xs text-[var(--ink-2)] leading-relaxed">
                {isBn
                  ? "সতর্কতা: ব্যাকআপ রিস্টোর করলে বর্তমান লেনদেন খাতা ও স্টক এই ব্যাকআপের অবস্থার সাথে হুবহু সমন্বয় হবে। প্রক্রিয়া চলাকালীন কোনো ডাটা যাতে ক্ষতিগ্রস্ত না হয় সেজন্য এটি একটি নিরাপদ ট্রানজাকশনে সম্পন্ন হবে।"
                  : "Warning: Restoring this snapshot will sync all sales, orders, and inventory tables back to the exact state saved in this backup. All operations run in an atomic database transaction."}
              </p>

              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-100 text-[11px]">
                <strong>{isBn ? "পরামর্শ:" : "Tip:"}</strong>{" "}
                {isBn
                  ? "রিস্টোর করার আগে বর্তমান ডাটার একটি নতুন ব্যাকআপ ডাউনলোড করে নেওয়া নিরাপদ।"
                  : "We recommend creating an instant backup of the current state before proceeding."}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--rule)]">
              <button
                type="button"
                onClick={() => setRestoreModalOpen(false)}
                disabled={isRestoring}
                className="px-4 py-2 rounded-xl border border-[var(--rule)] text-[var(--ink-2)] hover:bg-[var(--well)] transition-colors font-medium text-xs disabled:opacity-50"
              >
                {isBn ? "বাতিল" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={handleConfirmRestore}
                disabled={isRestoring}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-colors disabled:opacity-50"
              >
                {isRestoring ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{isBn ? "রিস্টোর হচ্ছে..." : "Restoring..."}</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    <span>{isBn ? "হ্যাঁ, রিস্টোর করুন" : "Confirm Restore"}</span>
                  </>
                )}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
