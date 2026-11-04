"use server";

import { getDashboard } from "@/modules/reports/dashboard";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function getDashboardData(
  fromISO?: string,
  toISO?: string
) {
  const session = await requireRole(["ADMIN", "OWNER"]);
  const orgId = session.organizationId;

  const to = toISO ? new Date(toISO) : new Date(Date.now() + 864e5);
  const from = fromISO ? new Date(fromISO) : new Date(Date.now() - 30 * 864e5);

  const data = await getDashboard(orgId, from, to);

  const recentTransactions = await prisma.transaction.findMany({
    where: { organizationId: orgId, voidedAt: null },
    include: { account: true, category: true },
    orderBy: { occurredAt: "desc" },
    take: 10,
  });

  return {
    kpis: {
      revenue: Number(data.kpis.revenue),
      cogs: Number(data.kpis.cogs),
      grossProfit: Number(data.kpis.grossProfit),
      operatingExpenses: Number(data.kpis.operatingExpenses),
      operatingProfit: Number(data.kpis.operatingProfit),
      orders: Number(data.kpis.orders),
      discounts: Number(data.kpis.discounts),
      stockValue: Number(data.kpis.stockValue),
      receivables: Number(data.kpis.receivables),
    },
    lowStock: data.lowStock.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      stockQty: Number(p.stockQty),
      reorderLevel: Number(p.reorderLevel),
    })),
    salesByDay: data.salesByDay.map((s) => ({
      day: s.day,
      revenue: Number(s.revenue),
      orders: Number(s.orders),
    })),
    topProducts: data.topProducts.map((p) => ({
      name: p.name,
      qty: Number(p.qty),
      revenue: Number(p.revenue),
      profit: Number(p.profit),
    })),
    expensesByCategory: data.expensesByCategory.map((e) => ({
      category: e.category,
      amount: Number(e.amount),
    })),
    recentTransactions: recentTransactions.map((t) => ({
      id: t.id,
      type: t.type,
      amount: Number(t.amount),
      occurredAt: t.occurredAt.toISOString(),
      accountName: t.account.name,
      categoryName: t.category?.name ?? (t.source === "SALE" ? "Sales Income" : "General"),
      description: t.description || "-",
    })),
  };
}
