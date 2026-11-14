import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== Testing Phase 11 BI & Analytics Reports ===");

  const org = await prisma.organization.findFirstOrThrow();
  console.log("Organization:", org.name);

  // 1. Test Staff Performance Aggregation
  console.log("\n1. Testing Staff Sales Performance Query...");
  const [sales, users] = await Promise.all([
    prisma.sale.findMany({
      where: {
        organizationId: org.id,
        status: "COMPLETED",
      },
      select: {
        id: true,
        total: true,
        paid: true,
        createdById: true,
        createdAt: true,
      },
    }),
    prisma.user.findMany({
      where: { organizationId: org.id },
      select: { id: true, name: true, role: true, email: true },
    }),
  ]);

  const userMap = new Map(users.map((u) => [u.id, u]));
  const staffStats = new Map<
    string,
    {
      userId: string;
      name: string;
      role: string;
      totalSales: number;
      invoiceCount: number;
      avgInvoiceValue: number;
    }
  >();

  for (const s of sales) {
    const uid = s.createdById || "UNKNOWN";
    const existing = staffStats.get(uid) || {
      userId: uid,
      name: userMap.get(uid)?.name || (uid === "UNKNOWN" ? "সিস্টেম / নামহীন" : "অজানা কর্মী"),
      role: userMap.get(uid)?.role || "STAFF",
      totalSales: 0,
      invoiceCount: 0,
      avgInvoiceValue: 0,
    };

    existing.totalSales += Number(s.total);
    existing.invoiceCount += 1;
    staffStats.set(uid, existing);
  }

  const staffPerformance = Array.from(staffStats.values()).map((s) => ({
    ...s,
    avgInvoiceValue: s.invoiceCount > 0 ? Math.round(s.totalSales / s.invoiceCount) : 0,
  }));

  console.log(`✓ Staff performance records found: ${staffPerformance.length}`);
  staffPerformance.forEach((sp, idx) => {
    console.log(`   [#${idx + 1}] ${sp.name} (${sp.role}) - Invoices: ${sp.invoiceCount}, Total: ৳${sp.totalSales}, Avg: ৳${sp.avgInvoiceValue}`);
  });

  // 2. Test Live Stock IN/OUT Ledger
  console.log("\n2. Testing Stock Movement Ledger Query...");
  const movements = await prisma.stockMovement.findMany({
    where: { organizationId: org.id },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: {
      product: { select: { name: true, sku: true, unit: true } },
    },
  });

  console.log(`✓ Stock movements retrieved: ${movements.length}`);
  if (movements.length > 0) {
    const m = movements[0];
    console.log(`   Recent Movement: [${m.type}] Product: ${m.product.name} (${m.product.sku}), Qty: ${Number(m.quantityDelta)}, Bal: ${Number(m.balanceAfter)}`);
  }

  // 3. Test Supplier Purchase Register
  console.log("\n3. Testing Supplier Purchase Register Query...");
  const purchases = await prisma.purchase.findMany({
    where: { organizationId: org.id },
    orderBy: { createdAt: "desc" },
    include: {
      supplier: { select: { name: true, phone: true } },
      _count: { select: { items: true } },
    },
    take: 10,
  });

  console.log(`✓ Supplier purchases retrieved: ${purchases.length}`);
  if (purchases.length > 0) {
    const p = purchases[0];
    console.log(`   GRN: ${p.billNo}, Supplier: ${p.supplier.name}, Items: ${p._count.items}, Total: ৳${Number(p.total)}, Due: ৳${Number(p.due)}`);
  }

  console.log("\n================================================");
  console.log("🎉 ALL PHASE 11 BI & ANALYTICS QUERIES VERIFIED!");
  console.log("================================================");
}

main()
  .catch((e) => {
    console.error("Test failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
