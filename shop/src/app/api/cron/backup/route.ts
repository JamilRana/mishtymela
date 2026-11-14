import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { put, list, del } from "@vercel/blob";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // 60 seconds max execution time for Vercel Serverless

export async function GET(req: NextRequest) {
  // 1. Verify Vercel Cron Secret (if configured)
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized: Invalid cron secret" }, { status: 401 });
  }

  try {
    // 2. Fetch primary organization
    const org = await prisma.organization.findFirst();
    if (!org) {
      return NextResponse.json({ error: "No organization found" }, { status: 404 });
    }
    const orgId = org.id;

    // 3. Fetch all data tables
    const [
      users,
      categories,
      brands,
      units,
      products,
      accounts,
      txCategories,
      printerSettings,
      invoiceSequences,
      contacts,
      contactLedgers,
      stockMovements,
      sales,
      saleItems,
      purchases,
      purchaseItems,
      orders,
      orderItems,
      salesReturns,
      salesReturnItems,
      purchaseReturns,
      transactions,
      daySessions,
      dayAccountClosings,
      payrollRecords,
    ] = await Promise.all([
      prisma.user.findMany({ where: { organizationId: orgId } }),
      prisma.category.findMany({ where: { organizationId: orgId } }),
      prisma.brand.findMany({ where: { organizationId: orgId } }),
      prisma.unit.findMany({ where: { organizationId: orgId } }),
      prisma.product.findMany({ where: { organizationId: orgId } }),
      prisma.account.findMany({ where: { organizationId: orgId } }),
      prisma.txCategory.findMany({ where: { organizationId: orgId } }),
      prisma.printerSetting.findMany({ where: { organizationId: orgId } }),
      prisma.invoiceSequence.findMany({ where: { organizationId: orgId } }),
      prisma.contact.findMany({ where: { organizationId: orgId } }),
      prisma.contactLedger.findMany({ where: { organizationId: orgId } }),
      prisma.stockMovement.findMany({ where: { organizationId: orgId } }),
      prisma.sale.findMany({ where: { organizationId: orgId } }),
      prisma.saleItem.findMany({ where: { sale: { organizationId: orgId } } }),
      prisma.purchase.findMany({ where: { organizationId: orgId } }),
      prisma.purchaseItem.findMany({ where: { purchase: { organizationId: orgId } } }),
      prisma.order.findMany({ where: { organizationId: orgId } }),
      prisma.orderItem.findMany({ where: { order: { organizationId: orgId } } }),
      prisma.salesReturn.findMany({ where: { organizationId: orgId } }),
      prisma.salesReturnItem.findMany({ where: { salesReturn: { organizationId: orgId } } }),
      prisma.purchaseReturn.findMany({ where: { organizationId: orgId } }),
      prisma.transaction.findMany({ where: { organizationId: orgId } }),
      prisma.daySession.findMany({ where: { organizationId: orgId } }),
      prisma.dayAccountClosing.findMany({ where: { session: { organizationId: orgId } } }),
      prisma.payrollRecord.findMany({ where: { organizationId: orgId } }),
    ]);

    const timestamp = new Date().toISOString();
    const dateFormatted = timestamp.slice(0, 10);
    const filename = `backups/daily/mishtymela-daily-${dateFormatted}.json`;

    const counts = {
      products: products.length,
      categories: categories.length,
      contacts: contacts.length,
      sales: sales.length,
      orders: orders.length,
      purchases: purchases.length,
      transactions: transactions.length,
      stockMovements: stockMovements.length,
    };

    const payload = {
      metadata: {
        version: "1.0.0",
        type: "AUTOMATED_DAILY_CRON",
        createdAt: timestamp,
        shopName: org.name,
        organizationId: orgId,
        counts,
      },
      data: {
        organization: org,
        users,
        categories,
        brands,
        units,
        products,
        accounts,
        txCategories,
        printerSettings,
        invoiceSequences,
        contacts,
        contactLedgers,
        stockMovements,
        sales,
        saleItems,
        purchases,
        purchaseItems,
        orders,
        orderItems,
        salesReturns,
        salesReturnItems,
        purchaseReturns,
        transactions,
        daySessions,
        dayAccountClosings,
        payrollRecords,
      },
    };

    const jsonString = JSON.stringify(payload, null, 2);
    const sizeBytes = Buffer.byteLength(jsonString, "utf8");

    let blobUrl: string | null = null;
    let prunedCount = 0;

    // 4. Upload to Vercel Blob Storage if configured
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(filename, jsonString, {
        access: "public",
        contentType: "application/json",
      });
      blobUrl = blob.url;

      // 5. Automatic retention: Keep last 30 daily backups (Free tier protection)
      try {
        const { blobs } = await list({ prefix: "backups/daily/" });
        if (blobs.length > 30) {
          const sorted = blobs.sort(
            (a, b) => new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime()
          );
          const toDelete = sorted.slice(0, blobs.length - 30);
          for (const b of toDelete) {
            await del(b.url);
            prunedCount++;
          }
        }
      } catch (pruneErr) {
        console.warn("Failed to prune old backups:", pruneErr);
      }
    }

    return NextResponse.json({
      success: true,
      timestamp,
      filename,
      sizeBytes,
      sizeFormatted: `${(sizeBytes / 1024).toFixed(1)} KB`,
      blobUrl,
      blobConfigured: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      prunedCount,
      counts,
    });
  } catch (err: any) {
    console.error("Daily backup cron failed:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
