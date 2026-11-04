"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, User, LogOut } from "lucide-react";
import { formatDhakaDate } from "./DateTimeText";
import { useHydratedRole } from "@/stores/role";
import { useHydratedLanguage } from "@/stores/language";
import { useHydratedOrganization } from "@/stores/organization";
import { LanguageToggle } from "./LanguageToggle";
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
    <div className="h-[100dvh] flex flex-col bg-slate-100 overflow-hidden select-none">
      {/* POS Top Bar */}
      <header className="h-12 sm:h-13 bg-slate-900 text-white px-3 sm:px-4 flex items-center justify-between shrink-0 shadow-xs z-30">
        <div className="flex items-center gap-2 sm:gap-4">
          {activeRole !== "CASHIER" && (
            <Link
              href="/dashboard"
              className="flex items-center gap-1 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2 py-1.5 rounded-md transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden xs:inline" suppressHydrationWarning>
                {t("back")}
              </span>
            </Link>
          )}
          {activeRole !== "CASHIER" && <div className="h-4 w-px bg-slate-700 hidden xs:block" />}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span
              className="font-bold text-xs sm:text-sm text-white tracking-tight truncate max-w-[140px] sm:max-w-none"
              suppressHydrationWarning
            >
              {shopName || t("shopTitle")}
            </span>
            <span
              className="text-[10px] bg-rose-600/30 text-rose-300 border border-rose-500/30 px-1.5 py-0.5 rounded font-medium hidden sm:inline"
              suppressHydrationWarning
            >
              {t("cashierCounter")}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-4 text-xs">
          <LanguageToggle className="bg-slate-800 border-slate-700" />

          <div className="hidden sm:flex items-center gap-1.5 text-slate-300">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="tabular-nums font-mono text-[11px]" suppressHydrationWarning>
              {time ? formatDhakaDate(time, true) : "১২:০০:০০ AM"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] sm:text-[11px] font-medium" suppressHydrationWarning>
              {t("online")}
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1 rounded text-slate-200">
            <User className="w-3 h-3 text-slate-400" />
            <span className="font-semibold text-[11px]" suppressHydrationWarning>
              {activeUserName.split(" ")[0]} (
              {activeRole === "ADMIN"
                ? t("roleAdmin")
                : activeRole === "MANAGER"
                ? t("roleManager")
                : t("roleCashier")}
              )
            </span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded transition-colors"
            title={t("signOut")}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden md:inline text-[11px] font-medium">{t("signOut")}</span>
          </button>
        </div>
      </header>

      {/* Main Working Area */}
      <main className="flex-1 flex overflow-hidden">{children}</main>
    </div>
  );
};
