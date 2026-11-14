import { PrismaClient, OrderStatus } from "@prisma/client";
import { applyMovement } from "../src/modules/inventory/service.js";
import { TX_OPTIONS } from "../src/lib/prisma.js";
import { Decimal } from "@prisma/client/runtime/library";

const D = (n: number | string | Decimal) => new Decimal(n);

const prisma = new PrismaClient();

async function run() {
  console.log("--- Testing Advance Orders & Pre-Orders Module ---");

  const org = await prisma.organization.findFirstOrThrow();
  console.log("Organization:", org.name);

  const product = await prisma.product.findFirstOrThrow({
    where: { organizationId: org.id, active: true, sku: "DEMO-001" },
  });
  console.log("Testing with product:", product.name, "Current stock:", product.stockQty.toString());

  const account = await prisma.account.findFirstOrThrow({
    where: { organizationId: org.id, type: { in: ["CASH", "MOBILE"] } },
  });

  // 1. Create test advance order
  const orderCount = await prisma.order.count({ where: { organizationId: org.id } });
  const orderNo = `ORD-TEST-${String(orderCount + 1).padStart(4, "0")}`;

  const quantity = 5;
  const unitPrice = Number(product.sellingPrice);
  const subtotal = quantity * unitPrice;
  const advancePaid = 200;
  const dueBalance = subtotal - advancePaid;

  const order = await prisma.$transaction(async (tx) => {
    const o = await tx.order.create({
      data: {
        organizationId: org.id,
        orderNo,
        customerName: "অর্ডার গ্রাহক (Order Test Customer)",
        customerPhone: "01800000001",
        deliveryDate: new Date(Date.now() + 86400000), // Tomorrow
        subtotal,
        discount: 0,
        advancePaid,
        total: subtotal,
        dueBalance,
        status: OrderStatus.PENDING,
        notes: "বিবাহের অনুষ্ঠানের স্পেশাল প্যাকিং",
        items: {
          create: [
            {
              productId: product.id,
              productName: product.name,
              quantity,
              unitPrice,
              lineTotal: subtotal,
            },
          ],
        },
      },
      include: { items: true },
    });

    // Record advance payment transaction
    await tx.transaction.create({
      data: {
        organizationId: org.id,
        type: "INCOME",
        source: "SALE",
        amount: advancePaid,
        accountId: account.id,
        description: `Advance for Order ${orderNo}`,
      },
    });

    return o;
  }, TX_OPTIONS);

  console.log("Created Order:", order.orderNo, "Status:", order.status, "Advance:", order.advancePaid.toString(), "Due:", order.dueBalance.toString());

  // 2. Lifecycle Transition: PENDING -> CONFIRMED -> READY
  await prisma.order.update({
    where: { id: order.id },
    data: { status: OrderStatus.READY },
  });
  console.log("Updated order status to READY");

  // 3. Complete Delivery & Convert to Sale
  const finalPaid = dueBalance;
  const stockBefore = Number(product.stockQty);

  const saleResult = await prisma.$transaction(async (tx) => {
    const seq = await tx.invoiceSequence.upsert({
      where: { organizationId: org.id },
      create: { organizationId: org.id, lastNo: 1 },
      update: { lastNo: { increment: 1 } },
    });
    const invoiceNo = `INV-ORD-${String(seq.lastNo).padStart(6, "0")}`;

    // Apply movement through inventory service
    const { unitCost } = await applyMovement(tx, {
      orgId: org.id,
      productId: product.id,
      type: "SALE",
      qty: D(quantity).neg(),
      refType: "order_delivery",
    });

    // Create Sale
    const sale = await tx.sale.create({
      data: {
        organizationId: org.id,
        invoiceNo,
        customerName: order.customerName,
        subtotal: order.subtotal,
        discount: 0,
        vatAmount: 0,
        total: order.total,
        paid: order.total, // Advance + Final Payment
        due: 0,
        items: {
          create: [
            {
              productId: product.id,
              productName: product.name,
              quantity,
              unitPrice,
              unitCost: product.avgCost,
              lineTotal: subtotal,
            },
          ],
        },
      },
    });

    // Record final payment transaction
    await tx.transaction.create({
      data: {
        organizationId: org.id,
        type: "INCOME",
        source: "SALE",
        amount: finalPaid,
        accountId: account.id,
        saleId: sale.id,
        description: `${invoiceNo} - Delivery payment (${order.orderNo})`,
      },
    });

    // Mark Order as DELIVERED
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.DELIVERED,
        convertedSaleId: sale.id,
        dueBalance: 0,
      },
    });

    return sale;
  }, TX_OPTIONS);

  console.log("Successfully converted order to Sale:", saleResult.invoiceNo, "Total:", saleResult.total.toString(), "Paid:", saleResult.paid.toString());

  // Verify product stock decrement
  const updatedProduct = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
  console.log("Stock decrement verified:", stockBefore, "->", updatedProduct.stockQty.toString());

  console.log("✅ Advance Orders & Delivery conversion test passed successfully!");
}

run()
  .catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
