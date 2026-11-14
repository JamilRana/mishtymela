import React from "react";
import { getPurchases } from "@/actions/purchases";
import { getContacts } from "@/actions/contacts";
import { getProducts } from "@/actions/products";
import { getAccounts } from "@/actions/finance";
import { PageHeader } from "@/components/shared/PageHeader";
import { PurchaseManager } from "@/components/purchases/PurchaseManager";
import { withDbRetry } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface PurchasesPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    supplierId?: string;
    startDate?: string;
    endDate?: string;
  }>;
}

export default async function PurchasesPage({ searchParams }: PurchasesPageProps) {
  const params = await searchParams;

  const [purchasesData, suppliers, products, accounts] = await Promise.all([
    withDbRetry(() =>
      getPurchases({
        page: params.page ? parseInt(params.page, 10) : 1,
        search: params.search,
        supplierId: params.supplierId,
        startDate: params.startDate,
        endDate: params.endDate,
      })
    ),
    withDbRetry(() => getContacts({ type: "SUPPLIER", activeOnly: true })),
    withDbRetry(() => getProducts()),
    withDbRetry(() => getAccounts()),
  ]);

  const activeAccounts = accounts
    .filter((a) => a.type !== "OWNER" && a.type !== "SAFE")
    .map((a) => ({
      id: a.id,
      name: a.name,
      type: a.type,
    }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchases & Goods Inward"
        description="Goods received notes (GRN), supplier challan invoices, weighted-average cost updates, and bills"
      />
      <PurchaseManager
        purchases={purchasesData.purchases}
        totalCount={purchasesData.totalCount}
        page={purchasesData.page}
        pageSize={purchasesData.pageSize}
        totalPages={purchasesData.totalPages}
        suppliers={suppliers.map((s) => ({ id: s.id, name: s.name, phone: s.phone }))}
        products={products.map((p) => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          unit: p.unit,
          avgCost: p.avgCost,
        }))}
        accounts={activeAccounts}
      />
    </div>
  );
}
