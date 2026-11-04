"use client";

import { useState, useEffect } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Role } from "@prisma/client";

interface RoleStore {
  activeRole: Role;
  activeUserName: string;
  setActiveRole: (role: Role, userName?: string) => void;
  canAccess: (module: "dashboard" | "pos" | "products" | "inventory" | "sales" | "finance" | "reports" | "settings") => boolean;
}

export const useRoleStore = create<RoleStore>()(
  persist(
    (set, get) => ({
      activeRole: "ADMIN",
      activeUserName: "Abu Foysal Tarafdar (Jehan)",
      setActiveRole: (role: Role, userName?: string) => {
        const defaultNames: Record<string, string> = {
          ADMIN: "Abu Foysal Tarafdar (Jehan)",
          OWNER: "Abu Foysal Tarafdar (Jehan)",
          MANAGER: "Rafiqul Islam (Manager)",
          CASHIER: "Kamal Uddin (Cashier)",
          STAFF: "Staff User",
        };
        set({
          activeRole: role,
          activeUserName: userName || defaultNames[role] || "User",
        });
      },
      canAccess: (module) => {
        const r = get().activeRole;
        // Admin / Owner has full access to all modules
        if (r === "ADMIN" || r === "OWNER") return true;

        // Manager gets POS, Products, and Inventory access ONLY
        if (r === "MANAGER") {
          return module === "pos" || module === "products" || module === "inventory";
        }

        // Cashier ONLY has POS access
        if (r === "CASHIER" || r === "STAFF") {
          return module === "pos";
        }

        return false;
      },
    }),
    {
      name: "sweet-shop-active-role",
    }
  )
);

/**
 * Hydration-safe role hook for Next.js SSR.
 * Prevents tree hydration mismatches when conditional navigation links are rendered.
 */
export function useHydratedRole() {
  const [hydrated, setHydrated] = useState(false);
  const store = useRoleStore();

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return {
      activeRole: "ADMIN" as Role,
      activeUserName: "Abu Foysal Tarafdar (Jehan)",
      setActiveRole: store.setActiveRole,
      canAccess: (_module: string) => true,
    };
  }

  return store;
}
