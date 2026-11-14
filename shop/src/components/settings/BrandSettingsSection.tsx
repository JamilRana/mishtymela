"use client";

import React, { useState } from "react";
import { Award, Plus, Trash2, Edit2, Check, X, AlertCircle } from "lucide-react";
import { createBrandAction, updateBrandAction, deleteBrandAction } from "@/actions/brands";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useHydratedLanguage } from "@/stores/language";
import { toBnDigits } from "@/lib/bangla-numbers";

interface BrandItem {
  id: string;
  name: string;
}

export const BrandSettingsSection: React.FC<{
  brands: BrandItem[];
}> = ({ brands }) => {
  const { language } = useHydratedLanguage();
  const isBn = language === "bn";

  const [newBrandName, setNewBrandName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [deletingBrand, setDeletingBrand] = useState<BrandItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newBrandName.trim();
    if (!name) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await createBrandAction({ name });
      if (!res.success) {
        setError(res.error);
        return;
      }
      setNewBrandName("");
    } catch (err: any) {
      setError(err?.message || "Failed to create brand");
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
      const res = await updateBrandAction(id, { name });
      if (!res.success) {
        setError(res.error);
        return;
      }
      setEditingId(null);
    } catch (err: any) {
      setError(err?.message || "Failed to update brand");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingBrand) return;
    setIsDeleting(true);
    setError(null);
    try {
      const res = await deleteBrandAction(deletingBrand.id);
      if (!res.success) {
        setError(res.error);
        return;
      }
      setDeletingBrand(null);
    } catch (err: any) {
      setError(err?.message || "Failed to delete brand");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-6">
        <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
          <Award className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900">
            {isBn ? "পণ্য ও মিষ্টির ব্র্যান্ড" : "Brands & Manufacturers"}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isBn
              ? "পণ্য শ্রেণিবিভাগের জন্য ব্র্যান্ড তৈরি ও পরিচালনা করুন"
              : "Manage item brands and manufacturer associations"}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Add Form */}
      <form onSubmit={handleCreate} className="flex gap-2 mb-6">
        <input
          type="text"
          value={newBrandName}
          onChange={(e) => setNewBrandName(e.target.value)}
          placeholder={isBn ? "নতুন ব্র্যান্ডের নাম লিখুন..." : "Enter brand name..."}
          className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
        />
        <button
          type="submit"
          disabled={isSubmitting || !newBrandName.trim()}
          className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          <span>{isBn ? "যোগ করুন" : "Add Brand"}</span>
        </button>
      </form>

      {/* Brands List */}
      <div className="space-y-2">
        {brands.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400">
            {isBn ? "কোন ব্র্যান্ড তৈরি করা হয়নি" : "No brands created yet"}
          </div>
        ) : (
          brands.map((b) => (
            <div
              key={b.id}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition border border-slate-100"
            >
              {editingId === b.id ? (
                <div className="flex items-center gap-2 flex-1 mr-2">
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs bg-white border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                    autoFocus
                  />
                  <button
                    onClick={() => handleUpdate(b.id)}
                    disabled={isSubmitting}
                    className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="p-1.5 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <span className="text-xs font-bold text-slate-800">{b.name}</span>
              )}

              {editingId !== b.id && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingId(b.id);
                      setEditingName(b.name);
                    }}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeletingBrand(b)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <ConfirmDialog
        open={!!deletingBrand}
        onOpenChange={(open) => !open && setDeletingBrand(null)}
        title={isBn ? "ব্র্যান্ড মুছে ফেলা নিশ্চিত করুন" : "Confirm Delete Brand"}
        description={
          isBn
            ? `আপনি কি নিশ্চিত যে "${deletingBrand?.name}" ব্র্যান্ডটি মুছে ফেলতে চান?`
            : `Are you sure you want to delete brand "${deletingBrand?.name}"?`
        }
        confirmLabel={isBn ? "মুছে ফেলুন" : "Delete"}
        variant="danger"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
};
