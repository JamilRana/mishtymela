"use client";

import { useState, useEffect } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  Language,
  TranslationDictionary,
  bnTranslations,
  enTranslations,
} from "@/lib/i18n";

interface LanguageStore {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: keyof TranslationDictionary) => string;
}

export const useLanguageStore = create<LanguageStore>()(
  persist(
    (set, get) => ({
      language: "bn", // Bangla is primary default!
      setLanguage: (language: Language) => set({ language }),
      toggleLanguage: () => {
        const nextLang = get().language === "bn" ? "en" : "bn";
        set({ language: nextLang });
      },
      t: (key: keyof TranslationDictionary) => {
        const lang = get().language;
        const dict = lang === "bn" ? bnTranslations : enTranslations;
        return dict[key] || enTranslations[key] || key;
      },
    }),
    {
      name: "sweet-shop-language",
    }
  )
);

/**
 * Hydration-safe language hook for Next.js SSR.
 * Guarantees server HTML and initial client hydration HTML match 100%,
 * then smoothly updates to the user's persisted language upon mount.
 */
export function useHydratedLanguage() {
  const [hydrated, setHydrated] = useState(false);
  const store = useLanguageStore();

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return {
      language: "bn" as Language,
      setLanguage: store.setLanguage,
      toggleLanguage: store.toggleLanguage,
      t: (key: keyof TranslationDictionary) =>
        bnTranslations[key] || enTranslations[key] || key,
    };
  }

  return store;
}
