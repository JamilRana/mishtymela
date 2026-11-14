"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, User, LogOut } from "lucide-react";
import { formatDhakaDate } from "./DateTimeText";
import { useHydratedRole } from "@/stores/role";
import { useHydratedLanguage } from "@/stores/language";
import { useHydratedOrganization } from "@/stores/organization";
import { LanguageToggle } from "./LanguageToggle";
import { SmartAlertsPopover } from "./SmartAlertsPopover";
import { BrambleThemeToggle } from "./BramblePrimitives";
import { getCurrentSessionAction, logoutAction } from "@/actions/auth";
import { getOrganizationAction } from "@/actions/organization";

export const PosShell: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [time, setTime] = useState<Date | null>(null);
  const { activeRole, activeUserName, setActiveRole } = useHydratedRole();
  const { t } = useHydratedLanguage();
  const { shopInfo, setShopInfo } = useHydratedOrganization();
  const shopName = shopInfo.name;

  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    getCurrentSessionAction().then((session) => {
      if (session) {
        setActiveRole(session.role, session.name);
      }
    });
    getOrganizationAction().then((org) => {
      if (org) {
        setShopInfo(org);
      }
    });
  }, [setActiveRole, setShopInfo]);

  const handleLogout = async () => {
    await logoutAction();
    window.location.href = "/login";
  };

  return (
    <div className="h-[100dvh] flex flex-col bg-[var(--bg)] text-[var(--ink)] overflow-hidden select-none">
      {/* POS Top Bar */}
      <header className="h-12 sm:h-13 bg-white/95 dark:bg-[#0c0e18]/95 backdrop-blur-xl border-b border-[var(--rule)] text-[var(--ink)] px-3 sm:px-4 flex items-center justify-between shrink-0 shadow-xs z-30">
        <div className="flex items-center gap-2 sm:gap-4">
          {activeRole !== "CASHIER" && (
            <Link
              href="/dashboard"
              className="flex items-center gap-1 text-xs text-[var(--ink-2)] hover:text-[var(--ink)] bg-[var(--well)] hover:bg-[var(--hover)] border border-[var(--rule)] px-2.5 py-1.5 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden xs:inline" suppressHydrationWarning>
                {t("back")}
              </span>
            </Link>
          )}
          {activeRole !== "CASHIER" && <div className="h-4 w-px bg-[var(--rule)] hidden xs:block" />}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span
              className="font-bold text-sm sm:text-base text-[var(--ink)] tracking-tight truncate max-w-[150px] sm:max-w-none"
              suppressHydrationWarning
            >
              {shopName || t("shopTitle")}
            </span>
            <span
              className="text-xs bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded font-bold hidden sm:inline"
              suppressHydrationWarning
            >
              {t("cashierCounter")}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
          <BrambleThemeToggle />
          <SmartAlertsPopover />
          <LanguageToggle />

          <div className="hidden sm:flex items-center gap-1.5 text-[var(--ink-3)]">
            <Clock className="w-4 h-4 text-[var(--ink-3)]" />
            <span className="tabular-nums font-mono text-xs sm:text-sm font-semibold" suppressHydrationWarning>
              {time ? formatDhakaDate(time, true) : "১২:০০:০০ AM"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-emerald-500">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs sm:text-sm font-bold" suppressHydrationWarning>
              {t("online")}
            </span>
          </div>

          <Link
            href="/profile"
            className="flex items-center gap-1.5 bg-[var(--well)] hover:bg-[var(--hover)] border border-[var(--rule)] px-3 py-1.5 rounded-xl text-[var(--ink)] transition-colors"
            title={t("myProfile")}
          >
            <User className="w-3.5 h-3.5 text-[var(--ink-3)]" />
            <span className="font-bold text-xs sm:text-sm" suppressHydrationWarning>
              {activeUserName.split(" ")[0]} (
              {activeRole === "ADMIN"
                ? t("roleAdmin")
                : activeRole === "MANAGER"
                ? t("roleManager")
                : t("roleCashier")}
              )
            </span>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-[var(--ink-3)] hover:text-rose-500 bg-[var(--well)] hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-[var(--rule)] px-3 py-1.5 rounded-xl font-semibold transition-colors"
            title={t("signOut")}
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden md:inline text-xs sm:text-sm font-bold">{t("signOut")}</span>
          </button>
        </div>
      </header>

      {/* Main Working Area */}
      <main className="flex-1 flex overflow-hidden">{children}</main>
    </div>
  );
};
