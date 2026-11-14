import React from "react";
import { prisma } from "@/lib/prisma";
import { getCategoriesWithCounts } from "@/actions/products";
import { getTxCategories } from "@/actions/finance";
import { getBrands } from "@/actions/brands";
import { getUnits } from "@/actions/units";
import { getPrinterSettings } from "@/actions/printers";
import { requireAuth } from "@/lib/auth";
import { PageHeader } from "@/components/shared/PageHeader";
import { CategorySettingsSection } from "@/components/settings/CategorySettingsSection";
import { TxCategorySettingsSection } from "@/components/settings/TxCategorySettingsSection";
import { ShopProfileSection } from "@/components/settings/ShopProfileSection";
import { UserManagerSection } from "@/components/settings/UserManagerSection";
import { BrandSettingsSection } from "@/components/settings/BrandSettingsSection";
import { UnitSettingsSection } from "@/components/settings/UnitSettingsSection";
import { PrinterSettingsSection } from "@/components/settings/PrinterSettingsSection";
import { BackupRestoreSection } from "@/components/settings/BackupRestoreSection";
import { Wallet, Check } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await requireAuth();
  const orgId = session.organizationId;

  const [org, productCategories, txCategories, brands, units, printers] = await Promise.all([
    prisma.organization.findUniqueOrThrow({
      where: { id: orgId },
      include: {
        accounts: true,
        users: {
          orderBy: [{ role: "asc" }, { name: "asc" }],
        },
      },
    }),
    getCategoriesWithCounts(),
    getTxCategories(),
    getBrands(),
    getUnits(),
    getPrinterSettings(),
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

        {/* Hardware & Thermal ESC/POS Printers */}
        <div className="bg-card border rounded-md p-5 shadow-sm">
          <PrinterSettingsSection printers={printers} />
        </div>

        {/* Database Cloud Backup & Disaster Recovery (Vercel Blob & Neon Free Tier) */}
        <BackupRestoreSection />

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
                    <span className="text-xs text-slate-500 block font-mono mt-0.5">
                      {acc.type}
                    </span>
                  </div>
                  <span className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium">
                    <Check className="w-3 h-3" /> Active
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Brands Management */}
          <BrandSettingsSection brands={brands} />

          {/* Units of Measurement Management */}
          <UnitSettingsSection units={units} />

          {/* Dynamic Sweet Shop Income & Expense Categories */}
          <div className="lg:col-span-2">
            <TxCategorySettingsSection categories={txCategories} />
          </div>
        </div>
      </div>
    </div>
  );
}
