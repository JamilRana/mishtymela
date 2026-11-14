"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  User,
  Mail,
  Phone,
  Lock,
  Key,
  ShieldCheck,
  ShieldAlert,
  Shield,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar,
  ArrowRight,
  Store,
  LayoutDashboard,
  Check,
} from "lucide-react";
import { Role } from "@prisma/client";
import { updateSelfProfileAction, changeSelfPasswordAction } from "@/actions/profile";
import { useHydratedLanguage } from "@/stores/language";
import { useRoleStore } from "@/stores/role";
import { formatDhakaDate } from "@/components/shared/DateTimeText";

export interface ProfileUserData {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  active: boolean;
  organizationName: string;
  createdAt: string;
}

export function UserProfileView({ user }: { user: ProfileUserData }) {
  const { language, t } = useHydratedLanguage();
  const isBn = language === "bn";
  const { setActiveRole } = useRoleStore();

  // Profile Form State
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileSuccess(null);
    setProfileError(null);

    try {
      const res = await updateSelfProfileAction({
        name,
        email,
        phone,
      });

      if (res.success) {
        setProfileSuccess(
          isBn
            ? "আপনার প্রোফাইল তথ্য সফলভাবে আপডেট হয়েছে!"
            : "Your profile information has been updated successfully!"
        );
        // Sync client role store with new user name
        setActiveRole(res.user.role, res.user.name);
      } else {
        setProfileError(res.error || "Failed to update profile.");
      }
    } catch (err: any) {
      setProfileError(err?.message || "An unexpected error occurred.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPassword(true);
    setPasswordSuccess(null);
    setPasswordError(null);

    if (newPassword !== confirmPassword) {
      setPasswordError(
        isBn
          ? "নতুন পাসওয়ার্ড এবং নিশ্চিতকরণ পাসওয়ার্ড মিলছে না।"
          : "New password and confirm password do not match."
      );
      setIsSavingPassword(false);
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError(
        isBn
          ? "পাসওয়ার্ড ন্যূনতম ৬ অক্ষরের হতে হবে।"
          : "Password must be at least 6 characters long."
      );
      setIsSavingPassword(false);
      return;
    }

    try {
      const res = await changeSelfPasswordAction({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (res.success) {
        setPasswordSuccess(
          isBn
            ? "আপনার পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে!"
            : "Your password has been changed successfully!"
        );
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPasswordError(res.error || "Failed to change password.");
      }
    } catch (err: any) {
      setPasswordError(err?.message || "An unexpected error occurred.");
    } finally {
      setIsSavingPassword(false);
    }
  };

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case "ADMIN":
      case "OWNER":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
            <ShieldAlert className="w-3.5 h-3.5 text-purple-600" />
            {isBn ? "মালিক / অ্যাডমিনিস্ট্রেটর" : "Owner / Administrator"}
          </span>
        );
      case "MANAGER":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            {isBn ? "স্টোর / কিচেন ম্যানেজার" : "Store / Kitchen Manager"}
          </span>
        );
      case "CASHIER":
      case "STAFF":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            {isBn ? "পিওএস ক্যাশিয়ার" : "POS Cashier"}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header Profile Summary Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-rose-100/40 via-purple-50/20 to-transparent rounded-full blur-2xl pointer-events-none -mr-20 -mt-20" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-600 to-rose-400 text-white flex items-center justify-center font-extrabold text-2xl shadow-md shadow-rose-200 ring-4 ring-rose-50 shrink-0">
              {name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{name}</h1>
                {getRoleBadge(user.role)}
              </div>
              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {email}
                </span>
                {phone && (
                  <span className="flex items-center gap-1 font-mono">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {phone}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  {user.organizationName}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 w-full sm:w-auto">
            {user.role === "CASHIER" ? (
              <Link
                href="/pos"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
              >
                <Store className="w-4 h-4" />
                <span>{isBn ? "পিওএস কাউন্টারে যান" : "Go to POS"}</span>
              </Link>
            ) : (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>{isBn ? "ড্যাশবোর্ডে ফিরে যান" : "Back to Dashboard"}</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Update Personal Profile Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 mb-5">
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  {isBn ? "ব্যক্তিগত তথ্য আপডেট" : "Personal Information"}
                </h2>
                <p className="text-xs text-slate-500">
                  {isBn
                    ? "আপনার নাম, ইমেইল ও মোবাইল নম্বর পরিবর্তন করুন"
                    : "Update your contact name, login email, and phone number"}
                </p>
              </div>
            </div>

            {profileSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-medium">{profileSuccess}</span>
              </div>
            )}

            {profileError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="font-medium">{profileError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {isBn ? "পূর্ণ নাম (Full Name)" : "Full Name"} *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Abu Foysal Tarafdar"
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {isBn ? "ইমেইল ঠিকানা (Login Email)" : "Login Email"} *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="owner@mishtymela.com"
                      className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {isBn ? "মোবাইল নম্বর (Contact Phone)" : "Contact Phone"}
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="01671578965"
                      className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  {isSavingProfile ? (
                    <span>{isBn ? "সংরক্ষণ হচ্ছে..." : "Saving Changes..."}</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{isBn ? "তথ্য সংরক্ষণ করুন" : "Save Profile Details"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Change Password Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 mb-5">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  {isBn ? "পাসওয়ার্ড পরিবর্তন করুন" : "Change Password"}
                </h2>
                <p className="text-xs text-slate-500">
                  {isBn
                    ? "নিরাপত্তার স্বার্থে নিয়মিত শক্তিশালী পাসওয়ার্ড ব্যবহার করুন"
                    : "Update your login password to keep your sweet shop access secure"}
                </p>
              </div>
            </div>

            {passwordSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-medium">{passwordSuccess}</span>
              </div>
            )}

            {passwordError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="font-medium">{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {isBn ? "বর্তমান পাসওয়ার্ড (Current Password)" : "Current Password"} *
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {isBn ? "নতুন পাসওয়ার্ড (New Password)" : "New Password"} *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder={isBn ? "ন্যূনতম ৬ অক্ষর" : "Minimum 6 characters"}
                      className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {isBn ? "পাসওয়ার্ড নিশ্চিত করুন (Confirm Password)" : "Confirm Password"} *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={isBn ? "নতুন পাসওয়ার্ড পুনরায় লিখুন" : "Re-enter new password"}
                      className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-medium"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingPassword}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  {isSavingPassword ? (
                    <span>{isBn ? "পরিবর্তন হচ্ছে..." : "Updating Password..."}</span>
                  ) : (
                    <>
                      <Key className="w-4 h-4" />
                      <span>{isBn ? "পাসওয়ার্ড পরিবর্তন করুন" : "Update Password"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Account Details & Permissions Card */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
              {isBn ? "অ্যাকাউন্ট তথ্য" : "Account Overview"}
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                <span className="text-slate-400 font-semibold block text-xs">
                  {isBn ? "সিস্টেম রোল (System Role)" : "System Role"}
                </span>
                <span className="font-bold text-slate-800 text-sm block">
                  {user.role === "ADMIN" || user.role === "OWNER"
                    ? isBn ? "এডমিন / স্বত্বাধিকারী" : "Owner / Administrator"
                    : user.role === "MANAGER"
                    ? isBn ? "স্টোর / শাখা ম্যানেজার" : "Store Manager"
                    : isBn ? "কাউন্টার ক্যাশিয়ার" : "POS Cashier"}
                </span>
                <p className="text-xs text-slate-500 mt-1">
                  {user.role === "ADMIN" || user.role === "OWNER"
                    ? isBn
                      ? "সকল মডিউল, অর্থ হিসাব, কর্মী পরিচালনা ও দোকান কনফিগারেশনে পূর্ণ ক্ষমতা।"
                      : "Full master privileges across inventory, finance, users, and store settings."
                    : user.role === "MANAGER"
                    ? isBn
                      ? "পণ্য তালিকা, স্টক ইন-আউট ও পিওএস কাউন্টারে প্রবেশাধিকার।"
                      : "Permissions for inventory management, sweet products, and counter POS."
                    : isBn
                      ? "শুধুমাত্র পিওএস বিলিং ও ক্যাশ কাউন্টারে দ্রুত বিক্রয় করার অনুমতি।"
                      : "Access restricted to POS billing checkout counter only."}
                </p>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {isBn ? "অ্যাকাউন্ট তৈরি" : "Member Since"}
                </span>
                <span className="font-semibold text-slate-800">
                  {formatDhakaDate(new Date(user.createdAt))}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  {isBn ? "প্রতিষ্ঠান" : "Shop"}
                </span>
                <span className="font-bold text-slate-800 truncate max-w-[150px]">
                  {user.organizationName}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-emerald-50/50 rounded-lg border border-emerald-100 text-emerald-800">
                <span className="font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  {isBn ? "অ্যাকাউন্ট অবস্থা" : "Status"}
                </span>
                <span className="font-bold text-xs uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                  {isBn ? "সক্রিয়" : "Active"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
