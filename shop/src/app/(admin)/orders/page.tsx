import React from "react";
import { getOrders } from "@/actions/orders";
import { getProducts } from "@/actions/products";
import { getContacts } from "@/actions/contacts";
import { getAccounts } from "@/actions/finance";
import { PageHeader } from "@/components/shared/PageHeader";
import { OrderManager } from "@/components/orders/OrderManager";
import { withDbRetry } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

interface OrdersPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }>;
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const params = await searchParams;

  const validStatus =
    params.status && Object.values(OrderStatus).includes(params.status as OrderStatus)
      ? (params.status as OrderStatus)
      : undefined;

  const [ordersData, products, customers, accounts] = await Promise.all([
    withDbRetry(() =>
      getOrders({
        page: params.page ? parseInt(params.page, 10) : 1,
        search: params.search,
        status: validStatus,
        startDate: params.startDate,
        endDate: params.endDate,
      })
    ),
    withDbRetry(() => getProducts()),
    withDbRetry(() => getContacts({ type: "CUSTOMER", activeOnly: true })),
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
        title="Advance Orders & Event Bookings"
        titleBn="অর্ডার ও অগ্রিম বুকিং"
        description="Advance sweet & catering orders, delivery scheduling, advance collections, and invoice generation"
        descriptionBn="অনুষ্ঠান ও বিবাহের মিষ্টির অর্ডার বুকিং, ডেলিভারির শিডিউল ও অগ্রিম হিসাব"
      />

      <OrderManager
        orders={ordersData.orders}
        totalCount={ordersData.totalCount}
        page={ordersData.page}
        pageSize={ordersData.pageSize}
        totalPages={ordersData.totalPages}
        metrics={ordersData.metrics}
        products={products.map((p) => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          sellingPrice: p.sellingPrice,
          stock: p.stockQty,
          unit: p.unit,
        }))}
        customers={customers.map((c) => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
        }))}
        accounts={activeAccounts}
      />
    </div>
  );
}
