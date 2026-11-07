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
  ShoppingBag,
  Check,
} from "lucide-react";
import { LanguageToggle } from "@/components/shared/LanguageToggle";
import { useHydratedLanguage } from "@/stores/language";
import { toBnDigits } from "@/lib/bangla-numbers";
import {
  BorderBeam,
  InteractiveHoverButton,
  AnimatedTooltip,
  AnimatedRays,
} from "@/components/ui";

export interface ShowcaseProduct {
  id: string;
  name: string;
  unit: string;
  imageUrl?: string | null;
  sellingPrice: number;
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
  const [sortBy, setSortBy] = useState<"default" | "price-asc" | "price-desc">("default");
  const [activeModalProduct, setActiveModalProduct] = useState<ShowcaseProduct | null>(null);
  const [cartNoticeProduct, setCartNoticeProduct] = useState<string | null>(null);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.categoryName) set.add(p.categoryName);
    });
    return Array.from(set);
  }, [products]);

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
          p.categoryName.toLowerCase().includes(q);
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === "price-asc") return a.sellingPrice - b.sellingPrice;
        if (sortBy === "price-desc") return b.sellingPrice - a.sellingPrice;
        return 0;
      });
  }, [products, selectedCategory, searchQuery, sortBy]);

  const cleanPhone = shopInfo.phone.replace(/[^0-9]/g, "") || "01671578965";

  const buildWhatsAppLink = (productName?: string) => {
    const text = productName
      ? encodeURIComponent(
          `আসসালামু আলাইকুম, মিষ্টি মেলা। আমি "${productName}" সম্পর্কে জানতে ও অর্ডার করতে চাচ্ছি।`
        )
      : encodeURIComponent(
          "আসসালামু আলাইকুম, মিষ্টি মেলা। আমি মিষ্টির অর্ডার করতে চাচ্ছি।"
        );
    return `https://wa.me/88${cleanPhone.replace(/^88/, "")}?text=${text}`;
  };

  const handleCartClick = (productName: string) => {
    setCartNoticeProduct(productName);
    setTimeout(() => {
      setCartNoticeProduct(null);
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] text-stone-900 font-sans antialiased selection:bg-stone-900 selection:text-white">
      {/* 1. Staff Bar (when logged in) */}
      {session && (
        <div className="bg-stone-900 text-stone-300 text-xs px-4 py-2 border-b border-stone-800">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>
                {isBn ? "লগইন:" : "Staff:"}{" "}
                <strong className="text-white font-medium">{session.name}</strong>{" "}
                <span className="text-stone-400 font-mono text-xs">({session.role})</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/pos"
                className="px-3 py-1 bg-stone-800 hover:bg-stone-700 text-white rounded text-xs font-medium transition-colors"
              >
                {isBn ? "পিওএস টার্মিনাল" : "POS Terminal"}
              </Link>
              {(session.role === "ADMIN" ||
                session.role === "OWNER" ||
                session.role === "MANAGER") && (
                <Link
                  href="/dashboard"
                  className="px-3 py-1 bg-stone-800 hover:bg-stone-700 text-white rounded text-xs font-medium transition-colors"
                >
                  {isBn ? "ড্যাশবোর্ড" : "Dashboard"}
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. Top Minimal Notice */}
      <div className="border-b border-stone-200 bg-white text-stone-600 text-xs py-2 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-stone-400" />
            <span className="font-medium text-stone-700">
              {isBn ? "মিষ্টি মেলা • ত্রিশাল" : "Mishty Mela • Trishal"}
            </span>
            <span className="text-stone-300">|</span>
            <span className="text-stone-500">
              {isBn
                ? "অনলাইন অর্ডার ও হোম ডেলিভারি পরবর্তী ধাপে যুক্ত হবে। বর্তমানে শপে এসে বা ফোনে অর্ডার গ্রহণ করা হচ্ছে।"
                : "E-commerce checkout coming in the next phase. Currently accepting in-store & phone orders."}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={`tel:${cleanPhone}`}
              className="text-stone-800 font-semibold hover:text-stone-950 flex items-center gap-1"
            >
              <Phone className="w-3 h-3 text-stone-500" />
              <span>{shopInfo.phone}</span>
            </a>
          </div>
        </div>
      </div>

      {/* 3. Navigation Bar */}
      <header className="bg-white/80 backdrop-blur-md border-b border-stone-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-stone-900 text-white flex items-center justify-center font-bold text-sm tracking-tight">
              মি
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold tracking-tight text-stone-900">
                  {isBn ? "মিষ্টি মেলা" : "Mishty Mela"}
                </span>
                <span className="text-xs text-stone-500 font-medium">
                  {isBn ? "ত্রিশাল" : "Trishal"}
                </span>
              </div>
            </div>
          </Link>

          {/* Right controls */}
          <div className="flex items-center gap-3">
            <a
              href="#catalog"
              className="text-xs font-medium text-stone-600 hover:text-stone-900 hidden sm:inline-block px-2 py-1"
            >
              {isBn ? "মূল্য তালিকা" : "Price List"}
            </a>
            <a
              href="#info"
              className="text-xs font-medium text-stone-600 hover:text-stone-900 hidden sm:inline-block px-2 py-1"
            >
              {isBn ? "ঠিকানা" : "Location"}
            </a>

            <div className="h-4 w-px bg-stone-200 hidden sm:block" />

            <LanguageToggle />

            <a
              href={`tel:${cleanPhone}`}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-md transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>{isBn ? "অর্ডার কল" : "Call to Order"}</span>
            </a>

            {!session ? (
              <Link
                href="/login"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-stone-300 hover:border-stone-400 text-stone-700 text-xs font-medium rounded-md transition-colors"
                title={isBn ? "স্টাফ লগইন" : "Staff Login"}
              >
                <LogIn className="w-3.5 h-3.5 text-stone-500" />
                <span className="hidden sm:inline">{isBn ? "লগইন" : "Staff"}</span>
              </Link>
            ) : (
              <Link
                href="/pos"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium rounded-md transition-colors"
              >
                <Store className="w-3.5 h-3.5" />
                <span>POS</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* 4. Editorial Hero Section */}
      <AnimatedRays className="border-b border-stone-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-stone-500 tracking-wider uppercase">
                <span>{isBn ? "ত্রিশাল, ময়মনসিংহ" : "Trishal, Mymensingh"}</span>
                <span>•</span>
                <AnimatedTooltip
                  content={isBn ? "প্রতিদিন ১০০% তাজা ছানা ও গাওয়া ঘিয়ে তৈরি" : "Crafted daily with 100% fresh curd & pure ghee"}
                  variant="cora"
                  accentColor="#d97706"
                  shapeColor="#1c1917"
                >
                  <span className="hover:text-amber-700 transition-colors cursor-pointer border-b border-dashed border-stone-400">
                    {isBn ? "খাঁটি মিষ্টি ও দই ✨" : "Artisanal Sweets & Dairy ✨"}
                  </span>
                </AnimatedTooltip>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-stone-900 leading-[1.15]">
                {isBn ? (
                  <>
                    স্বাদ ও ঐতিহ্যে অনন্য, <br />
                    বিশুদ্ধতার নিশ্চয়তায় মিষ্টি মেলা
                  </>
                ) : (
                  <>
                    Traditional Taste, <br />
                    Pure Ingredients at Mishty Mela
                  </>
                )}
              </h1>

              <p className="text-stone-600 text-sm sm:text-base max-w-2xl leading-relaxed">
                {isBn
                  ? "১০০% খাঁটি গরুর দুধ ও গাওয়া ঘিয়ে প্রস্তুত স্পেশাল রসমালাই, বগুড়ার খাঁটি দই, রসগোল্লা, চমচম ও মতিচুর লাড্ডু। প্রতিটি ব্যাচ প্রতিদিন তাজা তৈরি করা হয়।"
                  : "Handcrafted fresh daily with 100% pure cow milk and artisanal ghee. Featuring our signature Rasmalai, Bogra Doi, Rosogolla, Chomchom, and Motichur Laddu."}
              </p>

              {/* Call-to-actions */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href={`tel:${cleanPhone}`}
                  className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-md text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2 shadow-xs"
                >
                  <Phone className="w-4 h-4" />
                  <span>
                    {isBn ? "সরাসরি অর্ডার কল: " : "Call: "}
                    {shopInfo.phone}
                  </span>
                </a>

                <a
                  href={buildWhatsAppLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 bg-white border border-stone-300 hover:border-stone-400 text-stone-800 rounded-md text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>{isBn ? "হোয়াটসঅ্যাপ" : "WhatsApp"}</span>
                </a>

                <a href="#catalog" className="inline-block">
                  <InteractiveHoverButton className="bg-amber-50/60 border-amber-300 hover:border-stone-900 text-stone-900 text-xs sm:text-sm py-2 px-5">
                    {isBn ? "মূল্য তালিকা দেখুন" : "View Price List"}
                  </InteractiveHoverButton>
                </a>
              </div>
            </div>

            {/* Quick Overview Card with Vengeance UI Border Beam */}
            <div className="lg:col-span-4">
              <div className="relative overflow-hidden bg-[#f5f5f4] border border-stone-200 rounded-xl p-5 space-y-4 shadow-xs">
                <BorderBeam
                  size={240}
                  duration={14}
                  colorFrom="#f59e0b"
                  colorTo="#b45309"
                  borderWidth={1.5}
                />
                <div>
                  <span className="text-xs font-bold text-stone-600 uppercase tracking-wider block mb-1">
                    {isBn ? "দোকানের তথ্য" : "Shop Overview"}
                  </span>
                  <h2 className="text-base font-bold text-stone-900">
                    {shopInfo.name}
                  </h2>
                </div>

                <div className="space-y-2 text-xs text-stone-600 border-t border-stone-200/80 pt-3">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-stone-500 shrink-0 mt-0.5" />
                    <span>{shopInfo.address || "ত্রিশাল, ময়মনসিংহ"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                    <span>{isBn ? "সকাল ৮:০০ – রাত ১০:০০ (প্রতিদিন)" : "8:00 AM – 10:00 PM (Daily)"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                    <span className="font-mono">{shopInfo.phone}</span>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-lg border border-stone-200 text-xs">
                  <p className="font-semibold text-stone-800 mb-0.5">
                    {isBn ? "পরবর্তী ধাপ (Next Phase):" : "Next Phase:"}
                  </p>
                  <p className="text-stone-500 text-xs leading-relaxed">
                    {isBn
                      ? "অনলাইন শপিং কার্ট, বিকাশ পেমেন্ট ও হোম ডেলিভারি শীঘ্রই চালু হচ্ছে।"
                      : "Direct online checkout, bKash payment, and delivery launching next."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AnimatedRays>

      {/* 5. Catalog & Price List */}
      <section id="catalog" className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 pb-4 border-b border-stone-200">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900">
              {isBn ? "মিষ্টি ও পণ্যের মূল্য তালিকা" : "Sweet Catalog & Price List"}
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              {isBn
                ? "আমাদের শোরুমের লাইভ বিক্রয়মূল্য"
                : "Current retail prices at our Trishal shop"}
            </p>
          </div>

          <div className="text-xs text-stone-500">
            {isBn ? "মোট মিষ্টি: " : "Items: "}
            <strong className="text-stone-900 font-semibold">{filteredProducts.length}</strong>
          </div>
        </div>

        {/* Search & Category Filter Controls */}
        <div className="space-y-3 mb-8">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  isBn
                    ? "মিষ্টি খুঁজুন (যেমন: চমচম, রসমালাই, দই)..."
                    : "Search sweets (e.g. Chomchom, Rasmalai, Doi)..."
                }
                className="w-full pl-9 pr-8 py-2 bg-white border border-stone-200 rounded-md text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:border-stone-900 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="w-full sm:w-48">
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="w-full py-2 px-3 bg-white border border-stone-200 rounded-md text-xs text-stone-700 focus:outline-hidden focus:border-stone-900"
              >
                <option value="default">{isBn ? "ডিফল্ট তালিকা" : "Default"}</option>
                <option value="price-asc">{isBn ? "মূল্য: কম থেকে বেশি" : "Price: Low to High"}</option>
                <option value="price-desc">{isBn ? "মূল্য: বেশি থেকে কম" : "Price: High to Low"}</option>
              </select>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => setSelectedCategory("ALL")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                selectedCategory === "ALL"
                  ? "bg-stone-900 text-white"
                  : "bg-white border border-stone-200 text-stone-600 hover:text-stone-900 hover:border-stone-300"
              }`}
            >
              {isBn ? "সকল মিষ্টি" : "All"} ({products.length})
            </button>
            {categories.map((cat) => {
              const count = products.filter((p) => p.categoryName === cat).length;
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    isSelected
                      ? "bg-stone-900 text-white"
                      : "bg-white border border-stone-200 text-stone-600 hover:text-stone-900 hover:border-stone-300"
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Cards Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-white border border-stone-200 rounded-xl p-8">
            <p className="text-sm font-semibold text-stone-800">
              {isBn ? "কোনো মিষ্টি পাওয়া যায়নি" : "No products found"}
            </p>
            <p className="text-xs text-stone-500 mt-1">
              {isBn
                ? "অনুগ্রহ করে অন্য নাম দিয়ে খুঁজুন অথবা ক্যাটাগরি ফিল্টার পরিবর্তন করুন।"
                : "Please adjust your search keyword or category filter."}
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("ALL");
              }}
              className="mt-3 px-3 py-1.5 bg-stone-900 text-white text-xs font-medium rounded-md hover:bg-stone-800"
            >
              {isBn ? "রিসেট করুন" : "Reset Filters"}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((p) => {
              const unitDisplay = isBn
                ? p.unit === "kg"
                  ? "কেজি"
                  : p.unit === "pot"
                  ? "হাঁড়ি"
                  : p.unit === "pcs"
                  ? "পিস"
                  : p.unit
                : p.unit;

              return (
                <div
                  key={p.id}
                  className="bg-white border border-stone-200 rounded-xl p-4 flex flex-col justify-between hover:border-stone-400 transition-colors"
                >
                  {/* Top info */}
                  <div className="space-y-3">
                    {/* Optional Product Image */}
                    {p.imageUrl && (
                      <div
                        onClick={() => setActiveModalProduct(p)}
                        className="w-full aspect-4/3 rounded-lg overflow-hidden bg-stone-100 cursor-pointer border border-stone-100 mb-2 relative group/img"
                      >
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-stone-600 bg-stone-100 px-2 py-0.5 rounded">
                        {p.categoryName}
                      </span>
                      <span className="text-xs text-stone-500 font-mono">
                        {p.inStock ? (
                          <span className="text-emerald-700 flex items-center gap-1 font-sans font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {isBn ? "স্টকে আছে" : "In Stock"}
                          </span>
                        ) : (
                          <span className="text-stone-400">
                            {isBn ? "প্রস্তুত হচ্ছে" : "Preparing"}
                          </span>
                        )}
                      </span>
                    </div>

                    <div>
                      <h3
                        onClick={() => setActiveModalProduct(p)}
                        className="text-base sm:text-lg font-bold text-stone-900 hover:underline cursor-pointer leading-snug"
                      >
                        {p.name}
                      </h3>
                    </div>

                    {/* Price Block */}
                    <div className="pt-2 border-t border-stone-100 flex items-baseline justify-between">
                      <span className="text-xs font-bold text-stone-600">
                        {isBn ? "বিক্রয়মূল্য" : "Price"}
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm font-bold text-amber-700">৳</span>
                        <span className="text-2xl font-black text-stone-900 tabular-nums">
                          {isBn ? toBnDigits(p.sellingPrice) : p.sellingPrice}
                        </span>
                        <span className="text-xs font-bold text-stone-600">
                          / {unitDisplay}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2 pt-4 border-t border-stone-100 mt-4">
                    {/* Next phase cart preview */}
                    <button
                      type="button"
                      onClick={() => handleCartClick(p.name)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200 rounded-lg text-xs font-bold transition-colors"
                      title={isBn ? "ই-কমার্স ফিচার পরবর্তী ধাপে আসছে" : "Cart coming in next phase"}
                    >
                      <ShoppingBag className="w-3.5 h-3.5 text-stone-600" />
                      <span>{isBn ? "অনলাইন কার্ট (Phase 2)" : "Add to Cart (Phase 2)"}</span>
                    </button>

                    {/* Call & WhatsApp actions */}
                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href={`tel:${cleanPhone}`}
                        className="flex items-center justify-center gap-1.5 py-2.5 px-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs sm:text-sm font-bold transition-colors shadow-xs"
                        title={isBn ? "ফোনে অর্ডার করুন" : "Call to order"}
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>{isBn ? "কল করুন" : "Call"}</span>
                      </a>

                      <a
                        href={buildWhatsAppLink(p.name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 py-2.5 px-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs sm:text-sm font-bold transition-colors shadow-xs"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>{isBn ? "হোয়াটসঅ্যাপ" : "WhatsApp"}</span>
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bulk Event Orders Notice */}
        <div className="mt-12 bg-white border border-stone-200 rounded-xl p-6 sm:p-8">
          <div className="max-w-2xl space-y-2">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">
              {isBn ? "অনুষ্ঠানের জন্য মিষ্টির অগ্রিম অর্ডার" : "Event & Bulk Orders"}
            </span>
            <h3 className="text-lg sm:text-xl font-bold text-stone-900">
              {isBn
                ? "বিয়ে, জন্মদিন বা পারিবারিক যেকোনো আয়োজনের মিষ্টি"
                : "Pre-order custom sweet boxes for weddings and celebrations"}
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              {isBn
                ? "১০ কেজি বা তদূর্ধ্ব মিষ্টির পাইকারি অর্ডারে বিশেষ মূল্যছাড় ও আকর্ষণীয় বক্স প্যাকেজিং সুবিধা দেওয়া হয়। অগ্রিম বুকিংয়ের জন্য মালিকের সাথে সরাসরি যোগাযোগ করুন।"
                : "Special volume discounts and customized box packaging for bulk orders. Contact owner Abu Foysal Tarafdar directly."}
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-3">
              <a
                href={`tel:${cleanPhone}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-md transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{shopInfo.phone}</span>
              </a>
              <a
                href={buildWhatsAppLink("অনুষ্ঠানের জন্য পাইকারি মিষ্টির অর্ডার")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-stone-300 hover:border-stone-400 text-stone-800 text-xs font-medium rounded-md transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isBn ? "হোয়াটসঅ্যাপে বুকিং" : "WhatsApp Booking"}</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Location & Contact Details */}
      <section id="info" className="border-t border-stone-200 bg-white py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-xs text-stone-600">
            {/* Address */}
            <div className="space-y-2">
              <span className="font-bold text-stone-900 uppercase tracking-wider block text-xs">
                {isBn ? "শোরুমের ঠিকানা" : "Showroom Address"}
              </span>
              <p className="text-sm font-semibold text-stone-800">
                {shopInfo.name}
              </p>
              <p>{shopInfo.address || "ত্রিশাল, ময়মনসিংহ"}</p>
            </div>

            {/* Hours */}
            <div className="space-y-2">
              <span className="font-bold text-stone-900 uppercase tracking-wider block text-xs">
                {isBn ? "সময়সূচি" : "Hours"}
              </span>
              <p className="text-sm font-semibold text-stone-800">
                {isBn ? "প্রতিদিন সকাল ৮:০০টা – রাত ১০:০০টা" : "Daily 8:00 AM – 10:00 PM"}
              </p>
              <p>{isBn ? "সপ্তাহের ৭ দিনই খোলা থাকে" : "Open all 7 days a week"}</p>
            </div>

            {/* Direct Contact */}
            <div className="space-y-2">
              <span className="font-bold text-stone-900 uppercase tracking-wider block text-xs">
                {isBn ? "যোগাযোগ ও স্বত্বাধিকারী" : "Owner & Contact"}
              </span>
              <p className="text-sm font-semibold text-stone-800">
                আবু ফয়সাল তরফদার (জেহান)
              </p>
              <p>
                <a href={`tel:${cleanPhone}`} className="hover:underline font-mono">
                  {shopInfo.phone}
                </a>
              </p>
              <p className="text-stone-400 font-mono text-xs">
                {shopInfo.email}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="border-t border-stone-200 bg-[#f5f5f4] text-stone-500 text-xs py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <span>© 2026 {shopInfo.name}. </span>
            <span className="text-stone-400">
              {shopInfo.receiptFooter || "স্বাদে ও ঐতিহ্যে অনন্য"}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <a href="#catalog" className="hover:text-stone-900 transition-colors">
              {isBn ? "ক্যাটালগ" : "Catalog"}
            </a>
            <span className="text-stone-300">•</span>
            <Link
              href="/login"
              className="hover:text-stone-900 transition-colors inline-flex items-center gap-1"
            >
              <LogIn className="w-3 h-3 text-stone-400" />
              <span>{isBn ? "স্টাফ পোর্টাল" : "Staff Portal"}</span>
            </Link>
          </div>
        </div>
      </footer>

      {/* Product Detail Modal */}
      {activeModalProduct && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 border border-stone-200 shadow-xl space-y-4">
            {activeModalProduct.imageUrl && (
              <div className="w-full aspect-16/10 rounded-lg overflow-hidden bg-stone-100 border border-stone-100">
                <img
                  src={activeModalProduct.imageUrl}
                  alt={activeModalProduct.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-xs font-medium text-stone-600 bg-stone-100 px-2.5 py-0.5 rounded">
                  {activeModalProduct.categoryName}
                </span>
                <h3 className="text-base font-bold text-stone-900 mt-1">
                  {activeModalProduct.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalProduct(null)}
                className="p-1 text-stone-400 hover:text-stone-600 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 flex items-baseline justify-between">
              <span className="text-xs text-stone-600 font-medium">
                {isBn ? "বিক্রয়মূল্য" : "Price"}
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-xs text-stone-400">৳</span>
                <span className="text-2xl font-bold text-stone-900 tabular-nums">
                  {isBn ? toBnDigits(activeModalProduct.sellingPrice) : activeModalProduct.sellingPrice}
                </span>
                <span className="text-xs text-stone-500">
                  / {activeModalProduct.unit}
                </span>
              </div>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              {isBn
                ? "১০০% খাঁটি উপাদানে প্রস্তুত। সরাসরি মিষ্টি মেলা ত্রিশাল শোরুমে এসে সংগ্রহ করতে পারবেন অথবা কল দিয়ে অগ্রিম বুকিং দিতে পারেন।"
                : "Handcrafted with pure ingredients. Available for immediate pickup at our Trishal shop or phone booking."}
            </p>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <a
                href={`tel:${cleanPhone}`}
                className="py-2 px-3 bg-stone-900 hover:bg-stone-800 text-white rounded text-xs font-semibold text-center flex items-center justify-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{isBn ? "কল করুন" : "Call"}</span>
              </a>

              <a
                href={buildWhatsAppLink(activeModalProduct.name)}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 px-3 border border-stone-200 hover:border-stone-300 text-stone-800 rounded text-xs font-medium text-center flex items-center justify-center gap-1.5"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Cart Notification Popup */}
      {cartNoticeProduct && (
        <div className="fixed bottom-5 right-5 z-50 bg-stone-900 text-white text-xs p-3.5 rounded-lg shadow-xl border border-stone-800 max-w-sm flex items-start gap-2.5">
          <div className="w-5 h-5 rounded-full bg-stone-800 text-stone-300 flex items-center justify-center shrink-0 mt-0.5">
            <ShoppingBag className="w-3 h-3" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-white">
              {isBn ? "অনলাইন কার্ট পরবর্তী ধাপে চালু হবে" : "Cart coming in next phase"}
            </p>
            <p className="text-stone-400 text-xs mt-0.5">
              {isBn ? (
                <>
                  "{cartNoticeProduct}" অর্ডার করতে কল করুন{" "}
                  <a href={`tel:${cleanPhone}`} className="text-stone-200 underline font-mono">
                    {shopInfo.phone}
                  </a>
                </>
              ) : (
                <>
                  To order "{cartNoticeProduct}", call{" "}
                  <a href={`tel:${cleanPhone}`} className="text-stone-200 underline font-mono">
                    {shopInfo.phone}
                  </a>
                </>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCartNoticeProduct(null)}
            className="text-stone-400 hover:text-white p-0.5"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}
