import React from "react";
import { getProducts } from "@/actions/products";
import { getStockMovements } from "@/actions/inventory";
import { getAccounts } from "@/actions/finance";
import { PageHeader } from "@/components/shared/PageHeader";
import { InventoryManager } from "@/components/inventory/InventoryManager";

export const dynamic = "force-dynamic";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ receive?: string }>;
}) {
  const params = await searchParams;
  const [products, movements, accounts] = await Promise.all([
    getProducts(),
    getStockMovements(),
    getAccounts(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock & Inventory Control"
        description="Monitor stock valuation, receive purchase batches, and track full movement ledger"
      />
      <InventoryManager
        products={products}
        movements={movements}
        accounts={accounts}
        initialReceiveId={params.receive}
      />
    </div>
  );
}
