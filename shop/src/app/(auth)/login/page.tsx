"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Store, Lock, Mail, AlertCircle, ArrowRight } from "lucide-react";
import { loginAction } from "@/actions/auth";
import { useHydratedLanguage } from "@/stores/language";
import { LanguageToggle } from "@/components/shared/LanguageToggle";
import { BrambleThemeToggle, BrambleStage } from "@/components/shared/BramblePrimitives";
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

  return (
    <div className="w-full max-w-md bg-white/95 dark:bg-[#0c0e18]/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-[var(--rule)] overflow-hidden z-10">
      {/* Header */}
      <div className="p-8 pb-6 border-b border-[var(--rule)] bg-[var(--well)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#5b48f0] to-[#0a93c4] flex items-center justify-center text-white shadow-md">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--ink)] tracking-tight">
                {t("shopTitle")}
              </h1>
              <p className="text-xs text-[var(--ink-3)] font-medium">
                {t("tagline")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <BrambleThemeToggle />
            <LanguageToggle />
          </div>
        </div>

        <div className="mt-4">
          <h2 className="text-lg font-bold text-[var(--ink)]">{t("signInTitle")}</h2>
          <p className="text-xs text-[var(--ink-3)] mt-0.5">{t("signInSubtitle")}</p>
        </div>
      </div>

      <div className="p-8 pt-6 space-y-6">
        {error && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-[var(--ink)] mb-1.5">
              {t("emailAddress")}
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 text-[var(--ink-3)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="staff@sweetshop.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-3 bg-[var(--well)] border border-[var(--rule)] rounded-xl text-base text-[var(--ink)] placeholder:text-[var(--ink-3)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-[var(--ink)] mb-1.5">
              {t("password")}
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-[var(--ink-3)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3.5 py-3 bg-[var(--well)] border border-[var(--rule)] rounded-xl text-base text-[var(--ink)] placeholder:text-[var(--ink-3)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-[#5b48f0] to-[#0a93c4] hover:opacity-95 text-white rounded-xl text-base font-bold shadow-md transition-opacity disabled:opacity-50 disabled:cursor-not-allowed mt-2"
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
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4 relative overflow-hidden">
      <BrambleStage />
      <Suspense fallback={<div className="text-[var(--ink-3)] text-sm">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
