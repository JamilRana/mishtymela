"use client";

import React, { useState } from "react";
import { Scale, Plus, Trash2, Edit2, Check, X, AlertCircle } from "lucide-react";
import { createUnitAction, updateUnitAction, deleteUnitAction } from "@/actions/units";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useHydratedLanguage } from "@/stores/language";
import { toBnDigits } from "@/lib/bangla-numbers";

interface UnitItem {
  id: string;
  name: string;
  shortName: string;
  conversionRate: number;
}

export const UnitSettingsSection: React.FC<{
  units: UnitItem[];
}> = ({ units }) => {
  const { language } = useHydratedLanguage();
  const isBn = language === "bn";

  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [conversionRate, setConversionRate] = useState("1.0");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingShortName, setEditingShortName] = useState("");
  const [editingRate, setEditingRate] = useState("1.0");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [deletingUnit, setDeletingUnit] = useState<UnitItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !shortName.trim()) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await createUnitAction({
        name: name.trim(),
        shortName: shortName.trim(),
        conversionRate: Number(conversionRate) || 1.0,
      });
      if (!res.success) {
        setError(res.error);
        return;
      }
      setName("");
      setShortName("");
      setConversionRate("1.0");
    } catch (err: any) {
      setError(err?.message || "Failed to create unit");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editingName.trim() || !editingShortName.trim()) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await updateUnitAction(id, {
        name: editingName.trim(),
        shortName: editingShortName.trim(),
        conversionRate: Number(editingRate) || 1.0,
      });
      if (!res.success) {
        setError(res.error);
        return;
      }
      setEditingId(null);
    } catch (err: any) {
      setError(err?.message || "Failed to update unit");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingUnit) return;
    setIsDeleting(true);
    setError(null);
    try {
      const res = await deleteUnitAction(deletingUnit.id);
      if (!res.success) {
        setError(res.error);
        return;
      }
      setDeletingUnit(null);
    } catch (err: any) {
      setError(err?.message || "Failed to delete unit");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-6">
        <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
          <Scale className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900">
            {isBn ? "পরিমাপের একক (Units of Measurement)" : "Units of Measurement (UOM)"}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isBn
              ? "কেজি, গ্রাম, পিস, লিটার ও রূপান্তর হার নির্ধারণ করুন"
              : "Configure measurement units (kg, gm, pcs, liter) and conversion factors"}
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
      <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-6">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={isBn ? "একক নাম (যেমন: kg)" : "Code (e.g. kg)"}
          className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
        />
        <input
          type="text"
          value={shortName}
          onChange={(e) => setShortName(e.target.value)}
          placeholder={isBn ? "লেবেল (যেমন: কেজি)" : "Label (e.g. কেজি)"}
          className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
        />
        <input
          type="number"
          step="any"
          value={conversionRate}
          onChange={(e) => setConversionRate(e.target.value)}
          placeholder={isBn ? "রূপান্তর হার (যেমন: ১.০)" : "Rate (e.g. 1.0)"}
          className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono font-medium"
        />
        <button
          type="submit"
          disabled={isSubmitting || !name.trim() || !shortName.trim()}
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          <span>{isBn ? "যোগ করুন" : "Add Unit"}</span>
        </button>
      </form>

      {/* Units List */}
      <div className="space-y-2">
        {units.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400">
            {isBn ? "কোন একক তৈরি করা হয়নি" : "No units created yet"}
          </div>
        ) : (
          units.map((u) => (
            <div
              key={u.id}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition border border-slate-100"
            >
              {editingId === u.id ? (
                <div className="flex items-center gap-2 flex-1 mr-2">
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="w-24 px-2 py-1 text-xs bg-white border border-teal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                    autoFocus
                  />
                  <input
                    type="text"
                    value={editingShortName}
                    onChange={(e) => setEditingShortName(e.target.value)}
                    className="w-28 px-2 py-1 text-xs bg-white border border-teal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                  />
                  <input
                    type="number"
                    step="any"
                    value={editingRate}
                    onChange={(e) => setEditingRate(e.target.value)}
                    className="w-24 px-2 py-1 text-xs bg-white border border-teal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono font-medium"
                  />
                  <button
                    onClick={() => handleUpdate(u.id)}
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
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-900 font-mono">{u.name}</span>
                  <span className="text-xs font-semibold px-2 py-0.5 bg-teal-100 text-teal-800 rounded-md">
                    {u.shortName}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    (x{isBn ? toBnDigits(u.conversionRate) : u.conversionRate})
                  </span>
                </div>
              )}

              {editingId !== u.id && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingId(u.id);
                      setEditingName(u.name);
                      setEditingShortName(u.shortName);
                      setEditingRate(String(u.conversionRate));
                    }}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeletingUnit(u)}
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
        open={!!deletingUnit}
        onOpenChange={(open) => !open && setDeletingUnit(null)}
        title={isBn ? "একক মুছে ফেলা নিশ্চিত করুন" : "Confirm Delete Unit"}
        description={
          isBn
            ? `আপনি কি নিশ্চিত যে "${deletingUnit?.name} (${deletingUnit?.shortName})" এককটি মুছে ফেলতে চান?`
            : `Are you sure you want to delete unit "${deletingUnit?.name} (${deletingUnit?.shortName})"?`
        }
        confirmLabel={isBn ? "মুছে ফেলুন" : "Delete"}
        variant="danger"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
};
