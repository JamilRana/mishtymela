"use server";

import { prisma, TX_OPTIONS } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { put, list, del } from "@vercel/blob";

export interface BackupMetadata {
  version: string;
  createdAt: string;
  shopName: string;
  organizationId: string;
  counts: Record<string, number>;
}

export interface BackupPayload {
  metadata: BackupMetadata;
  data: {
    organization: any;
    users: any[];
    categories: any[];
    brands: any[];
    units: any[];
    products: any[];
    accounts: any[];
    txCategories: any[];
    printerSettings: any[];
    invoiceSequences: any[];
    contacts: any[];
    contactLedgers: any[];
    stockMovements: any[];
    sales: any[];
    saleItems: any[];
    purchases: any[];
    purchaseItems: any[];
    orders: any[];
    orderItems: any[];
    salesReturns: any[];
    salesReturnItems: any[];
    purchaseReturns: any[];
    transactions: any[];
    daySessions: any[];
    dayAccountClosings: any[];
    payrollRecords: any[];
  };
}

/**
 * Creates a full snapshot export of the database.
 * If Vercel Blob is configured (BLOB_READ_WRITE_TOKEN), uploads the file to Vercel Blob Storage.
 * Always returns the JSON payload for direct client download.
 */
export async function createDatabaseBackupAction() {
  const session = await requireRole(["OWNER", "ADMIN"]);
  const orgId = session.organizationId;

  const [
    org,
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
    prisma.organization.findUniqueOrThrow({ where: { id: orgId } }),
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
  const timeFormatted = timestamp.slice(11, 19).replace(/:/g, "-");
  const filename = `backups/mishtymela-backup-${dateFormatted}-${timeFormatted}.json`;

  const counts: Record<string, number> = {
    products: products.length,
    categories: categories.length,
    contacts: contacts.length,
    sales: sales.length,
    orders: orders.length,
    purchases: purchases.length,
    transactions: transactions.length,
    stockMovements: stockMovements.length,
  };

  const payload: BackupPayload = {
    metadata: {
      version: "1.0.0",
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
  let blobError: string | null = null;

  // Upload to Vercel Blob Storage if configured
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const blob = await put(filename, jsonString, {
        access: "public",
        contentType: "application/json",
      });
      blobUrl = blob.url;
    } catch (err: any) {
      console.warn("Vercel Blob upload failed:", err?.message);
      blobError = err?.message || "Failed to upload to Vercel Blob";
    }
  }

  return {
    success: true,
    backup: {
      filename,
      sizeBytes,
      sizeFormatted: `${(sizeBytes / 1024).toFixed(1)} KB`,
      createdAt: timestamp,
      url: blobUrl,
      blobConfigured: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      blobError,
      recordsCount: Object.values(counts).reduce((a, b) => a + b, 0),
      jsonContent: jsonString,
    },
  };
}

/**
 * Lists available backups from Vercel Blob Storage.
 */
export async function listDatabaseBackupsAction() {
  await requireRole(["OWNER", "ADMIN"]);

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return {
      success: true,
      blobConfigured: false,
      backups: [],
    };
  }

  try {
    const { blobs } = await list({ prefix: "backups/" });
    const formatted = blobs
      .map((b) => ({
        url: b.url,
        pathname: b.pathname,
        filename: b.pathname.replace("backups/", ""),
        sizeBytes: b.size,
        sizeFormatted: `${(b.size / 1024).toFixed(1)} KB`,
        uploadedAt: b.uploadedAt.toISOString(),
      }))
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

    return {
      success: true,
      blobConfigured: true,
      backups: formatted,
    };
  } catch (err: any) {
    return {
      success: false,
      blobConfigured: true,
      error: err?.message || "Failed to list backups from Vercel Blob",
      backups: [],
    };
  }
}

/**
 * Deletes a specific backup from Vercel Blob Storage.
 */
export async function deleteBackupAction(url: string) {
  await requireRole(["OWNER", "ADMIN"]);

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("Vercel Blob Storage is not configured");
  }

  try {
    await del(url);
    return { success: true };
  } catch (err: any) {
    throw new Error(err?.message || "Failed to delete backup from Blob Storage");
  }
}

/**
 * Restores the database from a backup payload (either provided as JSON or fetched from Blob URL).
 * Uses an extended atomic transaction to wipe transactional tables and recreate from backup.
 */
