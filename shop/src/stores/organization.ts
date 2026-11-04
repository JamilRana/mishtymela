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
  name: "মৌচাক সুইটস অ্যান্ড কনফেকশনারি",
  phone: "০১৭১১-২৩৪৫৬৭ (+880 1711-234567)",
  email: "info@mouchaksweets.com",
  address: "১২/এ সাতমসজিদ রোড, ধানমন্ডি, ঢাকা-১২০৯",
  vatNumber: "BIN-০০২৯৩৮৪৭১-০১০১",
  receiptFooter: "স্বাদে ও ঐতিহ্যে অনন্য • মিষ্টির মিষ্টি মুখ • সাথে থাকার জন্য ধন্যবাদ!",
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
