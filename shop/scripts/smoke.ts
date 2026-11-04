// Acceptance check against a real database: receive 100, sell 5, retry-safety, void, oversell block, dashboard.
import { prisma } from "../src/lib/prisma";
import { receiveStock } from "../src/modules/inventory/service";
import { createSale, voidSale } from "../src/modules/sales/service";
import { getDashboard } from "../src/modules/reports/dashboard";

const orgId = "00000000-0000-0000-0000-000000000001";
const eq = (a: unknown, b: unknown, m: string) => { if (String(a) !== String(b)) throw new Error(`${m}: expected ${b}, got ${a}`); console.log("ok -", m); };

const product = await prisma.product.findFirstOrThrow({ where: { organizationId: orgId, sku: "DEMO-001" } });
const cash = await prisma.account.findFirstOrThrow({ where: { organizationId: orgId, name: "Cash" } });
const stock = async () => (await prisma.product.findUniqueOrThrow({ where: { id: product.id } })).stockQty;
const before = await stock();

await receiveStock({ orgId, productId: product.id, quantity: 100, unitCost: 80, accountId: cash.id });
eq(await stock(), before.plus(100), "receive 100 increases stock by 100");

const key = `smoke-${Date.now()}`;
const sale = await createSale({ orgId, idempotencyKey: key, accountId: cash.id, items: [{ productId: product.id, quantity: 5 }] });
const again = await createSale({ orgId, idempotencyKey: key, accountId: cash.id, items: [{ productId: product.id, quantity: 5 }] });
eq(sale.id, again.id, "retry with same key returns the same sale");
eq(await stock(), before.plus(95), "sell 5 decreases stock by 5 (once)");

await voidSale({ orgId, saleId: sale.id });
eq(await stock(), before.plus(100), "void restores stock");

let blocked = false;
try { await createSale({ orgId, idempotencyKey: `${key}-x`, accountId: cash.id, items: [{ productId: product.id, quantity: 1e6 }] }); } catch { blocked = true; }
eq(blocked, true, "overselling is blocked");

const d = await getDashboard(orgId, new Date(Date.now() - 864e5), new Date(Date.now() + 864e5));
console.log("dashboard KPIs:", Object.fromEntries(Object.entries(d.kpis).map(([k, v]) => [k, String(v)])));
await prisma.$disconnect();
