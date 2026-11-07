"use client";

import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Tags,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  AlertCircle,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  createTxCategoryAction,
  updateTxCategoryAction,
  deleteTxCategoryAction,
} from "@/actions/finance";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useHydratedLanguage } from "@/stores/language";
import { toBnDigits } from "@/lib/bangla-numbers";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export interface TxCategoryItem {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
  txCount?: number;
}

interface TxCategoryManagerModalProps {
  categories: TxCategoryItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: "INCOME" | "EXPENSE";
  onCategoryCreated?: (newCategory: { id: string; name: string; type: "INCOME" | "EXPENSE" }) => void;
}

export const TxCategoryManagerModal: React.FC<TxCategoryManagerModalProps> = ({
  categories,
  open,
  onOpenChange,
  defaultType = "EXPENSE",
  onCategoryCreated,
}) => {
  const router = useRouter();
  const { language } = useHydratedLanguage();
  const isBn = language === "bn";

  const [activeTab, setActiveTab] = useState<"ALL" | "EXPENSE" | "INCOME">(defaultType);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<"INCOME" | "EXPENSE">(defaultType);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Deletion state
  const [deletingCategory, setDeletingCategory] = useState<TxCategoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredCategories = categories.filter((c) => {
    if (activeTab === "ALL") return true;
    return c.type === activeTab;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await createTxCategoryAction({ name, type: newType });
      if (!res.success) {
        setError(res.error);
        return;
      }
      setNewName("");
      if (onCategoryCreated && res.id) {
        onCategoryCreated({ id: res.id, name, type: newType });
      }
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Failed to create category");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (id: string) => {
    const name = editingName.trim();
    if (!name) return;
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await updateTxCategoryAction(id, { name });
      if (!res.success) {
        setError(res.error);
        return;
      }
      setEditingId(null);
      setEditingName("");
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Failed to update category");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;
    setIsDeleting(true);
    try {
      const res = await deleteTxCategoryAction(deletingCategory.id);
      if (!res.success) {
        alert(res.error);
        return;
      }
      setDeletingCategory(null);
      router.refresh();
    } catch (err: any) {
      alert(err?.message || "Failed to delete category");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 animate-in fade-in" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 z-50 animate-in zoom-in-95 focus:outline-none flex flex-col max-h-[88vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50/60 shrink-0">
              <div className="flex items-center gap-2">
                <Tags className="w-4 h-4 text-slate-700" />
                <Dialog.Title className="text-base font-bold text-slate-900">
                  {isBn ? "আয় ও ব্যয় ক্যাটেগরি পরিচালনা" : "Manage Income & Expense Categories"}
                </Dialog.Title>
              </div>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </Dialog.Close>
            </div>

            {/* Sub-header Tabs */}
            <div className="flex items-center gap-1.5 px-5 pt-3 pb-2 border-b border-slate-100 bg-white shrink-0">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("ALL");
                  setNewType("EXPENSE");
                }}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                  activeTab === "ALL"
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {isBn ? "সকল ক্যাটেগরি" : "All"} ({isBn ? toBnDigits(categories.length) : categories.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("EXPENSE");
                  setNewType("EXPENSE");
                }}
                className={cn(
                  "inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                  activeTab === "EXPENSE"
                    ? "bg-rose-600 text-white shadow-2xs"
                    : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/50"
                )}
              >
                <TrendingDown className="w-3.5 h-3.5" />
                <span>{isBn ? "ব্যয় / খরচ" : "Expenses"}</span>
                <span className="opacity-80">
                  ({isBn ? toBnDigits(categories.filter((c) => c.type === "EXPENSE").length) : categories.filter((c) => c.type === "EXPENSE").length})
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("INCOME");
                  setNewType("INCOME");
                }}
                className={cn(
                  "inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                  activeTab === "INCOME"
                    ? "bg-emerald-600 text-white shadow-2xs"
                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/50"
                )}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{isBn ? "আয় / জমা" : "Income"}</span>
                <span className="opacity-80">
                  ({isBn ? toBnDigits(categories.filter((c) => c.type === "INCOME").length) : categories.filter((c) => c.type === "INCOME").length})
                </span>
              </button>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="mx-5 mt-3 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2 shrink-0">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Quick Add Form */}
            <form onSubmit={handleCreate} className="p-4 bg-slate-50 border-b border-slate-200 shrink-0">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="flex-1">
                  <input
                    type="text"
                    required
                    placeholder={
                      newType === "INCOME"
                        ? isBn
                          ? "নতুন আয়ের ক্যাটেগরি নাম (যেমন: কমিশন, মূলধন)..."
                          : "New income category (e.g. Commission, Capital)..."
                        : isBn
                        ? "নতুন ব্যয়ের ক্যাটেগরি নাম (যেমন: বিদ্যুৎ বিল, প্যাকেজিং)..."
                        : "New expense category (e.g. Electricity, Packaging)..."
                    }
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 font-medium"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as "INCOME" | "EXPENSE")}
                    aria-label={isBn ? "ক্যাটেগরির ধরন" : "Category Type"}
                    className="px-2.5 py-2 text-xs bg-white border border-slate-200 rounded-lg font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                  >
                    <option value="EXPENSE">{isBn ? "খরচ (Expense)" : "Expense"}</option>
                    <option value="INCOME">{isBn ? "আয় (Income)" : "Income"}</option>
                  </select>

                  <button
                    type="submit"
                    disabled={isSubmitting || !newName.trim()}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs disabled:opacity-50 transition-colors shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>{isBn ? "যোগ করুন" : "Add"}</span>
                  </button>
                </div>
              </div>
            </form>

            {/* Categories List */}
            <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100">
              {filteredCategories.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-1">
                  <Tags className="w-8 h-8 mx-auto text-slate-300 stroke-1" />
                  <p className="text-xs font-medium text-slate-500">
                    {isBn ? "কোনো ক্যাটেগরি পাওয়া যায়নি।" : "No categories found for this filter."}
                  </p>
                </div>
              ) : (
                filteredCategories.map((c) => {
                  const isEditing = editingId === c.id;
                  const isExpense = c.type === "EXPENSE";

                  return (
                    <div
                      key={c.id}
                      className="py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50/70 px-2 rounded-lg transition-colors"
                    >
                      {isEditing ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleUpdate(c.id);
                              if (e.key === "Escape") setEditingId(null);
                            }}
                            autoFocus
                            className="flex-1 px-2.5 py-1 text-xs border border-blue-500 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdate(c.id)}
                            disabled={isSubmitting || !editingName.trim()}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md"
                            title={isBn ? "সংরক্ষণ" : "Save"}
                          >
                            <Check className="w-4 h-4 stroke-[2.5]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-md"
                            title={isBn ? "বাতিল" : "Cancel"}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={cn(
                              "text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded tracking-wider shrink-0",
                              isExpense
                                ? "bg-rose-50 text-rose-700 border border-rose-200/60"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                            )}
                          >
                            {isExpense ? (isBn ? "ব্যয়" : "EXPENSE") : isBn ? "আয়" : "INCOME"}
                          </span>
                          <span className="font-bold text-slate-900 text-xs truncate">
                            {c.name}
                          </span>
                          {c.txCount !== undefined && c.txCount > 0 && (
                            <span className="text-[10px] text-slate-400 font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                              {isBn ? `${toBnDigits(c.txCount)}টি লেনদেন` : `${c.txCount} txs`}
                            </span>
                          )}
                        </div>
                      )}

                      {!isEditing && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(c.id);
                              setEditingName(c.name);
                            }}
                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title={isBn ? "সম্পাদনা" : "Edit"}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingCategory(c)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                            title={isBn ? "মুছুন" : "Delete"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500 shrink-0">
              <span>
                {isBn
                  ? `মোট ${toBnDigits(filteredCategories.length)}টি ক্যাটেগরি প্রদর্শিত`
                  : `Showing ${filteredCategories.length} categories`}
              </span>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-lg transition-colors"
              >
                {isBn ? "বন্ধ করুন" : "Close"}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(deletingCategory)}
        onOpenChange={(open) => {
          if (!open) setDeletingCategory(null);
        }}
        title={isBn ? "ক্যাটেগরি মুছে ফেলুন" : "Delete Category"}
        description={
          isBn ? (
            <>
              আপনি কি নিশ্চিতভাবে{" "}
              <strong className="text-slate-900">{deletingCategory?.name}</strong> মুছে
              ফেলতে চান? এর সাথে যুক্ত বিদ্যমান লেনদেনগুলো আনক্যাটেগোরাইজড হবে।
            </>
          ) : (
            <>
              Are you sure you want to delete category{" "}
              <strong className="text-slate-900">{deletingCategory?.name}</strong>? Any
              recorded transactions under this category will remain intact as uncategorized.
            </>
          )
        }
        confirmText={
          isDeleting
            ? isBn
              ? "মুছে ফেলা হচ্ছে..."
              : "Deleting..."
            : isBn
            ? "মুছে ফেলুন"
            : "Confirm Delete"
        }
        variant="danger"
        loading={isDeleting}
        onConfirm={handleDelete}
      />
    </>
  );
};