"use server";

import { getDashboard } from "@/modules/reports/dashboard";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { accountBalances } from "@/modules/finance/service";

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

/** Everything the "today" screen needs. Bangladesh is UTC+6 with no daylight saving, so day edges are fixed offsets. */
export async function getTodayOverviewAction() {
  const session = await requireRole(["ADMIN", "OWNER"]);
  const orgId = session.organizationId;

  const DAY = 864e5, OFFSET = 6 * 3600e3;
  const now = Date.now();
  const startMs = Math.floor((now + OFFSET) / DAY) * DAY - OFFSET;
  const from = new Date(startMs), to = new Date(startMs + DAY), yesterdayFrom = new Date(startMs - DAY);

  const [today, yesterday, collected, balances, recent] = await Promise.all([
    getDashboard(orgId, from, to),
    prisma.sale.aggregate({
      where: { organizationId: orgId, status: "COMPLETED", createdAt: { gte: yesterdayFrom, lt: from } },
      _sum: { total: true },
    }),
    prisma.transaction.aggregate({
      where: { organizationId: orgId, type: "INCOME", source: "SALE", voidedAt: null, occurredAt: { gte: from, lt: to } },
      _sum: { amount: true },
    }),
    accountBalances(orgId),
    prisma.sale.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, invoiceNo: true, customerName: true, total: true, paid: true, status: true, createdAt: true },
    }),
  ]);

  return {
    nowISO: new Date(now).toISOString(),
    revenue: Number(today.kpis.revenue),
    orders: Number(today.kpis.orders),
    grossProfit: Number(today.kpis.grossProfit),
    yesterdayRevenue: Number(yesterday._sum.total ?? 0),
    collected: Number(collected._sum.amount ?? 0),
    receivables: Number(today.kpis.receivables),
    stockValue: Number(today.kpis.stockValue),
    accounts: balances.map((a) => ({ id: a.id, name: a.name, balance: Number(a.balance) })),
    lowStock: today.lowStock.map((p) => ({ id: p.id, name: p.name, stockQty: Number(p.stockQty), reorderLevel: Number(p.reorderLevel) })),
    recentSales: recent.map((r) => ({
      id: r.id,
      invoiceNo: r.invoiceNo,
      customerName: r.customerName,
      total: Number(r.total),
      due: r.status === "COMPLETED" ? Math.max(0, Number(r.total) - Number(r.paid)) : 0,
      voided: r.status === "VOID",
      createdAt: r.createdAt.toISOString(),
    })),
  };
}