export async function restoreDatabaseBackupAction(input: {
  jsonString?: string;
  backupUrl?: string;
}) {
  const session = await requireRole(["OWNER", "ADMIN"]);
  const targetOrgId = session.organizationId;

  let content = input.jsonString?.trim();

  // If URL provided, fetch from Blob
  if (!content && input.backupUrl) {
    const res = await fetch(input.backupUrl);
    if (!res.ok) {
      throw new Error(`Failed to download backup file from storage (HTTP ${res.status})`);
    }
    content = await res.text();
  }

  if (!content) {
    throw new Error("No backup content provided to restore");
  }

  let payload: BackupPayload;
  try {
    payload = JSON.parse(content);
  } catch {
    throw new Error("Invalid backup file: Not valid JSON format");
  }

  if (!payload.metadata || !payload.data || payload.metadata.version !== "1.0.0") {
    throw new Error("Invalid backup format or unsupported schema version");
  }

  const { data } = payload;

  // Execute restore inside transaction with 60s timeout
  await prisma.$transaction(
    async (tx) => {
      // 1. Wipe existing transaction tables in correct FK order
      await tx.salesReturnItem.deleteMany({ where: { salesReturn: { organizationId: targetOrgId } } });
      await tx.salesReturn.deleteMany({ where: { organizationId: targetOrgId } });
      await tx.purchaseReturn.deleteMany({ where: { organizationId: targetOrgId } });
      await tx.saleItem.deleteMany({ where: { sale: { organizationId: targetOrgId } } });
      await tx.sale.deleteMany({ where: { organizationId: targetOrgId } });
      await tx.orderItem.deleteMany({ where: { order: { organizationId: targetOrgId } } });
      await tx.order.deleteMany({ where: { organizationId: targetOrgId } });
      await tx.purchaseItem.deleteMany({ where: { purchase: { organizationId: targetOrgId } } });
      await tx.purchase.deleteMany({ where: { organizationId: targetOrgId } });
      await tx.payrollRecord.deleteMany({ where: { organizationId: targetOrgId } });
      await tx.contactLedger.deleteMany({ where: { organizationId: targetOrgId } });
      await tx.stockMovement.deleteMany({ where: { organizationId: targetOrgId } });
      await tx.transaction.deleteMany({ where: { organizationId: targetOrgId } });
      await tx.dayAccountClosing.deleteMany({ where: { session: { organizationId: targetOrgId } } });
      await tx.daySession.deleteMany({ where: { organizationId: targetOrgId } });

      // 2. Restore Master Categories, Brands, Units
      for (const cat of data.categories || []) {
        await tx.category.upsert({
          where: { id: cat.id },
          create: { id: cat.id, name: cat.name, organizationId: targetOrgId },
          update: { name: cat.name },
        });
      }

      for (const b of data.brands || []) {
        await tx.brand.upsert({
          where: { id: b.id },
          create: { id: b.id, name: b.name, organizationId: targetOrgId },
          update: { name: b.name },
        });
      }

      for (const u of data.units || []) {
        await tx.unit.upsert({
          where: { id: u.id },
          create: {
            id: u.id,
            name: u.name,
            shortName: u.shortName || u.name,
            conversionRate: u.conversionRate || 1.0,
            organizationId: targetOrgId,
          },
          update: {
            name: u.name,
            shortName: u.shortName || u.name,
            conversionRate: u.conversionRate || 1.0,
          },
        });
      }

      // 3. Restore Products
      for (const p of data.products || []) {
        await tx.product.upsert({
          where: { id: p.id },
          create: {
            id: p.id,
            organizationId: targetOrgId,
            categoryId: p.categoryId,
            brandId: p.brandId,
            unitId: p.unitId,
            name: p.name,
            sku: p.sku,
            barcode: p.barcode,
            imageUrl: p.imageUrl,
            unit: p.unit,
            productType: p.productType,
            isSellable: p.isSellable,
            sellingPrice: p.sellingPrice,
            wholesalePrice: p.wholesalePrice,
            avgCost: p.avgCost,
            stockQty: p.stockQty,
            reorderLevel: p.reorderLevel,
            expiryDays: p.expiryDays,
            active: p.active,
          },
          update: {
            name: p.name,
            sku: p.sku,
            barcode: p.barcode,
            sellingPrice: p.sellingPrice,
            wholesalePrice: p.wholesalePrice,
            avgCost: p.avgCost,
            stockQty: p.stockQty,
            reorderLevel: p.reorderLevel,
            active: p.active,
          },
        });
      }

      // 4. Restore Accounts & Tx Categories
      for (const acc of data.accounts || []) {
        await tx.account.upsert({
          where: { id: acc.id },
          create: { id: acc.id, name: acc.name, type: acc.type, active: acc.active, organizationId: targetOrgId },
          update: { name: acc.name, type: acc.type, active: acc.active },
        });
      }

      for (const tc of data.txCategories || []) {
        await tx.txCategory.upsert({
          where: { id: tc.id },
          create: { id: tc.id, name: tc.name, type: tc.type, organizationId: targetOrgId },
          update: { name: tc.name, type: tc.type },
        });
      }

      // 5. Restore Contacts
      for (const c of data.contacts || []) {
        await tx.contact.upsert({
          where: { id: c.id },
          create: { id: c.id, name: c.name, type: c.type, phone: c.phone, email: c.email, address: c.address, organizationId: targetOrgId },
          update: { name: c.name, type: c.type, phone: c.phone, email: c.email, address: c.address },
        });
      }

      // 6. Restore Sales & SaleItems
      if (data.sales && data.sales.length > 0) {
        await tx.sale.createMany({
          data: data.sales.map((s: any) => ({ ...s, organizationId: targetOrgId })),
          skipDuplicates: true,
        });
      }
      if (data.saleItems && data.saleItems.length > 0) {
        await tx.saleItem.createMany({
          data: data.saleItems,
          skipDuplicates: true,
        });
      }

      // 7. Restore Orders & OrderItems
      if (data.orders && data.orders.length > 0) {
        await tx.order.createMany({
          data: data.orders.map((o: any) => ({ ...o, organizationId: targetOrgId })),
          skipDuplicates: true,
        });
      }
      if (data.orderItems && data.orderItems.length > 0) {
        await tx.orderItem.createMany({
          data: data.orderItems,
          skipDuplicates: true,
        });
      }

      // 8. Restore Purchases & PurchaseItems
      if (data.purchases && data.purchases.length > 0) {
        await tx.purchase.createMany({
          data: data.purchases.map((pr: any) => ({ ...pr, organizationId: targetOrgId })),
          skipDuplicates: true,
        });
      }
      if (data.purchaseItems && data.purchaseItems.length > 0) {
        await tx.purchaseItem.createMany({
          data: data.purchaseItems,
          skipDuplicates: true,
        });
      }

      // 9. Restore Stock Movements
      if (data.stockMovements && data.stockMovements.length > 0) {
        await tx.stockMovement.createMany({
          data: data.stockMovements.map((sm: any) => ({ ...sm, organizationId: targetOrgId })),
          skipDuplicates: true,
        });
      }

      // 10. Restore Transactions
      if (data.transactions && data.transactions.length > 0) {
        await tx.transaction.createMany({
          data: data.transactions.map((t: any) => ({ ...t, organizationId: targetOrgId })),
          skipDuplicates: true,
        });
      }

      // 11. Restore Contact Ledgers
      if (data.contactLedgers && data.contactLedgers.length > 0) {
        await tx.contactLedger.createMany({
          data: data.contactLedgers.map((cl: any) => ({ ...cl, organizationId: targetOrgId })),
          skipDuplicates: true,
        });
      }

      // 12. Restore Invoice Sequences
      for (const seq of data.invoiceSequences || []) {
        await tx.invoiceSequence.upsert({
          where: { organizationId: targetOrgId },
          create: {
            organizationId: targetOrgId,
            lastNo: seq.lastNo,
            lastPurchaseNo: seq.lastPurchaseNo,
            lastOrderNo: seq.lastOrderNo,
            lastReturnNo: seq.lastReturnNo,
          },
          update: {
            lastNo: seq.lastNo,
            lastPurchaseNo: seq.lastPurchaseNo,
            lastOrderNo: seq.lastOrderNo,
            lastReturnNo: seq.lastReturnNo,
          },
        });
      }
    },
    { timeout: 60000, maxWait: 20000 }
  );

  try {
    revalidatePath("/dashboard");
    revalidatePath("/inventory");
    revalidatePath("/products");
    revalidatePath("/finance");
    revalidatePath("/sales");
    revalidatePath("/orders");
    revalidatePath("/settings");
  } catch {}

  return {
    success: true,
    restoredAt: new Date().toISOString(),
    backupCreatedAt: payload.metadata.createdAt,
    shopName: payload.metadata.shopName,
    summary: payload.metadata.counts,
  };
}
