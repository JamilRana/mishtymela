"use client";

import React, { useEffect, useState } from "react";
import { Globe } from "lucide-react";
import { useLanguageStore } from "@/stores/language";
import { cn } from "@/lib/utils";

export const LanguageToggle: React.FC<{ className?: string }> = ({ className }) => {
  const { language, setLanguage } = useLanguageStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={cn("flex items-center gap-1 text-xs px-2 py-1 bg-slate-100 rounded-md", className)}>
        <Globe className="w-3.5 h-3.5 text-slate-400" />
        <span className="font-semibold text-slate-700">বাংলা</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-md border border-slate-200 text-xs font-semibold select-none shadow-2xs",
        className
      )}
    >
      <button
        type="button"
        onClick={() => setLanguage("bn")}
        className={cn(
          "px-2 py-0.8 rounded text-[11px] transition-all",
          language === "bn"
            ? "bg-rose-600 text-white shadow-xs font-bold"
            : "text-slate-600 hover:text-slate-900"
        )}
      >
        বাংলা
      </button>
      <button
        type="button"
        onClick={() => setLanguage("en")}
        className={cn(
          "px-2 py-0.8 rounded text-[11px] transition-all",
          language === "en"
            ? "bg-slate-900 text-white shadow-xs font-bold"
            : "text-slate-600 hover:text-slate-900"
        )}
      >
        EN
      </button>
    </div>
  );
};
