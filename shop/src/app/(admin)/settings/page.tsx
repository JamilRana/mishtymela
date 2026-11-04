import React from "react";
import { prisma } from "@/lib/prisma";
import { getCategoriesWithCounts } from "@/actions/products";
import { requireAuth } from "@/lib/auth";
import { PageHeader } from "@/components/shared/PageHeader";
import { CategorySettingsSection } from "@/components/settings/CategorySettingsSection";
import { ShopProfileSection } from "@/components/settings/ShopProfileSection";
import { UserManagerSection } from "@/components/settings/UserManagerSection";
import { Wallet, Tags, Check } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await requireAuth();
  const orgId = session.organizationId;

  const [org, productCategories] = await Promise.all([
    prisma.organization.findUniqueOrThrow({
      where: { id: orgId },
      include: {
        accounts: true,
        txCategories: true,
        users: {
          orderBy: [{ role: "asc" }, { name: "asc" }],
        },
      },
    }),
    getCategoriesWithCounts(),
  ]);

  const organizationData = {
    id: org.id,
    name: org.name,
    currency: org.currency,
    timezone: org.timezone,
    address: org.address || "",
    phone: org.phone || "",
    email: org.email || "",
    vatNumber: org.vatNumber || "",
    receiptFooter: org.receiptFooter || "",
  };

  const staffUsers = org.users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone || "",
    role: u.role,
    active: u.active,
    createdAt: u.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings & Sweet Shop Configuration"
        description="Configure shop profile, contact info, staff roles, dynamic sweet & raw material categories, and payment accounts"
      />

      <div className="space-y-6">
        {/* Editable Shop Profile & Contact */}
        <ShopProfileSection organization={organizationData} />

        {/* Role-Based User Management */}
        <UserManagerSection users={staffUsers} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Dynamic Product Categories Management */}
          <CategorySettingsSection categories={productCategories} />

          {/* Payment Accounts */}
          <div className="bg-white border border-slate-200 rounded-md p-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-200 mb-4">
              <Wallet className="w-4 h-4 text-slate-500" />
              <h2 className="text-sm font-semibold text-slate-900">Payment Accounts</h2>
            </div>
            <div className="space-y-2">
              {org.accounts.map((acc) => (
                <div
                  key={acc.id}
                  className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded text-xs"
                >
                  <div>
                    <span className="font-semibold text-slate-800">{acc.name}</span>
                    <span className="text-[10px] text-slate-400 block font-mono mt-0.5">
                      {acc.type}
                    </span>
                  </div>
                  <span className="flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium">
                    <Check className="w-3 h-3" /> Active
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Sweet Shop Expense Categories */}
          <div className="bg-white border border-slate-200 rounded-md p-5 lg:col-span-2">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-200 mb-4">
              <Tags className="w-4 h-4 text-slate-500" />
              <h2 className="text-sm font-semibold text-slate-900">Sweet Shop Expense & Material Categories</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {org.txCategories.map((cat) => (
                <span
                  key={cat.id}
                  className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded text-xs font-medium"
                >
                  {cat.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
