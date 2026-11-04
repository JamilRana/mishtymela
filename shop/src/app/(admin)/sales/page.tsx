import React from "react";
import { getSales } from "@/actions/sales";
import { getAccounts } from "@/actions/finance";
import { getOrganizationAction } from "@/actions/organization";
import { PageHeader } from "@/components/shared/PageHeader";
import { SalesManager } from "@/components/sales/SalesManager";

export const dynamic = "force-dynamic";

export default async function SalesPage({
  searchParams,
}: {
  searchParams?: Promise<{
    page?: string;
    pageSize?: string;
    q?: string;
    status?: "all" | "paid" | "due" | "void";
  }>;
}) {
  const params = searchParams ? await searchParams : {};
  const page = params.page ? parseInt(params.page, 10) : 1;
  const pageSize = params.pageSize ? parseInt(params.pageSize, 10) : 25;
  const search = params.q || undefined;
  const status = params.status || "all";

  const [salesData, accounts, org] = await Promise.all([
    getSales({ page, pageSize, search, status }),
    getAccounts(),
    getOrganizationAction(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales & Invoices Ledger"
        description="Review customer orders, due credit balances, collect payments, and manage invoice voids"
      />
      <SalesManager
        sales={salesData.sales}
        totalCount={salesData.totalCount}
        currentPage={salesData.page}
        pageSize={salesData.pageSize}
        totalPages={salesData.totalPages}
        accounts={accounts}
        shopProfile={org}
      />
    </div>
  );
}
