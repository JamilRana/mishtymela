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
  Users,
  Truck,
  BookOpen,
  CalendarCheck,
  RotateCcw,
  Banknote,
  Search,
  Plus,
  Lock,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHydratedRole } from "@/stores/role";
import { useHydratedLanguage } from "@/stores/language";
import { useHydratedOrganization } from "@/stores/organization";
import { LanguageToggle } from "./LanguageToggle";
import { SmartAlertsPopover } from "./SmartAlertsPopover";
import { getCurrentSessionAction, logoutAction } from "@/actions/auth";
import { getOrganizationAction } from "@/actions/organization";
import { BrambleStage, BrambleThemeToggle } from "./BramblePrimitives";

interface NavGroup {
  groupNameBn: string;
  groupNameEn: string;
  items: Array<{
    key: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    labelBn: string;
    labelEn: string;
    badgeCount?: number;
    badgeType?: "info" | "warn";
  }>;
}

const NAV_GROUPS: NavGroup[] = [
  {
    groupNameBn: "বিক্রয়",
    groupNameEn: "SELL",
    items: [
      { key: "dashboard", href: "/dashboard", icon: LayoutDashboard, labelBn: "ওভারভিউ", labelEn: "Overview" },
      { key: "pos", href: "/pos", icon: Store, labelBn: "পিওএস কাউন্টার", labelEn: "POS Terminal" },
      { key: "orders", href: "/orders", icon: CalendarCheck, labelBn: "অর্ডারসমূহ", labelEn: "Orders", badgeCount: 12, badgeType: "info" },
      { key: "sales", href: "/sales", icon: Receipt, labelBn: "বিক্রয় ও রসিদ", labelEn: "Sales & Invoices" },
      { key: "products", href: "/products", icon: Package, labelBn: "মিষ্টি ও পণ্য", labelEn: "Products" },
      { key: "inventory", href: "/inventory", icon: Boxes, labelBn: "মজুদ স্টক", labelEn: "Inventory", badgeCount: 3, badgeType: "warn" },
      { key: "returns", href: "/returns", icon: RotateCcw, labelBn: "রিটার্ন", labelEn: "Returns" },
    ],
  },
  {
    groupNameBn: "আর্থিক",
    groupNameEn: "MONEY",
    items: [
      { key: "finance", href: "/finance", icon: Wallet, labelBn: "হিসাব ও ক্যাশ", labelEn: "Finances & Cash" },
      { key: "purchases", href: "/purchases", icon: Truck, labelBn: "মালামাল ক্রয়", labelEn: "Purchases" },
      { key: "dues", href: "/dues", icon: BookOpen, labelBn: "বাকি খাতা", labelEn: "Due Ledger" },
      { key: "payroll", href: "/payroll", icon: Banknote, labelBn: "স্টাফ বেতন", labelEn: "Payroll" },
    ],
  },
  {
    groupNameBn: "সিস্টেম",
    groupNameEn: "SYSTEM",
    items: [
      { key: "reports", href: "/reports", icon: BarChart3, labelBn: "রিপোর্ট ও বিশ্লেষণ", labelEn: "Analytics" },
      { key: "contacts", href: "/contacts", icon: Users, labelBn: "কাস্টমার ও সরবরাহকারী", labelEn: "Contacts" },
      { key: "settings", href: "/settings", icon: Settings, labelBn: "দোকান সেটিংস", labelEn: "Settings" },
    ],
  },
];

