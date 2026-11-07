import React from "react";
import { getProducts, getCategories, getPackagingBoxes } from "@/actions/products";
import { getAccounts } from "@/actions/finance";
import { getOrganizationAction } from "@/actions/organization";
import { getSessionStatusAction } from "@/actions/treasury";
import { PosTerminal } from "@/components/pos/PosTerminal";

export const dynamic = "force-dynamic";

export default async function PosPage() {
  const [products, accounts, allCategories, org, packagingBoxes, sessionStatus] = await Promise.all([
    getProducts({ sellableOnly: true }),
    getAccounts(),
    getCategories(),
    getOrganizationAction(),
    getPackagingBoxes(),
    getSessionStatusAction(),
  ]);

  // Only include categories that contain sellable products on POS
  const categoryIds = new Set(products.map((p) => p.categoryId).filter(Boolean));
  const categories = allCategories.filter((c) => categoryIds.has(c.id));

  return (
    <PosTerminal
      products={products}
      accounts={accounts}
      categories={categories}
      shopProfile={org}
      packagingBoxes={packagingBoxes}
      sessionStatus={sessionStatus}
    />
  );
}
