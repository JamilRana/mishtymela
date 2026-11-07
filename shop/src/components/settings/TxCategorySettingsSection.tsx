"use client";

import React, { useState } from "react";
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

export interface TxCategorySettingItem {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
  txCount?: number;
}

export const TxCategorySettingsSection: React.FC<{
  categories: TxCategorySettingItem[];
}> = ({ categories }) => {
  const router = useRouter();
  const { language } = useHydratedLanguage();
  const isBn = language === "bn";

  const [activeTab, setActiveTab] = useState<"ALL" | "EXPENSE" | "INCOME">("EXPENSE");
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [deletingCategory, setDeletingCategory] = useState<TxCategorySettingItem | null>(null);
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
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 mb-4 gap-2">
          <div className="flex items-center gap-2">
            <Tags className="w-4 h-4 text-slate-700" />
            <h2 className="text-sm font-bold text-slate-900">
              {isBn ? "আয় ও ব্যয় লেনদেন ক্যাটেগরি" : "Income & Expense Categories"}
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-semibold">
            {isBn
              ? `${toBnDigits(categories.length)}টি লেনদেন ক্যাটেগরি`
              : `${categories.length} transaction categories`}
          </span>
        </div>

        {/* Tab Filter */}
        <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1">
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
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
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
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{isBn ? "আয় / জমা" : "Income"}</span>
            <span className="opacity-80">
              ({isBn ? toBnDigits(categories.filter((c) => c.type === "INCOME").length) : categories.filter((c) => c.type === "INCOME").length})
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("ALL")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
              activeTab === "ALL"
                ? "bg-slate-900 text-white shadow-2xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            {isBn ? "সকল" : "All"} ({isBn ? toBnDigits(categories.length) : categories.length})
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Add Category Form */}
        <form onSubmit={handleCreate} className="mb-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            type="text"
            required
            placeholder={
              newType === "INCOME"
                ? isBn
                  ? "নতুন আয়ের খাত (যেমন: কমিশন, বিনিয়োগ, অন্যান্য আয়)..."
                  : "New income category (e.g. Commission, Investment)..."
                : isBn
                ? "নতুন খরচের খাত (যেমন: গ্যাস বিল, দোকান মেরামত, যাতায়াত)..."
                : "New expense category (e.g. Gas cylinder, Repairs)..."
            }
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/30 font-medium"
          />

          <div className="flex items-center gap-1.5">
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as "INCOME" | "EXPENSE")}
              aria-label={isBn ? "ক্যাটেগরির ধরন" : "Category Type"}
              className="px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
            >
              <option value="EXPENSE">{isBn ? "খরচ (Expense)" : "Expense"}</option>
              <option value="INCOME">{isBn ? "আয় (Income)" : "Income"}</option>
            </select>

            <button
              type="submit"
              disabled={isSubmitting || !newName.trim()}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-2xs disabled:opacity-50 transition-colors shrink-0"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{isBn ? "যোগ করুন" : "Add"}</span>
            </button>
          </div>
        </form>

        {/* Categories List */}
        <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
          {filteredCategories.length === 0 ? (
            <div className="py-8 text-center text-slate-400">
              <p className="text-xs font-medium">
                {isBn ? "কোনো ক্যাটেগরি পাওয়া যায়নি।" : "No categories found."}
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
                        className="flex-1 px-2.5 py-1 text-xs border border-blue-500 rounded-md focus:outline-none font-semibold"
                      />
                      <button
                        type="button"
                        onClick={() => handleUpdate(c.id)}
                        disabled={isSubmitting || !editingName.trim()}
                        className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                        title={isBn ? "সংরক্ষণ" : "Save"}
                      >
                        <Check className="w-4 h-4 stroke-[2.5]" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="p-1 text-slate-400 hover:bg-slate-100 rounded"
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
      </div>

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
    </div>
  );
};