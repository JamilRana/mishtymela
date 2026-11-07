"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { useHydratedLanguage } from "@/stores/language";

interface PageHeaderProps {
  title: string;
  titleBn?: string;
  description?: string;
  descriptionBn?: string;
  actions?: React.ReactNode;
  className?: string;
}

const PAGE_TRANSLATIONS: Record<
  string,
  { titleBn: string; titleEn: string; descBn?: string; descEn?: string }
> = {
  "Products & Inventory Catalog": {
    titleBn: "মিষ্টি ও পণ্য ক্যাটালগ",
    titleEn: "Products & Inventory Catalog",
    descBn: "মিষ্টির আইটেম, খুচরা মূল্য, বর্তমান মজুদ ও ক্যাটেগরি পরিচালনা করুন",
    descEn: "Manage retail SKUs, pricing, stock levels, and categories",
  },
  "Finance & Cash Accounts": {
    titleBn: "হিসাব ও নগদ লেনদেন",
    titleEn: "Finance & Cash Accounts",
    descBn: "ক্যাশ কাউন্টার, বিকাশ ও ব্যাংক ব্যালেন্স নিরীক্ষণ, খরচের হিসাব ও ক্যাশ ফ্লো",
    descEn: "Monitor liquidity across Cash, bKash & Bank, record operational expenses, and audit cash flows",
  },
  "Sales & Invoices Ledger": {
    titleBn: "বিক্রয় ও ইনভয়েস হিসাব",
    titleEn: "Sales & Invoices Ledger",
    descBn: "অর্ডার তালিকা, বাকি/ক্রেডিট ব্যালেন্স, পেমেন্ট সংগ্রহ এবং ইনভয়েস অডিট",
    descEn: "Review customer orders, due credit balances, collect payments, and manage invoice voids",
  },
  "Stock & Inventory Control": {
    titleBn: "স্টক ও মজুদ ব্যবস্থাপনা",
    titleEn: "Stock & Inventory Control",
    descBn: "স্টক মূল্য নির্ধারণ, নতুন মালামাল রিসিভ এবং মজুদের পূর্ণ বিবরণ",
    descEn: "Monitor stock valuation, receive purchase batches, and track full movement ledger",
  },
  "Store Dashboard": {
    titleBn: "দোকানের ড্যাশবোর্ড",
    titleEn: "Store Dashboard",
    descBn: "রিয়েল-টাইম বিক্রয় হিসাব, লাভের পরিসংখ্যান ও মজুদের অবস্থা",
    descEn: "Real-time retail metrics, profit analytics, and stock health",
  },
  "Sweet Shop Date & Month Reports": {
    titleBn: "লাভ-ক্ষতি ও আর্থিক রিপোর্ট",
    titleEn: "Sweet Shop Date & Month Reports",
    descBn: "দৈনিক ও মাসিক লাভ-ক্ষতির হিসাব, আইটেমভিত্তিক লাভ এবং কাঁচামাল ক্রয়ের হিসাব",
    descEn: "Daily & monthly profit & loss accounting, sweet item profitability, raw material & box purchases",
  },
  "Settings & Sweet Shop Configuration": {
    titleBn: "দোকান ও সিস্টেম সেটিংস",
    titleEn: "Settings & Sweet Shop Configuration",
    descBn: "দোকানের প্রোফাইল, যোগাযোগের তথ্য, স্টাফ রোল, মিষ্টির ক্যাটেগরি ও পেমেন্ট অ্যাকাউন্ট",
    descEn: "Configure shop profile, contact info, staff roles, dynamic sweet & raw material categories, and payment accounts",
  },
};

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  titleBn,
  description,
  descriptionBn,
  actions,
  className,
}) => {
  const { language } = useHydratedLanguage();
  const isBn = language === "bn";

  const mapped = PAGE_TRANSLATIONS[title];
  const displayTitle = isBn
    ? (titleBn || mapped?.titleBn || title)
    : (mapped?.titleEn || title);

  const displayDescription = isBn
    ? (descriptionBn || mapped?.descBn || description)
    : (mapped?.descEn || description);

  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200 mb-6", className)}>
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{displayTitle}</h1>
        {displayDescription && (
          <p className="text-sm sm:text-base font-medium text-slate-600 mt-1">{displayDescription}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
};
