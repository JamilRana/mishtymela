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
  Package,
} from "lucide-react";
import { createCategory, updateCategory, deleteCategory } from "@/actions/products";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useHydratedLanguage } from "@/stores/language";
import { cn } from "@/lib/utils";

export interface CategoryWithCount {
  id: string;
  name: string;
  productCount?: number;
}

interface CategoryManagerModalProps {
  categories: CategoryWithCount[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCategoryCreated?: (newCategory: { id: string; name: string }) => void;
}

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  categories,
  open,
  onOpenChange,
  onCategoryCreated,
}) => {
  const { language } = useHydratedLanguage();
  const isBn = language === "bn";

  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Deletion state
  const [deletingCategory, setDeletingCategory] = useState<CategoryWithCount | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newCategoryName.trim();
    if (!name) return;
    setError(null);
    setIsSubmitting(true);

    try {
      const created = await createCategory(name);
      if (!created.success) {
        setError(created.error);
        return;
      }
      setNewCategoryName("");
      if (onCategoryCreated) {
        onCategoryCreated(created);
      }
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
      const res = await updateCategory(id, name);
      if (!res.success) {
        setError(res.error);
        return;
      }
      setEditingId(null);
      setEditingName("");
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
      const res = await deleteCategory(deletingCategory.id);
      if (!res.success) {
        alert(res.error);
        return;
      }
      setDeletingCategory(null);
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
          <Dialog.Overlay className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 animate-in fade-in" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-lg p-6 shadow-2xl border border-slate-200 z-50 animate-in zoom-in-95 focus:outline-none max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-md">
                  <Tags className="w-5 h-5" />
                </div>
                <div>
                  <Dialog.Title className="text-base font-semibold text-slate-900">
                    {isBn ? "মিষ্টি ও পণ্যের ক্যাটেগরি পরিচালনা" : "Manage Product Categories"}
                  </Dialog.Title>
                  <Dialog.Description className="text-xs text-slate-500">
                    {isBn ? "ক্যাটেগরি যোগ, নাম পরিবর্তন বা মুছে ফেলুন" : "Add, rename, or remove categories dynamically"}
                  </Dialog.Description>
                </div>
              </div>
              <Dialog.Close asChild>
                <button className="text-slate-400 hover:text-slate-600 p-1 rounded">
                  <X className="w-4 h-4" />
                </button>
              </Dialog.Close>
            </div>

            {error && (
              <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700 flex items-center gap-2 shrink-0">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Create New Category Input */}
            <form onSubmit={handleCreate} className="mt-4 flex gap-2 shrink-0">
              <input
                type="text"
                required
                placeholder={isBn ? "নতুন ক্যাটেগরির নাম (যেমন: রসগোল্লা, সন্দেশ, দই)..." : "New category name (e.g. Beverages, Spices, Bakery)..."}
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={isSubmitting || !newCategoryName.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-xs disabled:opacity-50 flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isBn ? "ক্যাটেগরি যোগ" : "Add Category"}</span>
              </button>
            </form>

            {/* Categories List */}
            <div className="mt-4 flex-1 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-md">
              {categories.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  {isBn ? "কোন ক্যাটেগরি তৈরি করা হয়নি।" : "No categories created yet. Add your first category above!"}
                </div>
              ) : (
                categories.map((c) => {
                  const isEditing = editingId === c.id;

                  return (
                    <div
                      key={c.id}
                      className="p-3 flex items-center justify-between gap-3 text-xs hover:bg-slate-50/70 transition-colors"
                    >
                      {isEditing ? (
                        <div className="flex-1 flex items-center gap-2">
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleUpdate(c.id);
                              if (e.key === "Escape") setEditingId(null);
                            }}
                            autoFocus
                            className="flex-1 px-2.5 py-1 text-xs bg-white border border-blue-400 rounded focus:outline-none"
                          />
                          <button
                            onClick={() => handleUpdate(c.id)}
                            disabled={isSubmitting || !editingName.trim()}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                            title="Save changes"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            <span className="font-semibold text-slate-800 truncate">
                              {c.name}
                            </span>
                            {c.productCount !== undefined && (
                              <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-medium shrink-0">
                                {c.productCount} {c.productCount === 1 ? "product" : "products"}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => {
                                setEditingId(c.id);
                                setEditingName(c.name);
                              }}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Rename category"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingCategory(c)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                              title="Delete category"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-4 mt-3 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 border border-slate-200 rounded text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                {isBn ? "বন্ধ করুন" : "Close"}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(deletingCategory)}
        onOpenChange={(open) => !open && setDeletingCategory(null)}
        title="Delete Category"
        description={`Are you sure you want to delete the category "${deletingCategory?.name}"? Any products assigned to this category will become Uncategorized.`}
        confirmLabel="Delete Category"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDelete}
      />
    </>
  );
};
