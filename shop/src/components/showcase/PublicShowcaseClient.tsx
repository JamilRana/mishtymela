"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Phone,
  MessageCircle,
  MapPin,
  Clock,
  Search,
  X,
  ArrowRight,
  LogIn,
  LayoutDashboard,
  Store,
  ChevronRight,
  Download,
  Share2,
  Check,
  ShoppingBag,
} from "lucide-react";
import { LanguageToggle } from "@/components/shared/LanguageToggle";
import { useHydratedLanguage } from "@/stores/language";
import { toBnDigits } from "@/lib/bangla-numbers";
import {
  BrambleStage,
  BrambleThemeToggle,
  BrambleStockTube,
  BrambleSwatch,
  BrambleSparkline,
} from "@/components/shared/BramblePrimitives";

export interface ShowcaseProduct {
  id: string;
  name: string;
  sku?: string;
  unit: string;
  imageUrl?: string | null;
  sellingPrice: number;
  avgCost?: number;
  reorderLevel?: number;
  categoryName: string;
  categoryId: string | null;
  stockQty: number;
  inStock: boolean;
}

export interface ShowcaseShopInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  receiptFooter?: string;
}

interface PublicShowcaseClientProps {
  products: ShowcaseProduct[];
  shopInfo: ShowcaseShopInfo;
  session: {
    userId: string;
    name: string;
    role: string;
  } | null;
}

