"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Phone,
  MessageCircle,
  MapPin,
  Clock,
  Sparkles,
  ShoppingBag,
  Store,
  ArrowRight,
  Search,
  CheckCircle2,
  Info,
  X,
  Star,
  Award,
  Truck,
  Flame,
  LogIn,
  LayoutDashboard,
  ExternalLink,
  ChevronRight,
  UtensilsCrossed,
} from "lucide-react";
import { LanguageToggle } from "@/components/shared/LanguageToggle";
import { useHydratedLanguage } from "@/stores/language";

export interface ShowcaseProduct {
  id: string;
  name: string;
  unit: string;
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

// Visual themes for different sweets
function getSweetCardTheme(name: string, category: string) {
  const lower = (name + " " + category).toLowerCase();
  if (lower.includes("doi") || lower.includes("দই")) {
    return {
      gradient: "from-amber-600/15 via-orange-50 to-amber-100/50",
      border: "border-amber-200",
      accent: "text-amber-800",
      badgeBg: "bg-amber-100 text-amber-800 border-amber-300",
      iconEmoji: "🏺",
      taglineBn: "মাটির হাঁড়ির খাঁটি মিষ্টি দই",
      taglineEn: "Traditional Clay-Pot Sweet Yogurt",
    };
  }
  if (lower.includes("rasmalai") || lower.includes("রসমালাই")) {
    return {
      gradient: "from-yellow-500/15 via-amber-50 to-yellow-100/50",
      border: "border-yellow-200",
      accent: "text-amber-900",
      badgeBg: "bg-yellow-100 text-yellow-800 border-yellow-300",
      iconEmoji: "🥛",
      taglineBn: "গাঢ় মালাই ও নরম রসমালাই",
      taglineEn: "Rich Clotted Cream & Soft Rasmalai",
    };
  }
  if (lower.includes("barfi") || lower.includes("বরফি")) {
    return {
      gradient: "from-emerald-500/15 via-slate-50 to-emerald-100/50",
      border: "border-emerald-200",
      accent: "text-emerald-900",
      badgeBg: "bg-emerald-100 text-emerald-800 border-emerald-300",
      iconEmoji: "✨",
      taglineBn: "খাঁটি কাজু বাদাম ও রূপালী তবক",
      taglineEn: "Premium Cashew & Silver Leaf",
    };
  }
  if (lower.includes("laddu") || lower.includes("লাড্ডু")) {
    return {
      gradient: "from-orange-500/15 via-amber-50 to-orange-100/50",
      border: "border-orange-200",
      accent: "text-orange-900",
      badgeBg: "bg-orange-100 text-orange-800 border-orange-300",
      iconEmoji: "🟠",
      taglineBn: "ঘিয়ে ভাজা মতিচুর দানার লাড্ডু",
      taglineEn: "Pure Ghee Motichur Pearls",
    };
  }
  if (lower.includes("chomchom") || lower.includes("চমচম")) {
    return {
      gradient: "from-rose-500/15 via-amber-50 to-orange-100/50",
      border: "border-rose-200",
      accent: "text-rose-900",
      badgeBg: "bg-rose-100 text-rose-800 border-rose-300",
      iconEmoji: "🍯",
      taglineBn: "মাওয়া জড়ানো ঐতিহ্যবাহী চমচম",
      taglineEn: "Mawa-Coated Traditional Chomchom",
    };
  }
  return {
    gradient: "from-rose-500/10 via-pink-50 to-amber-50/50",
    border: "border-rose-100",
    accent: "text-rose-900",
    badgeBg: "bg-rose-100 text-rose-800 border-rose-200",
    iconEmoji: "🍬",
    taglineBn: "শতভাগ খাঁটি ছানা ও গাওয়া ঘি",
    taglineEn: "100% Pure Chhana & Ghee",
  };
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
  const [selectedProduct, setSelectedProduct] = useState<ShowcaseProduct | null>(null);
  const [showEcommerceToast, setShowEcommerceToast] = useState(false);
  const [toastSweetName, setToastSweetName] = useState("");

  // Unique categories list
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
        const query = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !query ||
          p.name.toLowerCase().includes(query) ||
          p.categoryName.toLowerCase().includes(query);
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === "price-asc") return a.sellingPrice - b.sellingPrice;
        if (sortBy === "price-desc") return b.sellingPrice - a.sellingPrice;
        return 0;
      });
  }, [products, selectedCategory, searchQuery, sortBy]);

  const handleCartClick = (sweetName: string) => {
    setToastSweetName(sweetName);
    setShowEcommerceToast(true);
    setTimeout(() => {
      setShowEcommerceToast(false);
    }, 4500);
  };

  const cleanPhone = shopInfo.phone.replace(/[^0-9]/g, "") || "01671578965";
  const whatsappUrl = (productName?: string) => {
    const text = productName
      ? encodeURIComponent(
          `আসসালামু আলাইকুম মিষ্টি মেলা, আমি "${productName}" সম্পর্কে জানতে ও অর্ডার করতে চাই।`
        )
      : encodeURIComponent(
          "আসসালামু আলাইকুম মিষ্টি মেলা, আমি মিষ্টির অর্ডার করতে চাই।"
        );
    return `https://wa.me/88${cleanPhone.replace(/^88/, "")}?text=${text}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-rose-500 selection:text-white">
      {/* 1. Admin/Staff Bar if user is logged in */}
      {session && (
        <div className="bg-slate-900 text-white px-4 py-2 text-xs flex flex-wrap items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              {isBn ? "লগইন আছেন:" : "Logged in as:"}{" "}
              <strong className="text-emerald-400">{session.name}</strong> (
              {session.role})
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/pos"
              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-md transition-colors flex items-center gap-1.5"
            >
              <Store className="w-3.5 h-3.5" />
              <span>{isBn ? "পিওএস টার্মিনাল" : "POS Terminal"}</span>
            </Link>
            {(session.role === "ADMIN" ||
              session.role === "OWNER" ||
              session.role === "MANAGER") && (
              <Link
                href="/dashboard"
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-md transition-colors flex items-center gap-1.5"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>{isBn ? "ম্যানেজমেন্ট ড্যাশবোর্ড" : "Dashboard"}</span>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* 2. Public Announcement Bar - Next Phase E-Commerce Notice */}
      <div className="bg-gradient-to-r from-rose-700 via-rose-600 to-amber-600 text-white px-4 py-2.5 text-xs font-medium shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-[11px] font-bold tracking-wide uppercase">
              {isBn ? "পরবর্তী ধাপ" : "Next Phase"}
            </span>
            <span>
              {isBn
                ? "🚀 অনলাইন অর্ডার ও হোম ডেলিভারি (E-Commerce) শীঘ্রই চালু হচ্ছে! বর্তমানে ফোনে বা শোরুমে অর্ডার গ্রহণ করা হচ্ছে।"
                : "🚀 Online ordering & home delivery (E-Commerce) coming in next phase! Currently accepting orders via phone & store."}
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <a
              href={`tel:${cleanPhone}`}
              className="inline-flex items-center gap-1.5 font-bold hover:underline bg-white/10 hover:bg-white/20 px-2.5 py-0.5 rounded-full transition-colors"
            >
              <Phone className="w-3 h-3" />
              <span>{shopInfo.phone}</span>
            </a>
          </div>
        </div>
      </div>

      {/* 3. Header & Navigation */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Logo / Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-600 to-amber-600 flex items-center justify-center text-white shadow-md shadow-rose-200 group-hover:scale-105 transition-transform">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight group-hover:text-rose-600 transition-colors">
                  {isBn ? "মিষ্টি মেলা" : "Mishty Mela"}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 text-[11px] font-bold border border-rose-200">
                  {isBn ? "ত্রিশাল" : "Trishal"}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {isBn
                  ? "ঐতিহ্যবাহী মিষ্টি ও সুস্বাদু দইয়ের সমাহার"
                  : "Traditional Sweets & Fresh Dairy"}
              </p>
            </div>
          </Link>

          {/* Nav links & CTA */}
          <div className="flex items-center gap-3 sm:gap-4">
            <a
              href="#catalog"
              className="hidden md:inline-flex text-sm font-semibold text-slate-700 hover:text-rose-600 transition-colors"
            >
              {isBn ? "মিষ্টির তালিকা ও মূল্য" : "Menu & Prices"}
            </a>
            <a
              href="#contact"
              className="hidden lg:inline-flex text-sm font-semibold text-slate-700 hover:text-rose-600 transition-colors"
            >
              {isBn ? "ঠিকানা ও যোগাযোগ" : "Location"}
            </a>

            <div className="h-6 w-px bg-slate-200 hidden md:block" />

            <LanguageToggle />

            {/* Order Phone CTA */}
            <a
              href={`tel:${cleanPhone}`}
              className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-rose-200 transition-transform active:scale-95"
            >
              <Phone className="w-4 h-4" />
              <span>{isBn ? "অর্ডার করুন" : "Order Now"}</span>
            </a>

            {/* Staff / Login link */}
            {!session ? (
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                title={isBn ? "স্টাফ / পিওএস লগইন" : "Staff / POS Login"}
              >
                <LogIn className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">
                  {isBn ? "স্টাফ লগইন" : "Staff"}
                </span>
              </Link>
            ) : (
              <Link
                href="/pos"
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs"
              >
                <Store className="w-3.5 h-3.5" />
                <span>{isBn ? "পিওএস" : "POS"}</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* 4. Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-rose-50/60 via-amber-50/30 to-white py-14 sm:py-20 border-b border-slate-200/60">
        <div className="absolute inset-0 bg-[radial-gradient(#f43f5e_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-100/80 border border-rose-200 text-rose-800 text-xs font-bold tracking-wide">
                <Sparkles className="w-3.5 h-3.5 text-rose-600 animate-spin" />
                <span>
                  {isBn
                    ? "ত্রিশালের সেরা খাঁটি মিষ্টি ও দই"
                    : "Trishal's Authentic Sweet Heritage"}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight sm:leading-none">
                {isBn ? (
                  <>
                    স্বাদ ও ঐতিহ্যে অনন্য <br />
                    <span className="bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent">
                      মিষ্টি মেলা (ত্রিশাল)
                    </span>
                  </>
                ) : (
                  <>
                    Authentic & Pure <br />
                    <span className="bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent">
                      Mishty Mela (Trishal)
                    </span>
                  </>
                )}
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                {isBn
                  ? "১০০% খাঁটি গরুর দুধ, নির্ভেজাল ছানা ও প্রিমিয়াম গাওয়া ঘিয়ে তৈরি সুস্বাদু রসগোল্লা, চমচম, স্পেশাল রসমালাই, বগুড়ার খাঁটি দই ও মতিচুর লাড্ডু।"
                  : "Handcrafted everyday with 100% pure cow milk, fresh chhana and pure ghee. Indulge in our famous Rosogolla, Chomchom, Rasmalai, Bogra Doi, and Kaju Barfi."}
              </p>

              {/* Value Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 max-w-lg mx-auto lg:mx-0">
                <div className="p-3 rounded-xl bg-white/90 border border-slate-200/80 shadow-2xs text-left">
                  <div className="text-rose-600 font-bold text-xs flex items-center gap-1.5 mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isBn ? "১০০% নির্ভেজাল" : "100% Pure"}</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {isBn ? "খাঁটি দুধ ও গাওয়া ঘি" : "Pure milk & cow ghee"}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white/90 border border-slate-200/80 shadow-2xs text-left">
                  <div className="text-amber-600 font-bold text-xs flex items-center gap-1.5 mb-1">
                    <Flame className="w-3.5 h-3.5" />
                    <span>{isBn ? "তাজা ব্যাচ" : "Fresh Batch"}</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {isBn ? "প্রতিদিন নতুন প্রস্তুত" : "Prepared fresh daily"}
                  </p>
                </div>

                <div className="col-span-2 sm:col-span-1 p-3 rounded-xl bg-white/90 border border-slate-200/80 shadow-2xs text-left">
                  <div className="text-emerald-600 font-bold text-xs flex items-center gap-1.5 mb-1">
                    <Award className="w-3.5 h-3.5" />
                    <span>{isBn ? "অনুষ্ঠানের অর্ডার" : "Event Orders"}</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {isBn ? "বিয়ে ও জন্মদিনের স্পেশাল" : "Wedding & party boxes"}
                  </p>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-4">
                <a
                  href={`tel:${cleanPhone}`}
                  className="px-6 py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-rose-200 flex items-center gap-2 transition-all hover:-translate-y-0.5 active:translate-y-0"
                >
                  <Phone className="w-4 h-4" />
                  <span>
                    {isBn ? "সরাসরি কল: " : "Call to Order: "} {shopInfo.phone}
                  </span>
                </a>

                <a
                  href={whatsappUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-200 flex items-center gap-2 transition-all hover:-translate-y-0.5 active:translate-y-0"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{isBn ? "হোয়াটসঅ্যাপে অর্ডার" : "WhatsApp Order"}</span>
                </a>

                <a
                  href="#catalog"
                  className="px-5 py-3.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl font-bold text-sm shadow-xs transition-colors"
                >
                  {isBn ? "মূল্য তালিকা দেখুন ↓" : "View Catalog & Prices ↓"}
                </a>
              </div>
            </div>

            {/* Right Card: E-Commerce Coming Next Phase Banner */}
            <div className="lg:col-span-5">
              <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-rose-950 text-white p-7 sm:p-8 rounded-3xl shadow-2xl border border-slate-700/60 overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

                <div className="relative space-y-5">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-rose-500 text-white text-[11px] font-extrabold tracking-wider uppercase flex items-center gap-1.5 shadow-md shadow-rose-900/50">
                      <Sparkles className="w-3 h-3" />
                      {isBn ? "পরবর্তী ধাপ (Phase 2)" : "Next Phase"}
                    </span>
                    <span className="text-xs font-semibold text-amber-300 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {isBn ? "শীঘ্রই উন্মোচন" : "Launching Soon"}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
                      {isBn
                        ? "মিষ্টি মেলার পূর্ণাঙ্গ ই-কমার্স প্ল্যাটফর্ম"
                        : "Mishty Mela Full E-Commerce Platform"}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                      {isBn
                        ? "খুব শীঘ্রই চালু হচ্ছে ওয়েবসাইট থেকে সরাসরি অনলাইন কার্টে অর্ডার, বিকাশ/নগদ পেমেন্ট ও ত্রিশালে হোম ডেলিভারি সেবা!"
                        : "Direct online shopping cart, bKash/Nagad digital checkout, and express home delivery across Trishal coming next!"}
                    </p>
                  </div>

                  {/* Feature preview list */}
                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-start gap-2.5 text-xs text-slate-200">
                      <div className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
                        <ShoppingBag className="w-3 h-3" />
                      </div>
                      <span>
                        <strong>{isBn ? "অনলাইন কার্ট:" : "Online Cart:"}</strong>{" "}
                        {isBn
                          ? "পছন্দের মিষ্টি সহজে সিলেক্ট করে কার্টে যোগ"
                          : "Easy cart addition with custom weight selection"}
                      </span>
                    </div>

                    <div className="flex items-start gap-2.5 text-xs text-slate-200">
                      <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Truck className="w-3 h-3" />
                      </div>
                      <span>
                        <strong>{isBn ? "এক্সপ্রেস ডেলিভারি:" : "Express Delivery:"}</strong>{" "}
                        {isBn
                          ? "ত্রিশাল ও সংলগ্ন এলাকায় দ্রুত হোম ডেলিভারি"
                          : "Fast fresh sweet delivery in Trishal area"}
                      </span>
                    </div>

                    <div className="flex items-start gap-2.5 text-xs text-slate-200">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-3 h-3" />
                      </div>
                      <span>
                        <strong>{isBn ? "ডিজিটাল পেমেন্ট:" : "Digital Payments:"}</strong>{" "}
                        {isBn
                          ? "বিকাশ, নগদ, রকেট ও কার্ডে মূল্য পরিশোধের সুবিধা"
                          : "Seamless bKash, Nagad, Card and Cash-on-Delivery"}
                      </span>
                    </div>
                  </div>

                  {/* Current Ordering Guide Box */}
                  <div className="p-4 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-xs">
                    <p className="text-[11px] font-bold text-amber-300 uppercase tracking-wider mb-1">
                      {isBn ? "বর্তমান অর্ডার ব্যবস্থা" : "Current Ordering Mode"}
                    </p>
                    <p className="text-xs text-slate-200">
                      {isBn
                        ? "ক্যাটালগ থেকে মূল্য ও মিষ্টি দেখে সরাসরি আমাদের হটলাইনে ফোন দিয়ে বা হোয়াটসঅ্যাপে মেসেজ পাঠিয়ে অর্ডার কনফার্ম করতে পারবেন।"
                        : "Browse live prices below and call our hotline or message on WhatsApp to place your order directly."}
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <a
                        href={`tel:${cleanPhone}`}
                        className="w-full py-2 px-3 bg-white text-slate-900 rounded-lg text-xs font-bold text-center hover:bg-slate-100 transition-colors"
                      >
                        📞 {shopInfo.phone}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Live Sweet Catalog Section */}
      <section id="catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 w-full flex-1">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-rose-600 font-bold text-xs uppercase tracking-wider mb-1">
              <UtensilsCrossed className="w-4 h-4" />
              <span>{isBn ? "মিষ্টির তালিকা ও সরাসরি মূল্য" : "Sweet Catalog & Live Prices"}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {isBn ? "আমাদের সেরা মিষ্টি ও দুগ্ধজাত পণ্য" : "Our Handcrafted Sweets & Dairy"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
              {isBn
                ? "দোকানের লাইভ ডেটাবেজ থেকে সর্বশেষ হালনাগাদকৃত বিক্রয়মূল্য"
                : "Live synchronized retail prices directly from the store inventory"}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs self-start md:self-auto">
            <span>{isBn ? "মোট প্রদর্শিত:" : "Showing:"}</span>
            <span className="text-rose-600 font-bold">{filteredProducts.length}</span>
            <span>{isBn ? "টি মিষ্টি" : "items"}</span>
          </div>
        </div>

        {/* Search, Category Filters, and Sort controls */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs mb-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Search Input */}
            <div className="md:col-span-8 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  isBn
                    ? "মিষ্টির নাম বা ক্যাটাগরি দিয়ে খুঁজুন (যেমন: চমচম, রসমালাই, দই)..."
                    : "Search sweet name or category (e.g. Chomchom, Rasmalai, Doi)..."
                }
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Price Sort */}
            <div className="md:col-span-4">
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              >
                <option value="default">
                  {isBn ? "সাজান: ডিফল্ট ক্যাটালগ" : "Sort: Default Catalog"}
                </option>
                <option value="price-asc">
                  {isBn ? "মূল্য: কম থেকে বেশি (Low to High)" : "Price: Low to High"}
                </option>
                <option value="price-desc">
                  {isBn ? "মূল্য: বেশি থেকে কম (High to Low)" : "Price: High to Low"}
                </option>
              </select>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setSelectedCategory("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedCategory === "ALL"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {isBn ? "সকল মিষ্টি" : "All Sweets"} ({products.length})
            </button>
            {categories.map((cat) => {
              const count = products.filter((p) => p.categoryName === cat).length;
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    isSelected
                      ? "bg-rose-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Sweet Cards Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8">
            <Store className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">
              {isBn ? "কোনো মিষ্টি পাওয়া যায়নি" : "No sweets found"}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {isBn
                ? "অনুগ্রহ করে অন্য কোনো নাম দিয়ে সার্চ করুন অথবা ক্যাটাগরি ফিল্টার পরিবর্তন করুন।"
                : "Try searching with a different keyword or reset the category filter."}
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("ALL");
              }}
              className="mt-4 px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-lg hover:bg-rose-700 transition-colors"
            >
              {isBn ? "ফিল্টার রিসেট করুন" : "Reset Filters"}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((p) => {
              const theme = getSweetCardTheme(p.name, p.categoryName);
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
                  className={`group bg-white rounded-2xl border ${theme.border} hover:shadow-xl hover:border-rose-300 transition-all duration-200 flex flex-col overflow-hidden relative`}
                >
                  {/* Card Visual Header */}
                  <div
                    className={`h-36 bg-gradient-to-br ${theme.gradient} p-4 flex flex-col justify-between relative overflow-hidden border-b ${theme.border}`}
                  >
                    <div className="flex items-center justify-between relative z-10">
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${theme.badgeBg} truncate max-w-[150px] shadow-2xs`}
                      >
                        {p.categoryName}
                      </span>
                      <span className="text-2xl drop-shadow-sm select-none">
                        {theme.iconEmoji}
                      </span>
                    </div>

                    <div className="relative z-10">
                      <span className="text-[11px] font-semibold text-slate-600 block mb-0.5">
                        {isBn ? theme.taglineBn : theme.taglineEn}
                      </span>
                    </div>

                    {/* Fresh batch status tag */}
                    <div className="absolute -bottom-2.5 right-3 z-10">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-emerald-700 border border-emerald-200 shadow-xs">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>{isBn ? "তাজা প্রস্তুত" : "Fresh Batch"}</span>
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <h3
                        onClick={() => setSelectedProduct(p)}
                        className="text-base font-bold text-slate-900 group-hover:text-rose-600 transition-colors line-clamp-2 cursor-pointer"
                        title={p.name}
                      >
                        {p.name}
                      </h3>

                      {/* Price Tag */}
                      <div className="mt-3 flex items-baseline gap-1.5">
                        <span className="text-xs font-semibold text-slate-400">৳</span>
                        <span className="text-2xl font-black text-slate-900 tracking-tight tabular-nums">
                          {p.sellingPrice.toLocaleString("bn-BD")}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          / {unitDisplay}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      {/* E-Commerce Cart Preview Button */}
                      <button
                        type="button"
                        onClick={() => handleCartClick(p.name)}
                        className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all active:scale-98"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>
                          {isBn ? "+ কার্টে যোগ (Next Phase)" : "+ Add to Cart (Next Phase)"}
                        </span>
                      </button>

                      {/* Direct Phone / WhatsApp order row */}
                      <div className="grid grid-cols-2 gap-2">
                        <a
                          href={`tel:${cleanPhone}`}
                          className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
                          title={isBn ? "ফোনে অর্ডার করুন" : "Call to order"}
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>{isBn ? "কল করুন" : "Call"}</span>
                        </a>

                        <a
                          href={whatsappUrl(p.name)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
                          title={isBn ? "হোয়াটসঅ্যাপ বার্তা" : "WhatsApp"}
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bulk Orders & Event Booking Banner */}
        <div className="mt-14 bg-gradient-to-r from-amber-600 via-rose-600 to-rose-700 rounded-3xl p-8 sm:p-10 text-white shadow-xl relative overflow-hidden">
          <div className="max-w-3xl space-y-4 relative z-10">
            <span className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-extrabold uppercase tracking-wide">
              {isBn ? "স্পেশাল মিষ্টির অর্ডার" : "Special Event Bulk Orders"}
            </span>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight leading-snug">
              {isBn
                ? "বিবাহ, জন্মদিন ও যেকোনো অনুষ্ঠানের জন্য পাইকারি মিষ্টির অগ্রিম অর্ডার"
                : "Pre-order custom sweet boxes for weddings, birthdays & special family occasions"}
            </h3>
            <p className="text-sm text-rose-100 max-w-2xl leading-relaxed">
              {isBn
                ? "১০ কেজি বা তদূর্ধ্ব মিষ্টির অর্ডারে বিশেষ মূল্যছাড় ও আকর্ষণীয় বক্স প্যাকেজিং সুবিধা। মিষ্টি মেলা ত্রিশাল শপে সরাসরি যোগাযোগ করুন অথবা মালিক আবু ফয়সাল তরফদার (জেহান)-এর সাথে ফোনে কথা বলুন।"
                : "Special volume discounts and customized 1kg/0.5kg gift packaging for orders over 10kg. Call owner Abu Foysal Tarafdar (Jehan) directly."}
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href={`tel:${cleanPhone}`}
                className="px-6 py-3 bg-white text-rose-700 hover:bg-rose-50 font-black rounded-xl text-sm shadow-md transition-all active:scale-95 flex items-center gap-2"
              >
                <Phone className="w-4 h-4" />
                <span>{shopInfo.phone}</span>
              </a>
              <a
                href={whatsappUrl("অনুষ্ঠানের জন্য মিষ্টির অগ্রিম বুকিং")}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-xl text-sm transition-colors flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{isBn ? "হোয়াটসঅ্যাপে বুকিং করুন" : "Book via WhatsApp"}</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Location, Hours, & Contact Section */}
      <section id="contact" className="bg-white border-t border-slate-200 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Shop Details */}
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    {isBn ? "দোকানের ঠিকানা" : "Shop Location"}
                  </h4>
                  <p className="text-xs text-slate-500 font-medium">
                    {isBn ? "মিষ্টি মেলা শোরুম" : "Mishty Mela Showroom"}
                  </p>
                </div>
              </div>
              <p className="text-sm text-slate-700 pl-12 font-medium">
                {shopInfo.address || "ত্রিশাল, ময়মনসিংহ (Trishal, Mymensingh)"}
              </p>
            </div>

            {/* Opening Hours */}
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    {isBn ? "খোলা থাকার সময়" : "Business Hours"}
                  </h4>
                  <p className="text-xs text-slate-500 font-medium">
                    {isBn ? "সপ্তাহের ৭ দিনই খোলা" : "Open 7 Days a Week"}
                  </p>
                </div>
              </div>
              <p className="text-sm text-slate-700 pl-12 font-medium">
                {isBn ? "প্রতিদিন সকাল ৮:০০টা - রাত ১০:০০টা" : "Daily 8:00 AM – 10:00 PM"}
              </p>
            </div>

            {/* Owner & Phone Contact */}
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    {isBn ? "হটলাইন ও মালিকের যোগাযোগ" : "Hotline & Owner Contact"}
                  </h4>
                  <p className="text-xs text-slate-500 font-medium">
                    আবু ফয়সাল তরফদার (জেহান)
                  </p>
                </div>
              </div>
              <div className="pl-12 space-y-1">
                <a
                  href={`tel:${cleanPhone}`}
                  className="text-sm font-bold text-rose-600 hover:underline block"
                >
                  {shopInfo.phone}
                </a>
                <span className="text-xs text-slate-500 block">
                  {shopInfo.email || "mishtymela@gmail.com"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <p className="font-semibold text-slate-200">
              © 2026 {isBn ? "মিষ্টি মেলা (ত্রিশাল)" : "Mishty Mela (Trishal)"}.{" "}
              {isBn ? "সর্বস্বত্ব সংরক্ষিত।" : "All rights reserved."}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {shopInfo.receiptFooter || "স্বাদে ও ঐতিহ্যে অনন্য • সাথে থাকার জন্য ধন্যবাদ!"}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="#catalog"
              className="hover:text-white transition-colors"
            >
              {isBn ? "ক্যাটালগ" : "Catalog"}
            </a>
            <span className="text-slate-700">•</span>
            <Link
              href="/login"
              className="text-slate-400 hover:text-white transition-colors flex items-center gap-1"
            >
              <LogIn className="w-3 h-3" />
              <span>{isBn ? "স্টাফ পোর্টাল" : "Staff Portal"}</span>
            </Link>
          </div>
        </div>
      </footer>

      {/* Sweet Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-4">
              <span className="px-2.5 py-1 rounded-md bg-rose-100 text-rose-800 text-xs font-bold">
                {selectedProduct.categoryName}
              </span>

              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {selectedProduct.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {isBn
                    ? "মিষ্টি মেলা ত্রিশালের নিজস্ব কারখানায় শতভাগ বিশুদ্ধ উপাদানে প্রস্তুত।"
                    : "Freshly prepared with pure ingredients at Mishty Mela Trishal."}
                </p>
              </div>

              {/* Price Details */}
              <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-slate-500 block">
                    {isBn ? "বিক্রয়মূল্য" : "Selling Price"}
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-sm font-bold text-slate-500">৳</span>
                    <span className="text-3xl font-black text-rose-700 tabular-nums">
                      {selectedProduct.sellingPrice.toLocaleString("bn-BD")}
                    </span>
                    <span className="text-xs text-slate-600 font-medium">
                      / {selectedProduct.unit}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{isBn ? "স্টকে প্রস্তুত" : "In Stock"}</span>
                  </span>
                </div>
              </div>

              {/* Next phase ecommerce pill */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-xs">
                <p className="font-bold flex items-center gap-1.5 mb-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>{isBn ? "অনলাইন কার্ট পরবর্তী ধাপে চালু হচ্ছে" : "Cart coming in next phase"}</span>
                </p>
                <p className="text-[11px] text-amber-700">
                  {isBn
                    ? "এখনই নিতে নিচের হটলাইনে কল করুন অথবা সরাসরি শোরুমে আসুন।"
                    : "Call our hotline below to order right now or visit our shop in Trishal."}
                </p>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <a
                  href={`tel:${cleanPhone}`}
                  className="py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold text-center flex items-center justify-center gap-2 shadow-md shadow-rose-200 transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  <span>{isBn ? "ফোনে কল দিন" : "Call Store"}</span>
                </a>

                <a
                  href={whatsappUrl(selectedProduct.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold text-center flex items-center justify-center gap-2 shadow-md shadow-emerald-200 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification when user clicks "Add to Cart (Next Phase)" */}
      {showEcommerceToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-700 animate-in slide-in-from-bottom-5 duration-200 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div className="flex-1 text-xs">
            <p className="font-bold text-amber-300">
              {isBn ? "ই-কমার্স ফিচার পরবর্তী ধাপে যুক্ত হবে!" : "E-Commerce coming in next phase!"}
            </p>
            <p className="text-slate-300 mt-1">
              {isBn ? (
                <>
                  <strong className="text-white font-semibold">"{toastSweetName}"</strong> সহ সকল মিষ্টির অনলাইন কার্ট ও হোম ডেলিভারি শীঘ্রই চালু হচ্ছে। সরাসরি পেতে কল করুন{" "}
                  <a href={`tel:${cleanPhone}`} className="text-rose-400 underline font-bold">
                    {shopInfo.phone}
                  </a>
                </>
              ) : (
                <>
                  Online cart checkout for <strong className="text-white">"{toastSweetName}"</strong> is coming in the next phase. Call{" "}
                  <a href={`tel:${cleanPhone}`} className="text-rose-400 underline font-bold">
                    {shopInfo.phone}
                  </a>{" "}
                  to order now!
                </>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowEcommerceToast(false)}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
