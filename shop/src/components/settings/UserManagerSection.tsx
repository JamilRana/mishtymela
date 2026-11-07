"use client";

import React, { useState } from "react";
import {
  Users,
  UserPlus,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  X,
  Phone,
  Mail,
  User,
} from "lucide-react";
import { Role } from "@prisma/client";
import {
  createUserAction,
  updateUserAction,
  toggleUserStatusAction,
  deleteUserAction,
} from "@/actions/users";
import { useRoleStore } from "@/stores/role";
import { useHydratedLanguage } from "@/stores/language";
import { cn } from "@/lib/utils";

interface StaffUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  active: boolean;
  createdAt: string;
}

export const UserManagerSection: React.FC<{ users: StaffUser[] }> = ({
  users: initialUsers,
}) => {
  const { language } = useHydratedLanguage();
  const isBn = language === "bn";

  const [users, setUsers] = useState<StaffUser[]>(initialUsers);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<StaffUser | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Global role store for simulator
  const { activeRole, setActiveRole } = useRoleStore();

  // New User Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "CASHIER" as Role,
    password: "",
    active: true,
  });

  const [editPassword, setEditPassword] = useState("");

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      role: "CASHIER",
      password: "",
      active: true,
    });
    setError(null);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const res = await createUserAction({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      role: formData.role,
      password: formData.password,
      active: formData.active,
    });

    setIsSubmitting(false);
    if (res.success) {
      setUsers([...users, res.user]);
      setIsAddModalOpen(false);
      resetForm();
    } else {
      setError(res.error);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setIsSubmitting(true);
    setError(null);

    const res = await updateUserAction({
      id: editingUser.id,
      name: editingUser.name,
      email: editingUser.email,
      phone: editingUser.phone,
      role: editingUser.role,
      password: editPassword || undefined,
      active: editingUser.active,
    });

    setIsSubmitting(false);
    if (res.success) {
      setUsers(users.map((u) => (u.id === res.user.id ? res.user : u)));
      setEditingUser(null);
      setEditPassword("");
    } else {
      setError(res.error);
    }
  };

  const handleToggleStatus = async (user: StaffUser) => {
    const newStatus = !user.active;
    const res = await toggleUserStatusAction(user.id, newStatus);
    if (res.success) {
      setUsers(
        users.map((u) => (u.id === user.id ? { ...u, active: newStatus } : u))
      );
    } else {
      alert(res.error);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Are you sure you want to remove this staff user?")) return;
    const res = await deleteUserAction(id);
    if (res.success) {
      setUsers(users.filter((u) => u.id !== id));
    } else {
      alert(res.error);
    }
  };

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case "ADMIN":
      case "OWNER":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
            <ShieldAlert className="w-3 h-3 text-purple-600" />
            Admin / Owner
          </span>
        );
      case "MANAGER":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            <ShieldCheck className="w-3 h-3 text-blue-600" />
            Manager
          </span>
        );
      case "CASHIER":
      case "STAFF":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <Shield className="w-3 h-3 text-emerald-600" />
            POS Cashier
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-600" />
          <div>
            <h2 className="text-sm font-bold text-slate-900">Role-Based Staff Management</h2>
            <p className="text-xs text-slate-500">
              Manage cashiers, sweet production/store managers, and shop administrators
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            resetForm();
            setIsAddModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>{isBn ? "নতুন কর্মী যোগ" : "Add Staff Member"}</span>
        </button>
      </div>

      {/* Role Simulation Banner: Allows testing navigation restrictions */}
      <div className="p-3 bg-gradient-to-r from-slate-50 to-blue-50/50 border border-slate-200 rounded-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div>
          <span className="font-bold text-slate-800 block sm:inline mr-2">
            {isBn ? "বর্তমান রোল প্রিভিউ:" : "Active Preview Role:"}
          </span>
          <span className="text-slate-600 text-xs">
            {activeRole === "ADMIN" || activeRole === "OWNER"
              ? (isBn ? "সকল মডিউল উন্মুক্ত (সম্পূর্ণ সিস্টেম এক্সেস)" : "All Modules Unlocked (Full System Access)")
              : activeRole === "MANAGER"
              ? (isBn ? "শুধুমাত্র পিওএস, পণ্য ও স্টক ব্যবস্থাপনায় প্রবেশাধিকার" : "Access to POS Terminal, Products, and Inventory ONLY")
              : (isBn ? "শুধুমাত্র পিওএস কাউন্টারে প্রবেশাধিকার" : "Access to POS Terminal ONLY")}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-600 uppercase tracking-wider font-semibold">
            {isBn ? "পরীক্ষা করুন:" : "Test As:"}
          </span>
          {(["ADMIN", "MANAGER", "CASHIER"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setActiveRole(r)}
              className={cn(
                "px-2.5 py-1 rounded text-xs font-bold transition-all border",
                activeRole === r
                  ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                  : "bg-white text-slate-600 border-slate-300 hover:bg-slate-100"
              )}
            >
              {r === "ADMIN" ? (isBn ? "অ্যাডমিন" : "Admin") : r === "MANAGER" ? (isBn ? "ম্যানেজার" : "Manager") : (isBn ? "ক্যাশিয়ার" : "Cashier")}
            </button>
          ))}
        </div>
      </div>

      {/* Staff Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-md">
        <table className="w-full min-w-[600px] text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-xs tracking-wider">
            <tr>
              <th className="py-2.5 px-3">{isBn ? "কর্মীর নাম" : "Staff Member"}</th>
              <th className="py-2.5 px-3">{isBn ? "যোগাযোগ" : "Contact"}</th>
              <th className="py-2.5 px-3">{isBn ? "দায়িত্ব / রোল" : "Assigned Role"}</th>
              <th className="py-2.5 px-3">{isBn ? "অবস্থা" : "Status"}</th>
              <th className="py-2.5 px-3 text-right">{isBn ? "অ্যাকশন" : "Actions"}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-900 block leading-tight">{u.name}</span>
                      <span className="text-xs text-slate-500 font-mono mt-0.5">{u.email}</span>
                    </div>
                  </div>
                </td>
                <td className="py-2.5 px-3">
                  <span className="text-slate-600 font-mono text-xs">
                    {u.phone || "—"}
                  </span>
                </td>
                <td className="py-2.5 px-3">{getRoleBadge(u.role)}</td>
                <td className="py-2.5 px-3">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(u)}
                    className={cn(
                      "inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold transition-colors",
                      u.active
                        ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    )}
                    title="Click to toggle active status"
                  >
                    {u.active ? (
                      <>
                        <CheckCircle className="w-3 h-3 text-emerald-600" /> Active
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3 text-slate-400" /> Disabled
                      </>
                    )}
                  </button>
                </td>
                <td className="py-2.5 px-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingUser({ ...u });
                        setError(null);
                      }}
                      className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
                      title="Edit staff details"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteUser(u.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                      title="Remove staff member"
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

      {/* Role Capabilities Reference Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-2 text-xs">
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-purple-900">
            <ShieldAlert className="w-3.5 h-3.5 text-purple-600" />
            <span>Admin / Owner</span>
          </div>
          <p className="text-slate-600 text-xs leading-relaxed">
            Full system control. View financial accounts, manage bank balances, staff roles, and shop configuration.
          </p>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-blue-900">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Store / Kitchen Manager</span>
          </div>
          <p className="text-slate-600 text-xs leading-relaxed">
            Permitted access to POS Terminal, Products/Sweets Catalog, and Inventory Stock management only.
          </p>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-emerald-900">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span>Counter POS Cashier</span>
          </div>
          <p className="text-slate-600 text-xs leading-relaxed">
            Permitted access to POS Checkout Counter only. Restricted from all back-office admin and reports.
          </p>
        </div>
      </div>

      {/* Add Staff Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-blue-600" />
                Add New Staff Member
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="mb-3 p-2.5 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kamal Uddin"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-600 font-semibold block mb-1">Email (Login ID)</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. kamal@mouchaksweets.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-600 font-medium block mb-1">Contact Phone</label>
                <input
                  type="text"
                  placeholder="e.g. 017xxxxxxxx"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-600 font-semibold block mb-1">Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Minimum 6 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-600 font-semibold block mb-1">Assigned Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="CASHIER">POS Cashier (Counter Checkout Only)</option>
                  <option value="MANAGER">Store / Kitchen Manager (Inventory, Sweet Production & Reports)</option>
                  <option value="ADMIN">Administrator / Owner (Full System Control)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="active-toggle"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <label htmlFor="active-toggle" className="text-slate-700 font-medium cursor-pointer">
                  Account is Active & Permitted to Login
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 mt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md font-bold shadow-xs"
                >
                  {isSubmitting ? "Creating..." : "Create Staff"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-600" />
                Edit Staff Member
              </h3>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="mb-3 p-2.5 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleUpdateUser} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-600 font-semibold block mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-600 font-medium block mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={editingUser.phone}
                  onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-600 font-medium block mb-1">New Password (leave blank to keep current)</label>
                <input
                  type="password"
                  minLength={6}
                  placeholder="Leave empty to keep unchanged"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-600 font-semibold block mb-1">Assigned Role</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as Role })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="CASHIER">POS Cashier (Counter Checkout Only)</option>
                  <option value="MANAGER">Store / Kitchen Manager (Inventory & Reports)</option>
                  <option value="ADMIN">Administrator / Owner (Full Control)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="edit-active-toggle"
                  checked={editingUser.active}
                  onChange={(e) => setEditingUser({ ...editingUser, active: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <label htmlFor="edit-active-toggle" className="text-slate-700 font-medium cursor-pointer">
                  Account is Active
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 mt-4">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md font-bold shadow-xs"
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
