"use client";

import { useState, useEffect } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ShopInfo {
  name: string;
  phone: string;
  email: string;
  address: string;
  vatNumber: string;
  receiptFooter: string;
  currency: string;
  timezone: string;
}

const DEFAULT_SHOP_INFO: ShopInfo = {
  name: "মিষ্টি মেলা (Mishty Mela)",
  phone: "01671578965",
  email: "mishtymela@gmail.com",
  address: "ত্রিশাল (Trishal)",
  vatNumber: "BIN-০০২৯৩৮৪৭১-০১০১",
  receiptFooter: "মিষ্টি মেলা - স্বাদে ও ঐতিহ্যে অনন্য • সাথে থাকার জন্য ধন্যবাদ!",
  currency: "BDT",
  timezone: "Asia/Dhaka",
};

interface OrganizationStore {
  shopInfo: ShopInfo;
  setShopInfo: (info: Partial<ShopInfo>) => void;
}

export const useOrganizationStore = create<OrganizationStore>()(
  persist(
    (set) => ({
      shopInfo: DEFAULT_SHOP_INFO,
      setShopInfo: (info) =>
        set((state) => ({
          shopInfo: { ...state.shopInfo, ...info },
        })),
    }),
    {
      name: "sweet-shop-organization-profile",
    }
  )
);

/**
 * Hydration-safe organization profile hook for Next.js SSR.
 */
export function useHydratedOrganization() {
  const [hydrated, setHydrated] = useState(false);
  const store = useOrganizationStore();

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return {
      shopInfo: DEFAULT_SHOP_INFO,
      setShopInfo: store.setShopInfo,
    };
  }

  return store;
}
