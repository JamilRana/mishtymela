import React from "react";
import { getProducts, getCategories } from "@/actions/products";
import { PageHeader } from "@/components/shared/PageHeader";
import { ProductsTable } from "@/components/products/ProductsTable";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const [products, categories] = await Promise.all([
    getProducts(),
    getCategories(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products & Inventory Catalog"
        description="Manage retail SKUs, pricing, stock levels, and categories"
      />
      <ProductsTable products={products} categories={categories} />
    </div>
  );
}
