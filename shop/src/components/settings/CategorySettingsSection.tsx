"use client";

import React, { useState } from "react";
import { Tags, Plus, Trash2, Edit2, Check, X, AlertCircle } from "lucide-react";
import { createCategory, updateCategory, deleteCategory } from "@/actions/products";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useHydratedLanguage } from "@/stores/language";
import { toBnDigits } from "@/lib/bangla-numbers";

interface CategoryWithCount {
  id: string;
  name: string;
  productCount: number;
}

export const CategorySettingsSection: React.FC<{
  categories: CategoryWithCount[];
}> = ({ categories }) => {
  const { language } = useHydratedLanguage();
  const isBn = language === "bn";

  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [deletingCategory, setDeletingCategory] = useState<CategoryWithCount | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newCategoryName.trim();
    if (!name) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await createCategory(name);
      if (!res.success) {
        setError(res.error);
        return;
      }
      setNewCategoryName("");
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
    <div className="bg-white border border-slate-200 rounded-md p-5 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
          <div className="flex items-center gap-2">
            <Tags className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-900">
              {isBn ? "মিষ্টি ও পণ্যের ক্যাটেগরি" : "Product Categories"}
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {isBn ? `${toBnDigits(categories.length)} টি ক্যাটেগরি` : `${categories.length} ${categories.length === 1 ? "category" : "categories"}`}
          </span>
        </div>

        {error && (
          <div className="mb-3 p-2.5 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Add Category Form */}
        <form onSubmit={handleCreate} className="flex gap-2 mb-4">
          <input
            type="text"
            required
            placeholder={isBn ? "নতুন ক্যাটেগরির নাম..." : "New category name..."}
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={isSubmitting || !newCategoryName.trim()}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-xs disabled:opacity-50 flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isBn ? "যোগ করুন" : "Add"}</span>
          </button>
        </form>

        {/* Categories List */}
        <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
          {categories.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">
              {isBn ? "কোন ক্যাটেগরি তৈরি করা হয়নি।" : "No categories created yet."}
            </p>
          ) : (
            categories.map((cat) => {
              const isEditing = editingId === cat.id;

              return (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded text-xs hover:bg-slate-100/70 transition-colors"
                >
                  {isEditing ? (
                    <div className="flex items-center gap-1.5 flex-1 mr-2">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleUpdate(cat.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        autoFocus
                        className="flex-1 px-2 py-0.5 text-xs bg-white border border-blue-400 rounded focus:outline-none"
                      />
                      <button
                        onClick={() => handleUpdate(cat.id)}
                        disabled={isSubmitting || !editingName.trim()}
                        className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                        title="Save"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1 text-slate-400 hover:bg-slate-200 rounded"
                        title="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800">{cat.name}</span>
                        <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-medium">
                          {cat.productCount} {cat.productCount === 1 ? "item" : "items"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingId(cat.id);
                            setEditingName(cat.name);
                          }}
                          className="p-1 text-slate-400 hover:text-blue-600 rounded"
                          title="Rename category"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => setDeletingCategory(cat)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          title="Delete category"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(deletingCategory)}
        onOpenChange={(open) => !open && setDeletingCategory(null)}
        title="Delete Category"
        description={`Are you sure you want to delete "${deletingCategory?.name}"? Assigned products will become Uncategorized.`}
        confirmLabel="Delete Category"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDelete}
      />
    </div>
  );
};