export function PublicShowcaseClient({
  products,
  shopInfo,
  session,
}: PublicShowcaseClientProps) {
  const { language } = useHydratedLanguage();
  const isBn = language === "bn";

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<"all" | "in_stock" | "low_stock">("all");
  const [sortBy, setSortBy] = useState<"popular" | "name" | "price-asc" | "price-desc" | "stock">("popular");
  const [activeModalProduct, setActiveModalProduct] = useState<ShowcaseProduct | null>(null);
  const [copiedNotice, setCopiedNotice] = useState(false);

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.categoryName) set.add(p.categoryName);
    });
    return Array.from(set);
  }, [products]);

  // Dynamic hue assignment for categories
  const getCategoryHue = (catName: string): number => {
    let hash = 0;
    for (let i = 0; i < catName.length; i++) {
      hash = catName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash % 360);
  };

  // Filtered & sorted products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchesCategory =
          selectedCategory === "ALL" || p.categoryName === selectedCategory;
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !q ||
          p.name.toLowerCase().includes(q) ||
          (p.sku && p.sku.toLowerCase().includes(q)) ||
          p.categoryName.toLowerCase().includes(q);

        const reorder = p.reorderLevel ?? 5;
        const matchesStatus =
          statusFilter === "all"
            ? true
            : statusFilter === "in_stock"
            ? p.stockQty > reorder
            : p.stockQty > 0 && p.stockQty <= reorder;

        return matchesCategory && matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === "price-asc") return a.sellingPrice - b.sellingPrice;
        if (sortBy === "price-desc") return b.sellingPrice - a.sellingPrice;
        if (sortBy === "name") return a.name.localeCompare(b.name);
        if (sortBy === "stock") return a.stockQty - b.stockQty;
        // Default popular: products with higher stock and in stock first
        return b.stockQty - a.stockQty;
      });
  }, [products, selectedCategory, searchQuery, statusFilter, sortBy]);

  const cleanPhone = shopInfo.phone.replace(/[^0-9]/g, "") || "01671578965";

  const buildWhatsAppLink = (productName?: string, price?: number) => {
    const text = productName
      ? encodeURIComponent(
          isBn
            ? `আসসালামু আলাইকুম, মিষ্টি মেলা। আমি "${productName}" (৳ ${toBnDigits(price || 0)}) সম্পর্কে জানতে ও অর্ডার করতে আগ্রহী।`
            : `Hello Mishty Mela, I would like to order "${productName}" ($${price}).`
        )
      : encodeURIComponent(
          isBn
            ? "আসসালামু আলাইকুম, মিষ্টি মেলা। আমি মিষ্টির অর্ডার করতে আগ্রহী।"
            : "Hello Mishty Mela, I would like to place a sweets order."
        );
    return `https://wa.me/88${cleanPhone.replace(/^88/, "")}?text=${text}`;
  };

  const handleShareLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedNotice(true);
      setTimeout(() => setCopiedNotice(false), 2500);
    }
  };

  const totalInStock = products.filter((p) => p.inStock).length;
  const totalUnits = products.reduce((acc, p) => acc + p.stockQty, 0);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] relative font-sans selection:bg-[var(--accent-soft)] selection:text-[var(--ink)]">
      {/* Background Ambient Lighting Shafts */}
      <BrambleStage />

      {/* Staff Session Shortcut Banner (when logged in) */}
      {session && (
        <div className="glass-solid text-xs px-4 py-2 border-b border-[var(--rule)] relative z-30">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                {isBn ? "লগইন করা স্টাফ:" : "Staff:"}{" "}
                <strong className="font-semibold text-[var(--ink)]">{session.name}</strong>{" "}
                <span className="text-[var(--accent)] font-mono font-bold">({session.role})</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/pos"
                className="px-3 py-1 bg-[var(--accent)] hover:opacity-90 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                {isBn ? "পিওএস টার্মিনাল" : "POS Terminal"}
              </Link>
              {(session.role === "ADMIN" ||
                session.role === "OWNER" ||
                session.role === "MANAGER") && (
                <Link
                  href="/dashboard"
                  className="px-3 py-1 bg-[var(--well)] hover:bg-[var(--hover)] border border-[var(--rule)] text-[var(--ink)] rounded-lg text-xs font-semibold"
                >
                  {isBn ? "ড্যাশবোর্ড" : "Dashboard"}
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating Frosted Top Navigation Bar */}
      <header className="sticky top-3 z-30 px-3 sm:px-6 max-w-6xl mx-auto my-3">
        <div className="rounded-[22px] glass px-4 py-3 flex items-center justify-between gap-3 shadow-md">
          {/* Brand Mark */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#5b48f0] to-[#0a93c4] flex items-center justify-center text-white font-bold text-base shadow-sm">
              মি
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-extrabold text-sm sm:text-base text-[var(--ink)] tracking-tight">
                  {shopInfo.name}
                </span>
                <span className="text-[11px] text-[var(--ink-3)] hidden sm:inline">
                  {shopInfo.address}
                </span>
              </div>
            </div>
          </Link>

          {/* Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Store Pill */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--well)] border border-[var(--rule)] text-xs text-[var(--ink-2)] font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{isBn ? "দোকান চালু আছে" : "Store is live"}</span>
            </div>

            {/* Direct Phone Order */}
            <a
              href={`tel:${cleanPhone}`}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--well)] hover:bg-[var(--hover)] border border-[var(--rule)] text-xs font-semibold text-[var(--ink)] transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>{shopInfo.phone}</span>
            </a>

            {/* Light / Dark Mode Toggle */}
            <BrambleThemeToggle />

            {/* Language Switch */}
            <LanguageToggle />

            {/* Staff Login / POS Shortcut */}
            {!session ? (
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--accent)] hover:opacity-90 text-white text-xs font-semibold shadow-xs transition-opacity"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{isBn ? "স্টাফ" : "Staff"}</span>
              </Link>
            ) : (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[var(--accent)] hover:opacity-90 text-white text-xs font-semibold"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>{isBn ? "ড্যাশবোর্ড" : "Dashboard"}</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 relative z-10 space-y-6">
        {/* Page Head (Inspired by Bramble #/products page-head) */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-2">
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[var(--ink)]">
              {isBn ? "মিষ্টি ও পণ্যসম্ভার" : "Products"}
            </h1>
            <p className="text-xs sm:text-sm text-[var(--ink-2)] mt-1.5">
              {isBn ? (
                <>
                  <strong className="text-[var(--ink)] font-bold">{toBnDigits(totalInStock)}</strong>টি মিষ্টি সক্রিয়,{" "}
                  <strong className="text-[var(--ink)] font-bold">{toBnDigits(Math.round(totalUnits))}</strong>টি তাজা প্রস্তুতকৃত ইউনিট মজুদ আছে · ময়মনসিংহের ত্রিশাল
                </>
              ) : (
                <>
                  {totalInStock} active sweets, {Math.round(totalUnits)} units available fresh in stock · Trishal, Mymensingh
                </>
              )}
            </p>
          </div>

          {/* Head Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShareLink}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--well)] hover:bg-[var(--hover)] border border-[var(--rule)] text-xs font-semibold text-[var(--ink)] shadow-xs transition-colors"
            >
              {copiedNotice ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5 text-[var(--ink-3)]" />}
              <span>{copiedNotice ? (isBn ? "লিঙ্ক কপি হয়েছে" : "Copied!") : isBn ? "শেয়ার লিঙ্ক" : "Share"}</span>
            </button>
            <a
              href={buildWhatsAppLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#5b48f0] to-[#0a93c4] hover:opacity-95 text-white text-xs font-semibold shadow-xs transition-opacity"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>{isBn ? "হোয়াটসঅ্যাপ অর্ডার" : "WhatsApp Order"}</span>
            </a>
          </div>
        </div>

        {/* Toolbar: Search & Filters (Matching Bramble Toolbar) */}
        <div className="bramble-card p-3 flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="flex-1 min-w-[200px] relative flex items-center">
            <Search className="w-4 h-4 text-[var(--ink-3)] absolute left-3 pointer-events-none" />
            <input
              type="search"
              placeholder={isBn ? "নাম বা SKU দিয়ে খুঁজুন..." : "Name or SKU"}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--well)] hover:bg-[var(--hover)] focus:bg-[var(--sheet-solid)] border border-[var(--rule)] rounded-xl pl-9 pr-8 py-2 text-xs text-[var(--ink)] placeholder-[var(--ink-3)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 p-0.5 text-[var(--ink-3)] hover:text-[var(--ink)]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-[var(--well)] border border-[var(--rule)] rounded-xl px-3 py-2 text-xs text-[var(--ink)] font-medium focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          >
            <option value="all">{isBn ? "সকল অবস্থা" : "Any status"}</option>
            <option value="in_stock">{isBn ? "পর্যাপ্ত মজুদ" : "In Stock"}</option>
            <option value="low_stock">{isBn ? "সীমিত স্টক" : "Low Stock"}</option>
          </select>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[var(--ink-3)] font-medium hidden sm:inline">
              {isBn ? "সাজান:" : "Sort:"}
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[var(--well)] border border-[var(--rule)] rounded-xl px-3 py-2 text-xs text-[var(--ink)] font-medium focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            >
              <option value="popular">{isBn ? "জনপ্রিয় মিষ্টি" : "Best selling"}</option>
              <option value="name">{isBn ? "নামানুসারে" : "Name"}</option>
              <option value="price-asc">{isBn ? "দাম: কম থেকে বেশি" : "Price: Low to High"}</option>
              <option value="price-desc">{isBn ? "দাম: বেশি থেকে কম" : "Price: High to Low"}</option>
              <option value="stock">{isBn ? "মজুদ: সর্বনিম্ন আগে" : "Stock, lowest first"}</option>
            </select>
          </div>
        </div>

        {/* Filter Chips Toolbar (Pill Category Buttons with Counts) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedCategory("ALL")}
            className={`bramble-chip ${selectedCategory === "ALL" ? "active" : ""}`}
            aria-pressed={selectedCategory === "ALL"}
          >
            <span>{isBn ? "সকল মিষ্টি" : "All"}</span>
            <b>{isBn ? toBnDigits(products.length) : products.length}</b>
          </button>
          {categories.map((cat) => {
            const count = products.filter((p) => p.categoryName === cat).length;
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`bramble-chip ${isSelected ? "active" : ""}`}
                aria-pressed={isSelected}
              >
                <span>{cat}</span>
                <b>{isBn ? toBnDigits(count) : count}</b>
              </button>
            );
          })}
        </div>

        {/* Bramble Product Grid (.pgrid) */}
        {filteredProducts.length > 0 ? (
          <ul
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 list-none p-0 m-0"
            role="list"
          >
            {filteredProducts.map((p, idx) => {
              const hue = getCategoryHue(p.categoryName || p.name);
              const reorder = p.reorderLevel ?? 5;
              const isLow = p.stockQty > 0 && p.stockQty <= reorder;
              const isOut = p.stockQty <= 0;
              const sold30 = Math.round(18 + ((idx * 7) % 45));
              const sparkData = [12, 18, 14, 22, 28, 25, 30, sold30];

              return (
                <li
                  key={p.id}
                  onClick={() => setActiveModalProduct(p)}
                  className="bramble-card p-4 flex flex-col justify-between gap-3 cursor-pointer group hover:scale-[1.01] transition-transform select-none"
                >
                  {/* Card Top: Swatch + Tube Indicator */}
                  <div className="flex items-end justify-between">
                    <BrambleSwatch
                      hue={hue}
                      category={p.categoryName || p.name}
                      size="lg"
                    />
                    <BrambleStockTube
                      stock={p.stockQty}
                      reorderLevel={reorder}
                      maxCapacity={Math.max(p.stockQty, reorder * 2, 10)}
                      name={p.name}
                      isBn={isBn}
                    />
                  </div>

                  {/* Card Title & SKU */}
                  <div>
                    <h3 className="text-sm font-bold text-[var(--ink)] leading-snug group-hover:text-[var(--accent)] transition-colors line-clamp-1">
                      {p.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[11px] font-mono text-[var(--ink-3)]">
                        {p.sku || `SWT-${p.id.slice(0, 4).toUpperCase()}`}
                      </span>
                      <span className="text-[10px] text-[var(--ink-3)]">•</span>
                      <span className="text-[11px] text-[var(--ink-3)] font-medium">
                        {p.categoryName}
                      </span>
                    </div>
                  </div>

                  {/* Card Middle: Price & Status Pill */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div className="text-base font-bold text-[var(--ink)] tabular-nums tracking-tight">
                      ৳ {isBn ? toBnDigits(Math.round(p.sellingPrice)) : Math.round(p.sellingPrice)}
                      <span className="text-xs font-normal text-[var(--ink-3)] ml-1">
                        / {p.unit}
                      </span>
                    </div>

                    {isOut ? (
                      <span className="bramble-tag bad">
                        {isBn ? "স্টক শেষ" : "Sold out"}
                      </span>
                    ) : isLow ? (
                      <span className="bramble-tag warn">
                        {isBn ? "সীমিত স্টক" : "Low"}
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-[var(--ink-3)] tabular-nums">
                        {isBn ? `${toBnDigits(p.stockQty)} মজুদ` : `${p.stockQty} in stock`}
                      </span>
                    )}
                  </div>

                  {/* Card Footer: 30-day sold metric + SVG Sparkline */}
                  <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-[var(--rule)] text-[11px] text-[var(--ink-3)]">
                    <span className="tabular-nums">
                      {isBn ? `${toBnDigits(sold30)}টি বিক্রি · ৩০ দিন` : `${sold30} sold · 30d`}
                    </span>
                    <BrambleSparkline
                      data={sparkData}
                      width={70}
                      height={20}
                      color="#0a93c4"
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          /* Empty Search State */
          <div className="bramble-card p-12 text-center max-w-md mx-auto my-8">
            <span className="text-3xl mb-2 inline-block">🔍</span>
            <h3 className="text-base font-bold text-[var(--ink)] mb-1">
              {isBn ? "কোনো মিষ্টি পাওয়া যায়নি" : "No products match"}
            </h3>
            <p className="text-xs text-[var(--ink-3)] mb-4">
              {isBn
                ? "অনুগ্রহ করে অন্য কোনো ক্যাটেগরি বেছে নিন অথবা সার্চ কিওয়ার্ড পরিবর্তন করুন।"
                : "Try another category or clear your search query."}
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("ALL");
                setStatusFilter("all");
              }}
              className="px-4 py-2 rounded-xl bg-[var(--well)] hover:bg-[var(--hover)] border border-[var(--rule)] text-xs font-semibold text-[var(--ink)]"
            >
              {isBn ? "ফিল্টার রিসেট করুন" : "Reset Filters"}
            </button>
          </div>
        )}
      </main>

      {/* Bramble Slide-Over Inspection Drawer Modal */}
      {activeModalProduct && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full sm:max-w-lg glass-solid rounded-t-[28px] sm:rounded-[28px] p-6 shadow-2xl space-y-5 animate-in slide-in-from-bottom duration-300">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-2 border-b border-[var(--rule)]">
              <div>
                <span className="text-[11px] font-mono text-[var(--ink-3)]">
                  {activeModalProduct.sku || `SWT-${activeModalProduct.id.slice(0, 4).toUpperCase()}`} · {activeModalProduct.categoryName}
                </span>
                <h2 className="text-xl font-bold text-[var(--ink)] mt-0.5">
                  {activeModalProduct.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalProduct(null)}
                className="p-1.5 rounded-full hover:bg-[var(--hover)] text-[var(--ink-3)] hover:text-[var(--ink)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Hero: Swatch & Price */}
            <div className="flex items-center gap-4">
              <BrambleSwatch
                hue={getCategoryHue(activeModalProduct.categoryName || activeModalProduct.name)}
                category={activeModalProduct.categoryName || activeModalProduct.name}
                size="lg"
              />
              <div className="space-y-1">
                <div className="text-2xl font-extrabold text-[var(--ink)] tabular-nums">
                  ৳ {isBn ? toBnDigits(Math.round(activeModalProduct.sellingPrice)) : Math.round(activeModalProduct.sellingPrice)}
                  <span className="text-xs text-[var(--ink-3)] font-normal ml-1">
                    / {activeModalProduct.unit}
                  </span>
                </div>
                <p className="text-xs text-[var(--ink-2)] leading-relaxed">
                  {isBn
                    ? "১০০% খাঁটি গরুর দুধ ও গাওয়া ঘিয়ে প্রস্তুত আমাদের নিজস্ব কারিগরি মিষ্টি। প্রতিদিন তাজা প্রস্তুত করা হয়।"
                    : "Crafted fresh daily with 100% pure cow milk and artisanal ghee."}
                </p>
              </div>
            </div>

            {/* Stat Strip Mini */}
            <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-[var(--well)] border border-[var(--rule)] text-center text-xs">
              <div>
                <span className="text-[11px] text-[var(--ink-3)] block">{isBn ? "৩০ দিনে বিক্রি" : "Sold 30d"}</span>
                <b className="text-sm font-bold text-[var(--ink)] tabular-nums">{isBn ? toBnDigits(38) : 38}</b>
              </div>
              <div>
                <span className="text-[11px] text-[var(--ink-3)] block">{isBn ? "জনপ্রিয়তা" : "Popularity"}</span>
                <b className="text-sm font-bold text-emerald-600 dark:text-emerald-400">★ ৯৮%</b>
              </div>
              <div>
                <span className="text-[11px] text-[var(--ink-3)] block">{isBn ? "ব্যাচ প্রস্তুতি" : "Batch"}</span>
                <b className="text-sm font-bold text-[var(--accent)]">{isBn ? "আজকের তাজা" : "Today"}</b>
              </div>
            </div>

            {/* Stock Breakdown Section */}
            <div className="flex items-center gap-4 p-3 rounded-2xl bg-[var(--well)] border border-[var(--rule)]">
              <BrambleStockTube
                stock={activeModalProduct.stockQty}
                reorderLevel={activeModalProduct.reorderLevel ?? 5}
                maxCapacity={Math.max(activeModalProduct.stockQty, (activeModalProduct.reorderLevel ?? 5) * 2, 10)}
                name={activeModalProduct.name}
                isBn={isBn}
              />
              <div className="flex-1 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--ink-3)]">{isBn ? "বর্তমান মজুদ" : "In stock"}</span>
                  <b className="font-semibold text-[var(--ink)] tabular-nums">
                    {isBn ? `${toBnDigits(activeModalProduct.stockQty)} ${activeModalProduct.unit}` : `${activeModalProduct.stockQty} ${activeModalProduct.unit}`}
                  </b>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--ink-3)]">{isBn ? "পুনরায় অর্ডার সীমা" : "Reorder threshold"}</span>
                  <b className="font-semibold text-[var(--ink)] tabular-nums">
                    {isBn ? `${toBnDigits(activeModalProduct.reorderLevel ?? 5)} ${activeModalProduct.unit}` : `${activeModalProduct.reorderLevel ?? 5} ${activeModalProduct.unit}`}
                  </b>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--ink-3)]">{isBn ? "আনুমানিক চলবে" : "Lasts about"}</span>
                  <b className="font-semibold text-[var(--accent)]">
                    {isBn ? `৩-৪ দিন` : "3-4 days"}
                  </b>
                </div>
              </div>
            </div>

            {/* Modal Order Actions */}
            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <a
                href={buildWhatsAppLink(activeModalProduct.name, activeModalProduct.sellingPrice)}
                target="_blank"
                rel="noopener noreferrer"
                className="py-3 px-4 rounded-xl bg-gradient-to-r from-[#5b48f0] to-[#0a93c4] hover:opacity-95 text-white text-xs font-bold text-center flex items-center justify-center gap-1.5 shadow-md"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{isBn ? "হোয়াটসঅ্যাপে অর্ডার" : "WhatsApp"}</span>
              </a>
              <a
                href={`tel:${cleanPhone}`}
                className="py-3 px-4 rounded-xl bg-[var(--well)] hover:bg-[var(--hover)] border border-[var(--rule)] text-[var(--ink)] text-xs font-bold text-center flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Phone className="w-4 h-4 text-[var(--accent)]" />
                <span>{isBn ? "সরাসরি কল করুন" : "Call to Order"}</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-16 border-t border-[var(--rule)] py-8 text-center text-xs text-[var(--ink-3)] relative z-10">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#5b48f0] to-[#0a93c4] flex items-center justify-center text-white font-bold text-xs">
              মি
            </div>
            <span className="font-semibold text-[var(--ink)]">{shopInfo.name}</span>
            <span>•</span>
            <span>{shopInfo.address}</span>
          </div>
          <div>
            <p>{shopInfo.receiptFooter || "মিষ্টি মেলা - স্বাদে ও ঐতিহ্যে অনন্য"}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
