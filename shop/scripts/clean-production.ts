import { prisma } from "../src/lib/prisma";

async function cleanForProduction() {
  console.log("Starting Production Database Sanitization...\n");

  await prisma.$transaction(async (tx) => {
    // 1. Delete Sales Return Items and Sales Returns
    const delSalesReturnItems = await tx.salesReturnItem.deleteMany({});
    const delSalesReturns = await tx.salesReturn.deleteMany({});
    console.log(`Deleted ${delSalesReturns.count} sales returns (${delSalesReturnItems.count} items)`);

    // 2. Delete Purchase Returns
    const delPurchaseReturns = await tx.purchaseReturn.deleteMany({});
    console.log(`Deleted ${delPurchaseReturns.count} purchase returns`);

    // 3. Delete Sale Items and Sales
    const delSaleItems = await tx.saleItem.deleteMany({});
    const delSales = await tx.sale.deleteMany({});
    console.log(`Deleted ${delSales.count} sales (${delSaleItems.count} items)`);

    // 4. Delete Order Items and Orders
    const delOrderItems = await tx.orderItem.deleteMany({});
    const delOrders = await tx.order.deleteMany({});
    console.log(`Deleted ${delOrders.count} orders (${delOrderItems.count} items)`);

    // 5. Delete Purchase Items and Purchases
    const delPurchaseItems = await tx.purchaseItem.deleteMany({});
    const delPurchases = await tx.purchase.deleteMany({});
    console.log(`Deleted ${delPurchases.count} purchases (${delPurchaseItems.count} items)`);

    // 6. Delete Payroll Records
    const delPayroll = await tx.payrollRecord.deleteMany({});
    console.log(`Deleted ${delPayroll.count} payroll records`);

    // 7. Delete Contact Ledgers (Dues)
    const delDues = await tx.contactLedger.deleteMany({});
    console.log(`Deleted ${delDues.count} due ledger entries`);

    // 8. Delete Stock Movements
    const delMovements = await tx.stockMovement.deleteMany({});
    console.log(`Deleted ${delMovements.count} stock movements`);

    // 9. Delete Financial Transactions
    const delTransactions = await tx.transaction.deleteMany({});
    console.log(`Deleted ${delTransactions.count} transactions`);

    // 10. Delete Day Account Closings and Day Sessions
    const delClosings = await tx.dayAccountClosing.deleteMany({});
    const delSessions = await tx.daySession.deleteMany({});
    console.log(`Deleted ${delSessions.count} day sessions (${delClosings.count} closings)`);

    // 11. Delete Audit Logs
    const delAudit = await tx.auditLog.deleteMany({});
    console.log(`Deleted ${delAudit.count} audit logs`);

    // 12. Delete Test Contacts (e.g. Test Customer)
    const delTestContacts = await tx.contact.deleteMany({
      where: {
        OR: [
          { name: { contains: "Test" } },
          { name: { contains: "পরীক্ষামূলক" } },
        ],
      },
    });
    console.log(`Deleted ${delTestContacts.count} test contacts`);

    // 13. Delete Demo/Duplicate Products created during tests
    const delDemoProducts = await tx.product.deleteMany({
      where: {
        OR: [
          { sku: "DEMO-001" },
          { sku: "BOX-001" },
          { sku: "০০১" }, // duplicate rosogolla
        ],
      },
    });
    console.log(`Deleted ${delDemoProducts.count} demo/duplicate products`);

    // 14. Reset stock quantities to 0 for all products
    const resetProducts = await tx.product.updateMany({
      data: {
        stockQty: 0,
      },
    });
    console.log(`Reset stockQty to 0 for ${resetProducts.count} products`);

    // 15. Normalize standard average costs to clean numbers
    await tx.product.updateMany({
      where: { sku: "DOI-RASM-02" },
      data: { avgCost: 340 },
    });
    await tx.product.updateMany({
      where: { sku: "RAW-MILK-01" },
      data: { avgCost: 75 },
    });
    await tx.product.updateMany({
      where: { sku: "০৩" }, // Kalojam
      data: { avgCost: 260 },
    });
    console.log(`Normalized standard average costs`);

    // 16. Reset Invoice Sequence so first invoice is #1
    await tx.invoiceSequence.updateMany({
      data: {
        lastNo: 0,
        lastPurchaseNo: 0,
        lastOrderNo: 0,
        lastReturnNo: 0,
      },
    });
    console.log(`Reset Invoice Sequences to start at #1`);
  }, { timeout: 60000, maxWait: 20000 });

  console.log("\nDatabase sanitization completed successfully! System is production-ready.");
}

cleanForProduction()
  .catch((err) => {
    console.error("Sanitization error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
