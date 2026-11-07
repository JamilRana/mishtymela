"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Store, Lock, Mail, AlertCircle, ArrowRight, ShieldCheck, UserCheck } from "lucide-react";
import { loginAction } from "@/actions/auth";
import { useHydratedLanguage } from "@/stores/language";
import { LanguageToggle } from "@/components/shared/LanguageToggle";
import { useRoleStore } from "@/stores/role";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from");

  const { t } = useHydratedLanguage();
  const setActiveRole = useRoleStore((s) => s.setActiveRole);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await loginAction({ email, password });
      if (!res.success) {
        setError(res.error || "Authentication failed.");
        setIsLoading(false);
        return;
      }

      // Sync client store with real session
      setActiveRole(res.user.role, res.user.name);

      // Determine destination
      let dest = "/dashboard";
      if (res.user.role === "CASHIER" || res.user.role === "STAFF") {
        dest = "/pos";
      } else if (from && !from.startsWith("/login")) {
        dest = from;
      }

      window.location.href = dest;
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred.");
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden">
      {/* Header */}
      <div className="p-8 pb-6 border-b border-slate-100 bg-gradient-to-b from-rose-50/50 to-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center text-white shadow-md shadow-rose-200">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {t("shopTitle")}
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                {t("tagline")}
              </p>
            </div>
          </div>
          <LanguageToggle />
        </div>

        <div className="mt-4">
          <h2 className="text-lg font-bold text-slate-800">{t("signInTitle")}</h2>
          <p className="text-xs text-slate-500 mt-0.5">{t("signInSubtitle")}</p>
        </div>
      </div>

      <div className="p-8 pt-6 space-y-6">
        {error && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-1.5">
              {t("emailAddress")}
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="staff@sweetshop.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-3 border border-slate-300 rounded-lg text-base text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-800 mb-1.5">
              {t("password")}
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3.5 py-3 border border-slate-300 rounded-lg text-base text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-base font-bold shadow-md shadow-rose-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {isLoading ? (
              <span>{t("signingIn")}</span>
            ) : (
              <>
                <span>{t("signInBtn")}</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        {/* Demo Accounts Pill Selector for Quick Testing */}
        <div className="pt-4 border-t border-slate-100">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-slate-500" />
            {t("demoAccounts")}
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin("owner@example.com", "admin123")}
              className="px-2.5 py-2 bg-slate-50 hover:bg-rose-50 hover:border-rose-300 border border-slate-300 rounded-md text-xs sm:text-sm font-bold text-slate-800 hover:text-rose-700 transition-all text-center truncate"
              title="owner@example.com / admin123"
            >
              Admin / Owner
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin("manager@example.com", "manager123")}
              className="px-2.5 py-2 bg-slate-50 hover:bg-rose-50 hover:border-rose-300 border border-slate-300 rounded-md text-xs sm:text-sm font-bold text-slate-800 hover:text-rose-700 transition-all text-center truncate"
              title="manager@example.com / manager123"
            >
              Manager
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin("cashier@example.com", "cashier123")}
              className="px-2.5 py-2 bg-slate-50 hover:bg-rose-50 hover:border-rose-300 border border-slate-300 rounded-md text-xs sm:text-sm font-bold text-slate-800 hover:text-rose-700 transition-all text-center truncate"
              title="cashier@example.com / cashier123"
            >
              Cashier
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-rose-50/20 to-slate-200 flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-slate-400 text-sm">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
