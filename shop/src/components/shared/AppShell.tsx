"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Receipt,
  Package,
  Boxes,
  Wallet,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Store,
  LogOut,
  User as UserIcon,
  Check,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHydratedRole } from "@/stores/role";
import { useHydratedLanguage } from "@/stores/language";
import { useHydratedOrganization } from "@/stores/organization";
import { LanguageToggle } from "./LanguageToggle";
import { Role } from "@prisma/client";
import { getCurrentSessionAction, logoutAction } from "@/actions/auth";
import { getOrganizationAction } from "@/actions/organization";

interface NavItem {
  key: "dashboard" | "pos" | "sales" | "products" | "inventory" | "finance" | "reports" | "settings";
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  isPos?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { key: "dashboard", href: "/dashboard", icon: LayoutDashboard },
  { key: "pos", href: "/pos", icon: Store, isPos: true },
  { key: "sales", href: "/sales", icon: Receipt },
  { key: "products", href: "/products", icon: Package },
  { key: "inventory", href: "/inventory", icon: Boxes },
  { key: "finance", href: "/finance", icon: Wallet },
  { key: "reports", href: "/reports", icon: BarChart3 },
  { key: "settings", href: "/settings", icon: Settings },
];

export const AppShell: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  // Sync collapsed state with localStorage on client mount
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("sidebar_collapsed");
      if (saved !== null) {
        setCollapsed(saved === "true");
      }
    } catch {
      // ignore
    }
  }, []);

  const handleToggleCollapse = (targetState?: boolean) => {
    setCollapsed((prev) => {
      const next = typeof targetState === "boolean" ? targetState : !prev;
      try {
        localStorage.setItem("sidebar_collapsed", String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const { activeRole, activeUserName, setActiveRole, canAccess } = useHydratedRole();
  const { t } = useHydratedLanguage();
  const { shopInfo, setShopInfo } = useHydratedOrganization();
  const shopName = shopInfo.name;

  React.useEffect(() => {
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

  const getCurrentModule = (path: string): NavItem["key"] => {
    if (path.startsWith("/pos")) return "pos";
    if (path.startsWith("/sales")) return "sales";
    if (path.startsWith("/products")) return "products";
    if (path.startsWith("/inventory")) return "inventory";
    if (path.startsWith("/finance")) return "finance";
    if (path.startsWith("/reports")) return "reports";
    if (path.startsWith("/settings")) return "settings";
    return "dashboard";
  };

  const currentModule = getCurrentModule(pathname);
  const isAuthorized = canAccess(currentModule);

  const visibleNavItems = NAV_ITEMS.filter((item) => canAccess(item.key));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-rose-600 flex items-center justify-center text-white font-bold text-sm">
            MS
          </div>
          <div className="flex flex-col">
            <span
              className="font-bold text-slate-900 text-sm leading-tight truncate max-w-[150px]"
              suppressHydrationWarning
            >
              {shopName || t("shopTitle")}
            </span>
            <span className="text-[10px] text-slate-500 font-medium" suppressHydrationWarning>
              {activeRole === "ADMIN" ? t("roleAdmin") : activeRole === "MANAGER" ? t("roleManager") : t("roleCashier")}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <Link
            href="/pos"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-xs font-semibold shadow-xs"
          >
            <Store className="w-3.5 h-3.5" />
            POS
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 text-slate-600 hover:text-slate-900 rounded-md"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Desktop Collapsible Sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col border-r border-slate-200 bg-white transition-all duration-200 shrink-0 sticky top-0 h-screen relative",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Floating border rail toggle - always easily clickable from anywhere */}
        <button
          type="button"
          onClick={() => handleToggleCollapse()}
          className="hidden md:flex absolute -right-3 top-20 z-30 w-6 h-6 bg-white border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-300 rounded-full shadow-sm items-center justify-center transition-all hover:scale-110 cursor-pointer"
          title={collapsed ? "সাইডবার প্রসারিত করুন (Expand sidebar)" : "সাইডবার সংকুচিত করুন (Collapse sidebar)"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Brand & Sidebar Toggle */}
        <div className="h-16 flex items-center justify-between px-3 border-b border-slate-100">
          {!collapsed ? (
            <>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-md bg-rose-600 flex items-center justify-center text-white font-bold text-sm tracking-tight shadow-xs shrink-0">
                  MS
                </div>
                <div className="flex flex-col min-w-0">
                  <span
                    className="font-bold text-slate-900 text-sm leading-tight truncate max-w-[140px]"
                    suppressHydrationWarning
                  >
                    {shopName || t("shopTitle")}
                  </span>
                  <span className="text-[11px] text-slate-400 truncate" suppressHydrationWarning>
                    {t("tagline")}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleToggleCollapse(true)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-md hover:bg-slate-100 transition-colors shrink-0"
                title="সাইডবার সংকুচিত করুন (Collapse sidebar)"
                aria-label="Collapse sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </>
          ) : (
            <div className="w-full flex items-center justify-center">
              <button
                type="button"
                onClick={() => handleToggleCollapse(false)}
                className="w-10 h-10 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 hover:border-rose-300 flex items-center justify-center transition-all shadow-xs group"
                title="সাইডবার প্রসারিত করুন / Expand sidebar"
                aria-label="Expand sidebar"
              >
                <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          )}
        </div>

        {/* Language Switcher in Sidebar */}
        {!collapsed && (
          <div className="px-3.5 pt-3 pb-1 flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Language / ভাষা</span>
            <LanguageToggle />
          </div>
        )}

        {/* Primary Navigation */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? t(item.key) : undefined}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors group",
                  isActive
                    ? "bg-rose-50 text-rose-700 font-semibold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                  collapsed && "justify-center px-2"
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 shrink-0 transition-colors",
                    isActive ? "text-rose-700" : "text-slate-400 group-hover:text-slate-600"
                  )}
                />
                {!collapsed && <span>{t(item.key)}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User profile / Sign Out */}
        <div className="p-3 border-t border-slate-100 relative">
          {!collapsed ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700 shrink-0 text-xs font-bold">
                  {activeUserName.charAt(0)}
                </div>
                <div className="flex flex-col truncate">
                  <span className="text-xs font-semibold text-slate-900 truncate leading-tight">
                    {activeUserName}
                  </span>
                  <span className="text-[10px] text-rose-600 font-bold tracking-wider">
                    {activeRole === "ADMIN" ? t("roleAdmin") : activeRole === "MANAGER" ? t("roleManager") : t("roleCashier")}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="text-slate-400 hover:text-rose-600 p-1.5 rounded-md hover:bg-rose-50 transition-colors"
                title={t("signOut")}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={handleLogout}
                className="text-slate-400 hover:text-rose-600 p-1.5 rounded-md hover:bg-rose-50 transition-colors"
                title={t("signOut")}
              >
                <LogOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleToggleCollapse(false)}
                className="w-full flex justify-center text-slate-400 hover:text-rose-600 py-1 transition-colors"
                title="সাইডবার প্রসারিত করুন / Expand sidebar"
                aria-label="Expand sidebar"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-900/50 flex">
          <div className="w-64 bg-white h-full p-4 flex flex-col justify-between shadow-xl animate-in slide-in-from-left duration-200">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex flex-col">
                  <span className="font-bold text-slate-900 text-sm">{t("shopTitle")}</span>
                  <span className="text-[11px] text-slate-400">
                    {activeRole === "ADMIN" ? t("roleAdmin") : activeRole === "MANAGER" ? t("roleManager") : t("roleCashier")}
                  </span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="py-2 border-b border-slate-100">
                <LanguageToggle />
              </div>

              <nav className="mt-3 space-y-1">
                {visibleNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium",
                        isActive
                          ? "bg-rose-50 text-rose-700 font-semibold"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{t(item.key)}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <div className="flex flex-col">
                <span className="font-semibold text-slate-800">{activeUserName}</span>
                <span className="text-[10px] text-rose-600 font-bold">{activeRole}</span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1 text-slate-500 hover:text-rose-600 px-2 py-1 rounded bg-slate-50 hover:bg-rose-50"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t("signOut")}</span>
              </button>
            </div>
          </div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* Main Content Area with Role Access Guard */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="max-w-[1440px] mx-auto p-4 sm:p-6 lg:p-8">
          {isAuthorized ? (
            children
          ) : (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white border border-slate-200 rounded-lg shadow-xs my-6">
              <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
                <Lock className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                {t("accessDeniedTitle")}
              </h2>
              <p className="text-sm text-slate-500 max-w-md mb-6 leading-relaxed">
                {activeRole === "CASHIER"
                  ? t("accessDeniedCashier")
                  : t("accessDeniedManager")}
              </p>
              <Link
                href="/pos"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-sm font-bold shadow-md transition-colors"
              >
                <Store className="w-4 h-4" />
                <span>{t("goToPos")}</span>
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
