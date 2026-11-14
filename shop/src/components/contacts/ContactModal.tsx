"use client";

import React, { useState, useEffect, useTransition } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, User, Phone, MapPin, Mail, DollarSign, Briefcase, AlertCircle } from "lucide-react";
import { createContactAction, updateContactAction } from "@/actions/contacts";
import { ContactType } from "@prisma/client";
import { useHydratedLanguage } from "@/stores/language";

interface ContactItem {
  id: string;
  type: ContactType;
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  openingBalance: number;
  currentDue: number;
  creditLimit?: number | null;
  monthlySalary?: number | null;
  designation?: string | null;
  active: boolean;
}

interface ContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactToEdit?: ContactItem | null;
  defaultType?: ContactType;
  onSuccess?: () => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({
  open,
  onOpenChange,
  contactToEdit,
  defaultType = "CUSTOMER",
  onSuccess,
}) => {
  const { language } = useHydratedLanguage();
  const isBn = language === "bn";
  const [isPending, startTransition] = useTransition();

  const [type, setType] = useState<ContactType>(defaultType);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [openingBalance, setOpeningBalance] = useState("0");
  const [creditLimit, setCreditLimit] = useState("");
  const [monthlySalary, setMonthlySalary] = useState("");
  const [designation, setDesignation] = useState("");
  const [active, setActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (contactToEdit) {
      setType(contactToEdit.type);
      setName(contactToEdit.name);
      setPhone(contactToEdit.phone);
      setEmail(contactToEdit.email || "");
      setAddress(contactToEdit.address || "");
      setOpeningBalance(String(contactToEdit.openingBalance));
      setCreditLimit(contactToEdit.creditLimit !== null && contactToEdit.creditLimit !== undefined ? String(contactToEdit.creditLimit) : "");
      setMonthlySalary(contactToEdit.monthlySalary !== null && contactToEdit.monthlySalary !== undefined ? String(contactToEdit.monthlySalary) : "");
      setDesignation(contactToEdit.designation || "");
      setActive(contactToEdit.active);
    } else {
      setType(defaultType);
      setName("");
      setPhone("");
      setEmail("");
      setAddress("");
      setOpeningBalance("0");
      setCreditLimit("");
      setMonthlySalary("");
      setDesignation("");
      setActive(true);
    }
    setError(null);
  }, [contactToEdit, defaultType, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError(isBn ? "অনুগ্রহ করে নাম লিখুন" : "Please enter a name");
      return;
    }
    if (!phone.trim()) {
      setError(isBn ? "অনুগ্রহ করে মোবাইল নম্বর লিখুন" : "Please enter a phone number");
      return;
    }

    startTransition(async () => {
      try {
        if (contactToEdit) {
          const res = await updateContactAction(contactToEdit.id, {
            name: name.trim(),
            phone: phone.trim(),
            email: email.trim() || undefined,
            address: address.trim() || undefined,
            creditLimit: creditLimit ? Number(creditLimit) : null,
            monthlySalary: monthlySalary ? Number(monthlySalary) : null,
            designation: designation.trim() || undefined,
            active,
          });
          if (!res.success) {
            setError(res.error);
            return;
          }
        } else {
          const res = await createContactAction({
            type,
            name: name.trim(),
            phone: phone.trim(),
            email: email.trim() || undefined,
            address: address.trim() || undefined,
            openingBalance: Number(openingBalance) || 0,
            creditLimit: creditLimit ? Number(creditLimit) : null,
            monthlySalary: monthlySalary ? Number(monthlySalary) : null,
            designation: designation.trim() || undefined,
          });
          if (!res.success) {
            setError(res.error);
            return;
          }
        }
        onOpenChange(false);
        if (onSuccess) onSuccess();
      } catch (err: any) {
        setError(err.message || "Failed to save contact");
      }
    });
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 animate-in fade-in duration-200" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
            <div>
              <Dialog.Title className="text-xl font-bold text-slate-900">
                {contactToEdit
                  ? (isBn ? "কন্টাক্ট তথ্য সংশোধন" : "Edit Contact")
                  : (isBn ? "নতুন কন্টাক্ট যোগ করুন" : "Add New Contact")}
              </Dialog.Title>
              <Dialog.Description className="text-xs text-slate-500 mt-0.5">
                {isBn
                  ? "কাস্টমার, কাঁচামাল সাপ্লাইয়ার অথবা স্টাফের প্রোফাইল তৈরি করুন"
                  : "Create or update customer, supplier or employee profiles"}
              </Dialog.Description>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Contact Type Selector (disabled on edit) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {isBn ? "কন্টাক্ট ধরণ" : "Contact Type"} *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "CUSTOMER", labelBn: "কাস্টমার", labelEn: "Customer" },
                  { value: "SUPPLIER", labelBn: "সাপ্লাইয়ার", labelEn: "Supplier" },
                  { value: "EMPLOYEE", labelBn: "কর্মচারী", labelEn: "Employee" },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    disabled={!!contactToEdit}
                    onClick={() => setType(item.value as ContactType)}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition ${
                      type === item.value
                        ? "bg-amber-600 border-amber-600 text-white shadow-sm"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    } ${contactToEdit ? "opacity-60 cursor-not-allowed" : ""}`}
                  >
                    {isBn ? item.labelBn : item.labelEn}
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isBn ? "নাম" : "Full Name"} *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={isBn ? "যেমন: আব্দুর রহিম" : "e.g. John Doe"}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isBn ? "মোবাইল নম্বর" : "Phone Number"} *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium font-mono"
                />
              </div>
            </div>

            {/* Email & Address */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isBn ? "ইমেইল (ঐচ্ছিক)" : "Email (Optional)"}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@mail.com"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isBn ? "ঠিকানা (ঐচ্ছিক)" : "Address"}
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder={isBn ? "বাজার রোড, ত্রিশাল" : "Location / Town"}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Role-specific fields */}
            {type === "CUSTOMER" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-amber-50/50 rounded-xl border border-amber-100">
                {!contactToEdit && (
                  <div>
                    <label className="block text-xs font-semibold text-amber-900 mb-1">
                      {isBn ? "পূর্বের বাকি (প্রারম্ভিক জের ৳)" : "Opening Balance (৳)"}
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={openingBalance}
                      onChange={(e) => setOpeningBalance(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2 text-sm bg-white border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono font-medium"
                    />
                  </div>
                )}
                <div className={contactToEdit ? "col-span-2" : ""}>
                  <label className="block text-xs font-semibold text-amber-900 mb-1">
                    {isBn ? "সর্বোচ্চ বাকি সীমা (Credit Limit ৳)" : "Credit Limit (৳)"}
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(e.target.value)}
                    placeholder={isBn ? "যেমন: ৫০০০" : "e.g. 5000"}
                    className="w-full px-3 py-2 text-sm bg-white border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono font-medium"
                  />
                  <span className="text-[10px] text-amber-700 mt-1 block">
                    {isBn ? "এই সীমার বেশি বাকি হলে ক্যাশিয়ার সতর্কতা পাবেন" : "Cashier gets warning if dues exceed this limit"}
                  </span>
                </div>
              </div>
            )}

            {type === "SUPPLIER" && !contactToEdit && (
              <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-100">
                <label className="block text-xs font-semibold text-blue-900 mb-1">
                  {isBn ? "সাপ্লাইয়ারকে প্রদেয় পূর্বের বাকি (৳)" : "Opening Payable to Supplier (৳)"}
                </label>
                <input
                  type="number"
                  step="any"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 text-sm bg-white border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-medium"
                />
              </div>
            )}

            {type === "EMPLOYEE" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-100">
                <div>
                  <label className="block text-xs font-semibold text-emerald-900 mb-1">
                    {isBn ? "পদবি" : "Designation"}
                  </label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 text-emerald-600 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      placeholder={isBn ? "যেমন: প্রধান মিষ্টি কারিগর" : "e.g. Sweet Maker"}
                      className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-emerald-900 mb-1">
                    {isBn ? "নির্ধারিত মাসিক বেতন (৳)" : "Monthly Salary (৳)"}
                  </label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 text-emerald-600 absolute left-3 top-3" />
                    <input
                      type="number"
                      step="any"
                      value={monthlySalary}
                      onChange={(e) => setMonthlySalary(e.target.value)}
                      placeholder={isBn ? "যেমন: ১৮০০০" : "e.g. 18000"}
                      className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-medium"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Status toggle on edit */}
            {contactToEdit && (
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="contact-active"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
                />
                <label htmlFor="contact-active" className="text-sm font-semibold text-slate-800">
                  {isBn ? "সক্রিয় কন্টাক্ট (Active Profile)" : "Active Profile"}
                </label>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
              >
                {isBn ? "বাতিল" : "Cancel"}
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
              >
                {isPending && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {contactToEdit
                  ? (isBn ? "আপডেট করুন" : "Update Contact")
                  : (isBn ? "সংরক্ষণ করুন" : "Save Contact")}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
