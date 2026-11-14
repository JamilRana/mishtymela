"use client";

import React, { useState, useMemo } from "react";
import {
  Users,
  UserCheck,
  Truck,
  Briefcase,
  Search,
  Plus,
  Phone,
  MapPin,
  BookOpen,
  Edit2,
  Trash2,
  AlertTriangle,
  Filter,
} from "lucide-react";
import { ContactType } from "@prisma/client";
import { MoneyText } from "@/components/shared/MoneyText";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useHydratedLanguage } from "@/stores/language";
import { ContactModal } from "./ContactModal";
import { ContactLedgerModal } from "./ContactLedgerModal";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { deleteContactAction } from "@/actions/contacts";
import { useRouter } from "next/navigation";

export interface ContactData {
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
  createdAt: string;
}

interface ContactDirectoryProps {
  initialContacts: ContactData[];
}

export const ContactDirectory: React.FC<ContactDirectoryProps> = ({
  initialContacts,
}) => {
  const router = useRouter();
  const { language } = useHydratedLanguage();
  const isBn = language === "bn";

  const [activeTab, setActiveTab] = useState<"ALL" | ContactType>("ALL");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [contactToEdit, setContactToEdit] = useState<ContactData | null>(null);
  const [ledgerContactId, setLedgerContactId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Filtered contacts
  const filtered = useMemo(() => {
    return initialContacts.filter((c) => {
      if (activeTab !== "ALL" && c.type !== activeTab) return false;
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesName = c.name.toLowerCase().includes(q);
        const matchesPhone = c.phone.toLowerCase().includes(q);
        const matchesDesignation = c.designation?.toLowerCase().includes(q);
        const matchesAddress = c.address?.toLowerCase().includes(q);
        if (!matchesName && !matchesPhone && !matchesDesignation && !matchesAddress) return false;
      }
      return true;
    });
  }, [initialContacts, activeTab, search]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    let customerCount = 0;
    let supplierCount = 0;
    let employeeCount = 0;
    let totalCustomerDue = 0;
    let totalSupplierPayable = 0;

    for (const c of initialContacts) {
      if (!c.active) continue;
      if (c.type === "CUSTOMER") {
        customerCount++;
        if (c.currentDue > 0) totalCustomerDue += c.currentDue;
      } else if (c.type === "SUPPLIER") {
        supplierCount++;
        if (c.currentDue > 0) totalSupplierPayable += c.currentDue;
      } else if (c.type === "EMPLOYEE") {
        employeeCount++;
      }
    }

    return {
      customerCount,
      supplierCount,
      employeeCount,
      totalCustomerDue,
      totalSupplierPayable,
    };
  }, [initialContacts]);

  const handleOpenAdd = (type?: ContactType) => {
    setContactToEdit(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (contact: ContactData) => {
    setContactToEdit(contact);
    setModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    await deleteContactAction(deleteTargetId);
    setDeleteTargetId(null);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Customers */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              {isBn ? "কাস্টমার সংখ্যা" : "Total Customers"}
            </span>
            <div className="text-2xl font-black text-slate-900">{metrics.customerCount}</div>
            <div className="text-xs font-medium text-amber-600 mt-1">
              {isBn ? "বাকি আছে: " : "Total Due: "}
              <MoneyText amount={metrics.totalCustomerDue} />
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Suppliers */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              {isBn ? "সাপ্লাইয়ার সংখ্যা" : "Total Suppliers"}
            </span>
            <div className="text-2xl font-black text-slate-900">{metrics.supplierCount}</div>
            <div className="text-xs font-medium text-blue-600 mt-1">
              {isBn ? "প্রদেয় বাকি: " : "Payable: "}
              <MoneyText amount={metrics.totalSupplierPayable} />
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Truck className="w-6 h-6" />
          </div>
        </div>

        {/* Employees */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              {isBn ? "কর্মচারী সংখ্যা" : "Active Staff"}
            </span>
            <div className="text-2xl font-black text-slate-900">{metrics.employeeCount}</div>
            <div className="text-xs font-medium text-emerald-600 mt-1">
              {isBn ? "কারিগর ও স্টাফ" : "Staff Directory"}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Briefcase className="w-6 h-6" />
          </div>
        </div>

        {/* Total Contacts */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              {isBn ? "মোট কন্টাক্টস" : "Total Profiles"}
            </span>
            <div className="text-2xl font-black text-slate-900">{initialContacts.length}</div>
            <div className="text-xs font-medium text-purple-600 mt-1">
              {isBn ? "সকল সংরক্ষিত তথ্য" : "All Directory Entries"}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Control Bar: Tabs, Search, Add Button */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: "ALL", labelBn: "সকল কন্টাক্ট", labelEn: "All Contacts" },
            { id: "CUSTOMER", labelBn: "কাস্টমার", labelEn: "Customers" },
            { id: "SUPPLIER", labelBn: "সাপ্লাইয়ার", labelEn: "Suppliers" },
            { id: "EMPLOYEE", labelBn: "কর্মচারী", labelEn: "Employees" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition ${
                activeTab === tab.id
                  ? "bg-amber-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {isBn ? tab.labelBn : tab.labelEn}
            </button>
          ))}
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isBn ? "নাম বা ফোন অনুসন্ধান..." : "Search name or phone..."}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
            />
          </div>

          <button
            onClick={() => handleOpenAdd(activeTab === "ALL" ? "CUSTOMER" : activeTab)}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>{isBn ? "নতুন কন্টাক্ট" : "Add Contact"}</span>
          </button>
        </div>
      </div>

      {/* Contacts Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <div className="text-sm font-bold text-slate-700">
              {isBn ? "কোন কন্টাক্ট পাওয়া যায়নি" : "No contacts found"}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {isBn ? "নতুন কাস্টমার বা সাপ্লাইয়ার যোগ করতে উপরের বাটনে চাপ দিন" : "Click 'Add Contact' to create one"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">{isBn ? "নাম ও পদবি" : "Name & Title"}</th>
                  <th className="py-3 px-4">{isBn ? "ধরণ" : "Type"}</th>
                  <th className="py-3 px-4">{isBn ? "মোবাইল ও ঠিকানা" : "Phone & Address"}</th>
                  <th className="py-3 px-4 text-right">
                    {isBn ? "বাকি সীমা / বেতন" : "Credit Limit / Salary"}
                  </th>
                  <th className="py-3 px-4 text-right">
                    {isBn ? "বর্তমান বাকি (৳)" : "Current Due (৳)"}
                  </th>
                  <th className="py-3 px-4 text-center">{isBn ? "স্ট্যাটাস" : "Status"}</th>
                  <th className="py-3 px-4 text-center">{isBn ? "অ্যাকশন" : "Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filtered.map((c) => {
                  const isCustomer = c.type === "CUSTOMER";
                  const isSupplier = c.type === "SUPPLIER";
                  const isEmployee = c.type === "EMPLOYEE";

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition">
                      {/* Name & Title */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-sm">{c.name}</div>
                        {c.designation && (
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Briefcase className="w-3 h-3 text-emerald-600" />
                            <span>{c.designation}</span>
                          </div>
                        )}
                      </td>

                      {/* Type Badge */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-1 text-[10px] font-bold rounded-lg ${
                            isCustomer
                              ? "bg-amber-100 text-amber-800"
                              : isSupplier
                              ? "bg-blue-100 text-blue-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {isCustomer
                            ? (isBn ? "কাস্টমার" : "Customer")
                            : isSupplier
                            ? (isBn ? "সাপ্লাইয়ার" : "Supplier")
                            : (isBn ? "কর্মচারী" : "Employee")}
                        </span>
                      </td>

                      {/* Phone & Address */}
                      <td className="py-3 px-4">
                        <div className="font-mono text-slate-800 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{c.phone}</span>
                        </div>
                        {c.address && (
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span className="truncate max-w-xs">{c.address}</span>
                          </div>
                        )}
                      </td>

                      {/* Credit Limit / Salary */}
                      <td className="py-3 px-4 text-right font-mono">
                        {isCustomer ? (
                          c.creditLimit ? (
                            <span className="text-slate-700">
                              <MoneyText amount={c.creditLimit} />
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )
                        ) : isEmployee ? (
                          c.monthlySalary ? (
                            <span className="text-emerald-700 font-semibold">
                              <MoneyText amount={c.monthlySalary} />
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Current Due */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-sm">
                        {c.currentDue > 0 ? (
                          <span className={isCustomer ? "text-red-600" : "text-blue-700"}>
                            <MoneyText amount={c.currentDue} />
                          </span>
                        ) : (
                          <span className="text-slate-400">৳০.০০</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            c.active
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-slate-100 text-slate-500 border-slate-200"
                          }`}
                        >
                          {c.active
                            ? (isBn ? "সক্রিয়" : "Active")
                            : (isBn ? "নিষ্ক্রিয়" : "Inactive")}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* View Ledger */}
                          <button
                            title={isBn ? "খাতার বিবরণী দেখুন" : "View Ledger"}
                            onClick={() => setLedgerContactId(c.id)}
                            className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition"
                          >
                            <BookOpen className="w-4 h-4" />
                          </button>

                          {/* Edit */}
                          <button
                            title={isBn ? "সংশোধন করুন" : "Edit"}
                            onClick={() => handleOpenEdit(c)}
                            className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            title={isBn ? "মুছে ফেলুন" : "Delete"}
                            onClick={() => setDeleteTargetId(c.id)}
                            className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Contact Modal (Create/Edit) */}
      <ContactModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        contactToEdit={contactToEdit}
        defaultType={activeTab === "ALL" ? "CUSTOMER" : activeTab}
        onSuccess={() => {
          router.refresh();
        }}
      />

      {/* Ledger Modal */}
      <ContactLedgerModal
        open={!!ledgerContactId}
        onOpenChange={(open) => !open && setLedgerContactId(null)}
        contactId={ledgerContactId}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTargetId}
        onOpenChange={(open) => !open && setDeleteTargetId(null)}
        title={isBn ? "কন্টাক্ট মুছে ফেলা নিশ্চিত করুন" : "Confirm Delete Contact"}
        description={
          isBn
            ? "আপনি কি নিশ্চিত যে এই কন্টাক্টটি মুছে ফেলতে চান? যদি লেনদেনের ইতিহাস থাকে, তবে এটি স্থায়ীভাবে না মুছে নিষ্ক্রিয় করা হবে।"
            : "Are you sure you want to delete this contact? If transaction history exists, it will be deactivated instead."
        }
        confirmLabel={isBn ? "মুছে ফেলুন" : "Delete"}
        variant="danger"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
};
