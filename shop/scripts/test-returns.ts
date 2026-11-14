import { PrismaClient, MovementType, ReturnStatus } from "@prisma/client";
import { TX_OPTIONS } from "../src/lib/prisma.js";
import { Decimal } from "@prisma/client/runtime/library";

const D = (n: number | string | Decimal) => new Decimal(n);
const prisma = new PrismaClient();

async function run() {
  console.log("--- Testing Returns Management (Sales & Purchase Returns) ---");

  const org = await prisma.organization.findFirstOrThrow();
  console.log("Organization:", org.name);

  const product = await prisma.product.findFirstOrThrow({
    where: { organizationId: org.id, active: true, sku: "DEMO-001" },
  });

  const account = await prisma.account.findFirstOrThrow({
    where: { organizationId: org.id, type: { in: ["CASH", "BANK"] } },
  });

  // 1. Create a dummy sale to return against
  const sale = await prisma.$transaction(async (tx) => {
    const seq = await tx.invoiceSequence.upsert({
      where: { organizationId: org.id },
      create: { organizationId: org.id, lastNo: 1 },
      update: { lastNo: { increment: 1 } },
    });
    const invoiceNo = `INV-TEST-RTN-${String(seq.lastNo).padStart(6, "0")}`;

    return tx.sale.create({
      data: {
        organizationId: org.id,
        invoiceNo,
        customerName: "ফেরত গ্রাহক (Return Test Customer)",
        subtotal: 640,
        discount: 0,
        total: 640,
        paid: 640,
        due: 0,
        items: {
          create: [
            {
              productId: product.id,
              productName: product.name,
              quantity: 2,
              unitPrice: 320,
              unitCost: product.avgCost,
              lineTotal: 640,
            },
          ],
        },
      },
    });
  }, TX_OPTIONS);

  console.log("Created sale for return test:", sale.invoiceNo, "Total: ৳640");

  // 2. Perform Sales Return (Return 1 item with Restock)
  const returnQty = 1;
  const refundRate = 320;
  const refundAmount = returnQty * refundRate;
  const stockBeforeReturn = Number(product.stockQty);

  const salesReturn = await prisma.$transaction(async (tx) => {
    const returnNo = `SRTN-TEST-0001`;

    const sReturn = await tx.salesReturn.create({
      data: {
        organizationId: org.id,
        returnNo,
        saleId: sale.id,
        refundAmount,
        accountId: account.id,
        reason: "প্যাকেজিং সমস্যা",
        status: ReturnStatus.COMPLETED,
        items: {
          create: [
            {
              productId: product.id,
              quantity: returnQty,
              refundRate,
              lineTotal: refundAmount,
              restocked: true,
            },
          ],
        },
      },
    });

    // Increment stock
    const newStock = D(product.stockQty).plus(returnQty);
    await tx.product.update({
      where: { id: product.id },
      data: { stockQty: newStock },
    });

    // Stock Movement
    await tx.stockMovement.create({
      data: {
        organizationId: org.id,
        productId: product.id,
        type: MovementType.SALE_RETURN,
        quantityDelta: returnQty,
        unitCost: product.avgCost,
        balanceAfter: newStock,
        note: `Sales Return: ${returnNo} (Invoice ${sale.invoiceNo})`,
      },
    });

    // Expense Transaction
    await tx.transaction.create({
      data: {
        organizationId: org.id,
        type: "EXPENSE",
        source: "REFUND",
        amount: refundAmount,
        accountId: account.id,
        saleId: sale.id,
        description: `Refund: ${returnNo}`,
      },
    });

    return sReturn;
  }, TX_OPTIONS);

  console.log("Sales return created successfully:", salesReturn.returnNo, "Refund:", salesReturn.refundAmount.toString());

  // Verify stock increment
  const updatedProduct = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
  console.log("Product stock after return:", stockBeforeReturn, "->", updatedProduct.stockQty.toString());
  if (Number(updatedProduct.stockQty) !== stockBeforeReturn + returnQty) {
    throw new Error("Stock was not properly incremented upon sales return.");
  }

  // 3. Perform Purchase Return (Supplier Debit Note)
  const purchase = await prisma.purchase.findFirst({
    where: { organizationId: org.id },
    include: { supplier: true },
  });

  if (purchase) {
    const debitAmount = 500;
    const supplierBeforeDue = Number(purchase.supplier.currentDue);

    const purchaseReturn = await prisma.$transaction(async (tx) => {
      const returnNo = `PRTN-TEST-0001`;

      const pReturn = await tx.purchaseReturn.create({
        data: {
          organizationId: org.id,
          returnNo,
          purchaseId: purchase.id,
          supplierId: purchase.contactId,
          amountCredited: debitAmount,
          reason: "খারাপ দুধ ফেরত",
          status: ReturnStatus.COMPLETED,
        },
      });

      const newDue = D(purchase.supplier.currentDue).minus(debitAmount);
      await tx.contact.update({
        where: { id: purchase.contactId },
        data: { currentDue: newDue },
      });

      await tx.contactLedger.create({
        data: {
          organizationId: org.id,
          contactId: purchase.contactId,
          date: new Date(),
          refType: "PURCHASE_RETURN",
          refId: pReturn.id,
          description: `Debit Note: ${returnNo}`,
          debit: debitAmount,
          credit: 0,
          balanceAfter: newDue,
        },
      });

      return pReturn;
    }, TX_OPTIONS);

    console.log("Purchase return created successfully:", purchaseReturn.returnNo, "Debit Amount:", purchaseReturn.amountCredited.toString());

    const updatedSupplier = await prisma.contact.findUniqueOrThrow({ where: { id: purchase.contactId } });
    console.log("Supplier payable after debit note:", supplierBeforeDue, "->", updatedSupplier.currentDue.toString());
  }

  console.log("✅ Returns Management tests passed successfully!");
}

run()
  .catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
