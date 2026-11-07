"use client";

import React, { useState, useEffect } from "react";
import { Building2, Save, CheckCircle2, AlertCircle, Phone, MapPin, Mail, ReceiptText, ShieldCheck } from "lucide-react";
import { updateOrganizationAction } from "@/actions/organization";
import { useOrganizationStore } from "@/stores/organization";
import { useHydratedLanguage } from "@/stores/language";

interface OrganizationData {
  id: string;
  name: string;
  currency: string;
  timezone: string;
  address: string;
  phone: string;
  email: string;
  vatNumber: string;
  receiptFooter: string;
}

export const ShopProfileSection: React.FC<{ organization: OrganizationData }> = ({
  organization,
}) => {
  const { setShopInfo } = useOrganizationStore();
  const { t, language } = useHydratedLanguage();

  const [formData, setFormData] = useState({
    name: organization.name || "",
    phone: organization.phone || "",
    email: organization.email || "",
    address: organization.address || "",
    vatNumber: organization.vatNumber || "",
    receiptFooter: organization.receiptFooter || "",
    currency: organization.currency || "BDT",
    timezone: organization.timezone || "Asia/Dhaka",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    // Sync initial server data into client organization store
    setShopInfo(organization);
  }, [organization, setShopInfo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);

    const res = await updateOrganizationAction({
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      address: formData.address,
      vatNumber: formData.vatNumber,
      receiptFooter: formData.receiptFooter,
      currency: formData.currency,
      timezone: formData.timezone,
    });

    setIsSaving(false);
    if (res.success) {
      setShopInfo(res.organization);
      setStatusMessage({
        type: "success",
        text: language === "bn"
          ? "দোকানের তথ্য সফলভাবে আপডেট হয়েছে! সকল ইনভয়েস, পিওএস রশিদ ও হেডারে পরিবর্তনটি কার্যকর করা হয়েছে।"
          : "Shop profile updated successfully! Changes have taken effect on all invoices, receipts, and headers.",
      });
      setTimeout(() => setStatusMessage(null), 5000);
    } else {
      setStatusMessage({ type: "error", text: res.error });
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 mb-4">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-blue-600" />
          <div>
            <h2 className="text-sm font-bold text-slate-900">{t("shopProfileTitle")}</h2>
            <p className="text-xs text-slate-500">{t("shopProfileSubtitle")}</p>
          </div>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`mb-4 p-3 rounded-md text-xs flex items-center gap-2 animate-in fade-in ${
            statusMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
        {/* Shop Name */}
        <div>
          <label className="text-slate-600 font-semibold block mb-1">
            {t("shopNameLabel")} <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder={language === "bn" ? "যেমন: মিষ্টি মেলা" : "e.g. Mishty Mela"}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Contact Phone & Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-slate-600 font-medium block mb-1 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>{t("phoneLabel")}</span>
            </label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder={language === "bn" ? "যেমন: ০১৭১১-২৩৪৫৬৭" : "e.g. 01711-234567"}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 tabular-nums"
            />
          </div>

          <div>
            <label className="text-slate-600 font-medium block mb-1 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>{t("emailLabel")}</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="e.g. info@mouchaksweets.com"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Full Address */}
        <div>
          <label className="text-slate-600 font-medium block mb-1 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>{t("addressLabel")}</span>
          </label>
          <textarea
            rows={2}
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder={language === "bn" ? "যেমন: ১২/এ সাতমসজিদ রোড, ধানমন্ডি, ঢাকা-১২০৯" : "e.g. 12/A Satmasjid Road, Dhanmondi, Dhaka-1209"}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* VAT / BIN & Currency */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-slate-600 font-medium block mb-1 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
              <span>{t("vatLabel")}</span>
            </label>
            <input
              type="text"
              value={formData.vatNumber}
              onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value })}
              placeholder="e.g. BIN-002938471-0101"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
            />
          </div>

          <div>
            <label className="text-slate-600 font-medium block mb-1">
              {language === "bn" ? "মুদ্রা ও টাইমজোন" : "Currency & Timezone"}
            </label>
            <input
              disabled
              type="text"
              value="BDT (৳) • Asia/Dhaka (বাংলাদেশ মান সময়)"
              className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-md text-slate-600 cursor-not-allowed font-medium"
            />
          </div>
        </div>

        {/* Receipt Thermal Footer */}
        <div>
          <label className="text-slate-600 font-medium block mb-1 flex items-center gap-1.5">
            <ReceiptText className="w-3.5 h-3.5 text-slate-400" />
            <span>{t("receiptFooterLabel")}</span>
          </label>
          <input
            type="text"
            value={formData.receiptFooter}
            onChange={(e) => setFormData({ ...formData, receiptFooter: e.target.value })}
            placeholder={language === "bn" ? "যেমন: স্বাদে ও ঐতিহ্যে অনন্য • সাথে থাকার জন্য ধন্যবাদ!" : "e.g. Thank you for sharing the sweetness with us!"}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
          />
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white rounded-md text-xs font-bold shadow-xs transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? t("saving") : t("save")}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