interface AppShellProps {
  children: React.ReactNode;
  initialSession?: {
    userId: string;
    name: string;
    role: any;
    organizationId?: string;
  };
  initialShopInfo?: any;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  initialSession,
  initialShopInfo,
}) => {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
  const { language, t } = useHydratedLanguage();
  const isBn = language === "bn";
  const { shopInfo, setShopInfo } = useHydratedOrganization();
  const shopName = shopInfo.name || initialShopInfo?.name || (isBn ? "মিষ্টি মেলা" : "Mishty Mela");

  React.useEffect(() => {
    if (initialSession) {
      setActiveRole(initialSession.role, initialSession.name);
    } else {
      getCurrentSessionAction().then((session) => {
        if (session) {
          setActiveRole(session.role, session.name);
        }
      });
    }

    if (initialShopInfo) {
      setShopInfo(initialShopInfo);
    } else {
      getOrganizationAction().then((org) => {
        if (org) {
          setShopInfo(org);
        }
      });
    }
  }, [initialSession, initialShopInfo, setActiveRole, setShopInfo]);

  const handleLogout = async () => {
    await logoutAction();
    window.location.href = "/login";
  };

  const getCurrentModule = (path: string): string => {
    if (path.startsWith("/pos")) return "pos";
    if (path.startsWith("/sales")) return "sales";
    if (path.startsWith("/orders")) return "orders";
    if (path.startsWith("/products")) return "products";
    if (path.startsWith("/inventory")) return "inventory";
    if (path.startsWith("/finance")) return "finance";
    if (path.startsWith("/reports")) return "reports";
    if (path.startsWith("/settings")) return "settings";
    if (path.startsWith("/profile")) return "profile";
    return "dashboard";
  };

  const currentModule = getCurrentModule(pathname);
  const isAuthorized = canAccess(currentModule as any);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] flex flex-col md:flex-row relative selection:bg-[var(--accent-soft)] selection:text-[var(--ink)] font-sans">
      {/* Background Ambient Lighting Stage */}
      <BrambleStage />

      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 glass sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#5b48f0] to-[#0a93c4] flex items-center justify-center text-white font-bold text-sm shadow-sm">
            মি
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-[var(--ink)] text-sm leading-tight truncate max-w-[140px]">
              {shopName}
            </span>
            <span className="text-[11px] text-[var(--ink-3)] font-medium">
              {activeRole}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <BrambleThemeToggle />
          <LanguageToggle />
          <Link
            href="/pos"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--accent)] hover:opacity-90 text-white rounded-xl text-xs font-semibold shadow-xs"
          >
            <Store className="w-3.5 h-3.5" />
            POS
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 text-[var(--ink-2)] hover:text-[var(--ink)] rounded-lg"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Desktop Floating Frosted Sidebar (Bramble Design) */}
      <aside
        className={cn(
          "hidden md:flex flex-col m-3 lg:m-4 rounded-[22px] glass shrink-0 sticky top-4 h-[calc(100vh-2rem)] z-30 transition-all duration-300 select-none overflow-hidden",
          collapsed ? "w-[76px]" : "w-[240px]"
        )}
      >
        {/* Brand & Store Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-[var(--rule)]">
          {!collapsed ? (
            <>
              <Link href="/dashboard" className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#5b48f0] to-[#0a93c4] flex items-center justify-center text-white font-bold text-base shadow-sm shrink-0">
                  মি
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-[var(--ink)] text-sm leading-tight truncate">
                    {shopName}
                  </span>
                  <span className="text-xs text-[var(--ink-3)] truncate">
                    {isBn ? "ত্রিশাল শাখা" : "Trishal Branch"}
                  </span>
                </div>
              </Link>
              <button
                type="button"
                onClick={() => handleToggleCollapse(true)}
                className="text-[var(--ink-3)] hover:text-[var(--ink)] p-1.5 rounded-lg hover:bg-[var(--hover)] transition-colors shrink-0"
                title="সাইডবার সংকুচিত করুন"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </>
          ) : (
            <div className="w-full flex items-center justify-center">
              <button
                type="button"
                onClick={() => handleToggleCollapse(false)}
                className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#5b48f0] to-[#0a93c4] flex items-center justify-center text-white font-bold text-sm shadow-sm transition-transform hover:scale-105"
                title="সাইডবার প্রসারিত করুন"
              >
                মি
              </button>
            </div>
          )}
        </div>

        {/* Grouped Navigation Links */}
        <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto custom-scrollbar">
          {NAV_GROUPS.map((group, gIdx) => {
            const accessibleItems = group.items.filter((item) => canAccess(item.key as any));
            if (accessibleItems.length === 0) return null;

            return (
              <div key={gIdx} className="space-y-1">
                {!collapsed && (
                  <p className="px-3 text-[11px] font-bold text-[var(--ink-3)] tracking-wider uppercase mb-1">
                    {isBn ? group.groupNameBn : group.groupNameEn}
                  </p>
                )}
                {accessibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.href === "/dashboard"
                      ? pathname === "/dashboard"
                      : pathname === item.href || pathname.startsWith(`${item.href}/`);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={collapsed ? (isBn ? item.labelBn : item.labelEn) : undefined}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all group relative",
                        isActive
                          ? "bg-[var(--well)] text-[var(--ink)] font-semibold shadow-[inset_0_1px_0_var(--rim-top),inset_0_0_0_1px_var(--rule)]"
                          : "text-[var(--ink-2)] hover:bg-[var(--hover)] hover:text-[var(--ink)]",
                        collapsed && "justify-center px-0"
                      )}
                    >
                      <Icon
                        className={cn(
                          "w-4 h-4 shrink-0 transition-colors",
                          isActive ? "text-[var(--accent)]" : "text-[var(--ink-3)] group-hover:text-[var(--ink)]"
                        )}
                      />
                      {!collapsed && (
                        <span className="truncate flex-1">
                          {isBn ? item.labelBn : item.labelEn}
                        </span>
                      )}
                      {!collapsed && item.badgeCount && (
                        <span
                          className={cn(
                            "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                            item.badgeType === "warn"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300"
                              : "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300"
                          )}
                        >
                          {item.badgeCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Sidebar Footer: Live Store Pill & Rail Collapse */}
        <div className="p-3 border-t border-[var(--rule)] flex flex-col gap-2">
          {!collapsed ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-[var(--well)] border border-[var(--rule)] text-xs text-[var(--ink-2)] font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{isBn ? "দোকান চালু আছে" : "Store is live"}</span>
              </div>
              <button
                type="button"
                onClick={() => handleToggleCollapse(true)}
                className="p-1.5 text-[var(--ink-3)] hover:text-[var(--ink)] rounded-lg hover:bg-[var(--hover)] transition-colors"
                title="সাইডবার সংকুচিত করুন"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="Store is live" />
              <button
                type="button"
                onClick={() => handleToggleCollapse(false)}
                className="p-1.5 text-[var(--ink-3)] hover:text-[var(--ink)] rounded-lg hover:bg-[var(--hover)] transition-colors"
                title="সাইডবার প্রসারিত করুন"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Profile & Signout Row */}
          {!collapsed && (
            <div className="flex items-center justify-between pt-1 text-xs">
              <Link
                href="/profile"
                className="flex items-center gap-2 overflow-hidden hover:opacity-85 transition-opacity flex-1 min-w-0"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#5b48f0] to-[#0a93c4] text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {activeUserName.charAt(0) || "U"}
                </div>
                <div className="flex flex-col truncate">
                  <span className="font-semibold text-[var(--ink)] truncate leading-tight">
                    {activeUserName}
                  </span>
                  <span className="text-[10px] text-[var(--accent)] font-bold">
                    {activeRole}
                  </span>
                </div>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="p-1 text-[var(--ink-3)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition-colors"
                title={isBn ? "লগআউট" : "Sign out"}
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col p-3 lg:p-4 z-10">
        {/* Floating Solid Topbar (High-contrast opaque surface with subtle blur) */}
        <header className="rounded-[20px] bg-white/95 dark:bg-[#0c0e18]/95 backdrop-blur-xl border border-[var(--rule)] shadow-sm px-4 py-2.5 flex items-center justify-between gap-3 mb-4 shrink-0">
          {/* Search Input Bar with Command K badge */}
          <div className="flex-1 max-w-md relative flex items-center">
            <Search className="w-4 h-4 text-[var(--ink-3)] absolute left-3 pointer-events-none" />
            <input
              type="text"
              placeholder={isBn ? "অর্ডার, পণ্য বা কাস্টমার খুঁজুন..." : "Search orders, products, customers..."}
              className="w-full bg-[var(--well)] hover:bg-[var(--hover)] focus:bg-[var(--sheet-solid)] border border-[var(--rule)] rounded-xl pl-9 pr-12 py-1.5 text-xs text-[var(--ink)] placeholder-[var(--ink-3)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all"
            />
            <kbd className="absolute right-3 px-1.5 py-0.5 text-[10px] font-mono text-[var(--ink-3)] bg-[var(--well)] border border-[var(--rule)] rounded">
              ⌘K
            </kbd>
          </div>

          {/* Right Action Icons & Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Gradient + Create button */}
            <Link
              href="/pos"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#5b48f0] to-[#0a93c4] hover:opacity-95 text-white text-xs font-semibold shadow-xs transition-opacity"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isBn ? "+ নতুন রসিদ" : "+ Create"}</span>
            </Link>

            {/* Light / Dark Mode Toggle */}
            <BrambleThemeToggle />

            {/* Language Switch */}
            <LanguageToggle />

            {/* Notifications Popover */}
            <SmartAlertsPopover />

            {/* User Profile Avatar Pill */}
            <Link
              href="/profile"
              className="flex items-center gap-1.5 p-1 rounded-xl hover:bg-[var(--hover)] transition-colors"
              title={activeUserName}
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#ff6b6b] to-[#ff8e53] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {activeUserName.slice(0, 2).toUpperCase()}
              </div>
            </Link>
          </div>
        </header>

        {/* Content Body with Guard */}
        <main className="flex-1 min-w-0 overflow-y-auto">
          {isAuthorized ? (
            children
          ) : (
            <div className="bramble-card p-12 text-center max-w-lg mx-auto my-12">
              <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-900/30 text-red-600 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-bold text-[var(--ink)] mb-1">
                {t("accessDeniedTitle")}
              </h2>
              <p className="text-xs text-[var(--ink-3)] mb-6 leading-relaxed">
                {activeRole === "CASHIER" ? t("accessDeniedCashier") : t("accessDeniedManager")}
              </p>
              <Link
                href="/pos"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--accent)] text-white rounded-xl text-xs font-semibold shadow-md hover:opacity-90 transition-opacity"
              >
                <Store className="w-4 h-4" />
                <span>{t("goToPos")}</span>
              </Link>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex">
          <div className="w-72 bg-[var(--sheet-solid)] h-full p-4 flex flex-col justify-between shadow-2xl">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[var(--rule)]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#5b48f0] to-[#0a93c4] flex items-center justify-center text-white font-bold text-sm">
                    মি
                  </div>
                  <div>
                    <span className="font-bold text-[var(--ink)] text-sm">{shopName}</span>
                    <p className="text-[10px] text-[var(--accent)] font-bold">{activeRole}</p>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 text-[var(--ink-3)] hover:text-[var(--ink)]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="py-2 border-b border-[var(--rule)] flex items-center justify-between">
                <BrambleThemeToggle />
                <LanguageToggle />
              </div>

              <nav className="mt-3 space-y-1">
                {NAV_GROUPS.flatMap((g) => g.items)
                  .filter((item) => canAccess(item.key as any))
                  .map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium",
                          isActive
                            ? "bg-[var(--well)] text-[var(--accent)] font-bold"
                            : "text-[var(--ink-2)] hover:bg-[var(--hover)]"
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{isBn ? item.labelBn : item.labelEn}</span>
                      </Link>
                    );
                  })}
              </nav>
            </div>

            <div className="pt-3 border-t border-[var(--rule)] flex items-center justify-between text-xs">
              <span className="font-semibold text-[var(--ink)]">{activeUserName}</span>
              <button
                onClick={handleLogout}
                className="text-red-500 font-medium hover:underline"
              >
                {isBn ? "লগআউট" : "Sign out"}
              </button>
            </div>
          </div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}
    </div>
  );
};
