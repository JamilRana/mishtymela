import { prisma, D } from "@/lib/prisma";
import { lowStockProducts } from "@/modules/inventory/service";

/**
 * Metric definitions
 *  revenue          = sum of completed sale totals in range
 *  COGS             = sum(quantity * unit cost snapshot) of those sales
 *  gross profit     = revenue - COGS            (NOT revenue - purchases)
 *  operating exp.   = MANUAL expenses in range  (stock purchases are inventory, not expense)
 *  operating profit = gross profit - operating expenses + MANUAL other income
 *  stock value      = sum(stockQty * avgCost)   (as of now)
 *  receivables      = sum(total - paid) of completed sales (as of now)
 */
export async function getDashboard(orgId: string, from: Date, to: Date) {
  const sales = await prisma.sale.aggregate({
    where: { organizationId: orgId, status: "COMPLETED", createdAt: { gte: from, lt: to } },
    _sum: { total: true, discount: true }, _count: true });

  const [cogsRow] = await prisma.$queryRaw<{ cogs: string | null }[]>`
    SELECT SUM(si.quantity * si."unitCost")::text AS cogs FROM "SaleItem" si
    JOIN "Sale" s ON s.id = si."saleId"
    WHERE s."organizationId" = ${orgId} AND s.status = 'COMPLETED' AND s."createdAt" >= ${from} AND s."createdAt" < ${to}`;

  const manual = await prisma.transaction.groupBy({
    by: ["type"], where: { organizationId: orgId, source: "MANUAL", voidedAt: null, occurredAt: { gte: from, lt: to } },
    _sum: { amount: true } });
  const sum = (t: "INCOME" | "EXPENSE") => D(manual.find((m) => m.type === t)?._sum.amount ?? 0);

  const revenue = D(sales._sum.total ?? 0), cogs = D(cogsRow?.cogs ?? 0);
  const grossProfit = revenue.minus(cogs);
  const opex = sum("EXPENSE");
  const operatingProfit = grossProfit.minus(opex).plus(sum("INCOME"));

  const [stock] = await prisma.$queryRaw<{ value: string | null }[]>`
    SELECT SUM("stockQty" * "avgCost")::text AS value FROM "Product" WHERE "organizationId" = ${orgId} AND active`;
  const [recv] = await prisma.$queryRaw<{ due: string | null }[]>`
    SELECT SUM(total - paid)::text AS due FROM "Sale" WHERE "organizationId" = ${orgId} AND status = 'COMPLETED'`;

  // Charts (day boundaries in Dhaka time)
  const salesByDay = await prisma.$queryRaw<{ day: string; revenue: string; orders: number }[]>`
    SELECT to_char(("createdAt" AT TIME ZONE 'Asia/Dhaka')::date, 'YYYY-MM-DD') AS day,
           SUM(total)::text AS revenue, COUNT(*)::int AS orders
    FROM "Sale" WHERE "organizationId" = ${orgId} AND status = 'COMPLETED' AND "createdAt" >= ${from} AND "createdAt" < ${to}
    GROUP BY 1 ORDER BY 1`;
  const topProducts = await prisma.$queryRaw<{ name: string; qty: string; revenue: string; profit: string }[]>`
    SELECT si."productName" AS name, SUM(si.quantity)::text AS qty, SUM(si."lineTotal")::text AS revenue,
           SUM(si."lineTotal" - si.quantity * si."unitCost")::text AS profit
    FROM "SaleItem" si JOIN "Sale" s ON s.id = si."saleId"
    WHERE s."organizationId" = ${orgId} AND s.status = 'COMPLETED' AND s."createdAt" >= ${from} AND s."createdAt" < ${to}
    GROUP BY si."productName" ORDER BY SUM(si."lineTotal") DESC LIMIT 10`;
  const expensesByCategory = await prisma.$queryRaw<{ category: string; amount: string }[]>`
    SELECT COALESCE(c.name, 'Uncategorized') AS category, SUM(t.amount)::text AS amount
    FROM "Transaction" t LEFT JOIN "TxCategory" c ON c.id = t."categoryId"
    WHERE t."organizationId" = ${orgId} AND t.type = 'EXPENSE' AND t.source = 'MANUAL' AND t."voidedAt" IS NULL
      AND t."occurredAt" >= ${from} AND t."occurredAt" < ${to}
    GROUP BY 1 ORDER BY SUM(t.amount) DESC`;

  return {
    kpis: { revenue, cogs, grossProfit, operatingExpenses: opex, operatingProfit, orders: sales._count,
      discounts: D(sales._sum.discount ?? 0), stockValue: D(stock?.value ?? 0), receivables: D(recv?.due ?? 0) },
    lowStock: await lowStockProducts(orgId), salesByDay, topProducts, expensesByCategory,
  };
}
