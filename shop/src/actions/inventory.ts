"use server";

import { prisma } from "@/lib/prisma";
import { TX_OPTIONS } from "@/lib/prisma";
import { receiveStock, adjustStock, applyMovement } from "@/modules/inventory/service";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { handleAction } from "@/lib/action-handler";

export async function getStockMovements() {
  const session = await requireRole(["ADMIN", "OWNER", "MANAGER"]);
  const orgId = session.organizationId;

  const movements = await prisma.stockMovement.findMany({
    where: { organizationId: orgId },
    include: { product: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return movements.map((m) => ({
    id: m.id,
    productName: m.product.name,
    sku: m.product.sku,
    type: m.type,
    quantityDelta: Number(m.quantityDelta),
    unitCost: Number(m.unitCost),
    balanceAfter: Number(m.balanceAfter),
    note: m.note,
    createdAt: m.createdAt.toISOString(),
  }));
}

export async function receiveStockAction(data: {
  productId: string;
  quantity: number;
  unitCost: number;
  accountId?: string;
  note?: string;
}) {
  return handleAction("receiveStockAction", async () => {
    const session = await requireRole(["ADMIN", "OWNER", "MANAGER"]);
    const orgId = session.organizationId;

    const res = await receiveStock({
      orgId,
      productId: data.productId,
      quantity: data.quantity,
      unitCost: data.unitCost,
      accountId: data.accountId,
      note: data.note,
    });

    try {
      revalidatePath("/inventory");
      revalidatePath("/products");
      revalidatePath("/dashboard");
      revalidatePath("/pos");
    } catch {}

    return { balanceAfter: Number(res.balanceAfter) };
  }, "Failed to receive stock.");
}

export async function adjustStockAction(data: {
  productId: string;
  quantityDelta: number;
  reason: string;
}) {
  return handleAction("adjustStockAction", async () => {
    const session = await requireRole(["ADMIN", "OWNER", "MANAGER"]);
    const orgId = session.organizationId;

    const res = await adjustStock({
      orgId,
      productId: data.productId,
      quantityDelta: data.quantityDelta,
      reason: data.reason,
    });

    try {
      revalidatePath("/inventory");
      revalidatePath("/products");
      revalidatePath("/dashboard");
      revalidatePath("/pos");
    } catch {}

    return { balanceAfter: Number(res.balanceAfter) };
  }, "Failed to adjust stock.");
}

export async function issueKitchenStockAction(data: {
  productId: string;
  quantity: number;
  karigorName?: string;
  note?: string;
}) {
  return handleAction("issueKitchenStockAction", async () => {
    const session = await requireRole(["ADMIN", "OWNER", "MANAGER"]);
    const orgId = session.organizationId;

    const reason = `[Kitchen Issue] ${data.karigorName ? `Karigor: ${data.karigorName} • ` : ""}${data.note || "Issued for sweet production"}`;

    const res = await adjustStock({
      orgId,
      productId: data.productId,
      quantityDelta: -Math.abs(data.quantity),
      reason,
    });

    try {
      revalidatePath("/inventory");
      revalidatePath("/products");
      revalidatePath("/dashboard");
      revalidatePath("/reports");
      revalidatePath("/pos");
    } catch {}

    return { balanceAfter: Number(res.balanceAfter) };
  }, "Failed to issue kitchen stock.");
}

export async function reportWastageAction(data: {
  productId: string;
  quantity: number;
  reason: string;
}) {
  return handleAction("reportWastageAction", async () => {
    const session = await requireRole(["ADMIN", "OWNER", "MANAGER"]);
    const orgId = session.organizationId;

    const note = `[Wastage/Spoilage] ${data.reason}`;

    const res = await adjustStock({
      orgId,
      productId: data.productId,
      quantityDelta: -Math.abs(data.quantity),
      reason: note,
    });

    try {
      revalidatePath("/inventory");
      revalidatePath("/products");
      revalidatePath("/dashboard");
      revalidatePath("/reports");
      revalidatePath("/pos");
    } catch {}

    return { balanceAfter: Number(res.balanceAfter) };
  }, "Failed to report wastage.");
}

export async function recordSweetProductionAction(data: {
  sweetProductId: string;
  quantityProduced: number;
  unitCost?: number;
  ingredientsUsed?: Array<{ productId: string; quantity: number }>;
  note?: string;
  idempotencyKey?: string;
}) {
  return handleAction("recordSweetProductionAction", async () => {
    const session = await requireRole(["ADMIN", "OWNER", "MANAGER"]);
    const orgId = session.organizationId;
    const idempotencyKey = data.idempotencyKey?.trim() || null;

    // Idempotency check: prevent duplicate batches if retried or double-clicked
    if (idempotencyKey) {
      const existing = await prisma.stockMovement.findFirst({
        where: {
          organizationId: orgId,
          productId: data.sweetProductId,
          refType: "production",
          refId: idempotencyKey,
        },
      });
      if (existing) {
        return {
          balanceAfter: Number(existing.balanceAfter),
          calculatedCost: Number(existing.unitCost),
        };
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. If raw ingredients were consumed, deduct them atomically
      let calculatedIngredientsCost = 0;
      if (data.ingredientsUsed && data.ingredientsUsed.length > 0) {
        for (const ing of data.ingredientsUsed) {
          if (ing.quantity > 0) {
            const move = await applyMovement(tx, {
              orgId,
              productId: ing.productId,
              type: "PRODUCTION",
              qty: -Math.abs(ing.quantity),
              note: `[Production Ingredient] Used in sweet production batch`,
              refType: "production",
              refId: idempotencyKey || undefined,
            });
            calculatedIngredientsCost += Math.abs(ing.quantity) * Number(move.unitCost);
          }
        }
      }

      // 2. Increment stock of finished sweet
      const sweetCost =
        data.unitCost && data.unitCost > 0
          ? data.unitCost
          : data.quantityProduced > 0 && calculatedIngredientsCost > 0
          ? calculatedIngredientsCost / data.quantityProduced
          : 0;

      const res = await applyMovement(tx, {
        orgId,
        productId: data.sweetProductId,
        type: "PRODUCTION",
        qty: Math.abs(data.quantityProduced),
        unitCost: sweetCost,
        note: `[Sweet Production Batch] ${data.note || "Fresh kitchen production ready for retail sale"}`,
        refType: "production",
        refId: idempotencyKey || undefined,
      });

      return {
        balanceAfter: Number(res.balanceAfter),
        calculatedCost: sweetCost,
      };
    }, TX_OPTIONS);

    try {
      revalidatePath("/inventory");
      revalidatePath("/products");
      revalidatePath("/dashboard");
      revalidatePath("/reports");
      revalidatePath("/pos");
    } catch {}

    return result;
  }, "Failed to record sweet production batch.");
}
