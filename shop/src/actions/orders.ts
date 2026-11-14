"use server";

import { prisma, withDbRetry, D, BusinessError, TX_OPTIONS } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth, requireRole } from "@/lib/auth";
import { handleAction } from "@/lib/action-handler";
import { OrderStatus } from "@prisma/client";
import { applyMovement } from "@/modules/inventory/service";
import { assertPostingAllowed } from "@/modules/treasury/guard";

export interface OrderItemInput {
  productId: string;
  quantity: number;
  unitPrice: number;
}

const CreateOrderSchema = z.object({
  contactId: z.string().optional().nullable(),
  customerName: z.string().min(1, "Customer name is required"),
  customerPhone: z.string().min(1, "Customer phone is required"),
  deliveryDate: z.string().min(1, "Delivery date is required"),
  notes: z.string().optional().nullable(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1, "Product is required"),
        quantity: z.coerce.number().positive("Quantity must be greater than zero"),
        unitPrice: z.coerce.number().min(0, "Price must be non-negative"),
      })
    )
    .min(1, "At least one item is required"),
  discount: z.coerce.number().min(0).default(0),
  advancePaid: z.coerce.number().min(0).default(0),
  accountId: z.string().optional().nullable(),
});

const UpdateOrderStatusSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  status: z.nativeEnum(OrderStatus),
  notes: z.string().optional().nullable(),
});

const ConvertOrderToSaleSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  finalPaidAmount: z.coerce.number().min(0).default(0),
  accountId: z.string().optional().nullable(),
});

export async function getOrders(options?: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: OrderStatus | "ALL";
  startDate?: string;
  endDate?: string;
  contactId?: string;
}) {
  return withDbRetry(async () => {
    const session = await requireAuth();
    const orgId = session.organizationId;

    const page = Math.max(1, options?.page ?? 1);
    const pageSize = Math.max(1, Math.min(100, options?.pageSize ?? 20));
    const skip = (page - 1) * pageSize;

    const where: any = { organizationId: orgId };

    if (options?.status && options.status !== "ALL") {
      where.status = options.status;
    }

    if (options?.contactId) {
      where.contactId = options.contactId;
    }

    if (options?.search?.trim()) {
      const q = options.search.trim();
      where.OR = [
        { orderNo: { contains: q, mode: "insensitive" } },
        { customerName: { contains: q, mode: "insensitive" } },
        { customerPhone: { contains: q, mode: "insensitive" } },
      ];
    }

    if (options?.startDate || options?.endDate) {
      where.deliveryDate = {};
      if (options.startDate) {
        where.deliveryDate.gte = new Date(options.startDate);
      }
      if (options.endDate) {
        where.deliveryDate.lte = new Date(options.endDate + "T23:59:59.999Z");
      }
    }

    const [totalCount, orders, allMetrics] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        include: {
          contact: { select: { id: true, name: true, phone: true } },
          items: {
            include: {
              product: { select: { name: true, sku: true, unit: true } },
            },
          },
        },
        orderBy: [{ deliveryDate: "asc" }, { createdAt: "desc" }],
        skip,
        take: pageSize,
      }),
      prisma.order.findMany({
        where: { organizationId: orgId },
        select: {
          status: true,
          advancePaid: true,
          dueBalance: true,
          total: true,
        },
      }),
    ]);

    let pendingCount = 0;
    let readyCount = 0;
    let deliveredCount = 0;
    let totalAdvanceCollected = 0;
    let totalOutstandingDue = 0;

    for (const o of allMetrics) {
      if (o.status === "PENDING" || o.status === "CONFIRMED" || o.status === "IN_PREPARATION") {
        pendingCount++;
      } else if (o.status === "READY") {
        readyCount++;
      } else if (o.status === "DELIVERED") {
        deliveredCount++;
      }
      totalAdvanceCollected += Number(o.advancePaid);
      if (o.status !== "CANCELLED" && o.status !== "DELIVERED") {
        totalOutstandingDue += Number(o.dueBalance);
      }
    }

    return {
      orders: orders.map((o) => ({
        id: o.id,
        orderNo: o.orderNo,
        contactId: o.contactId,
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        deliveryDate: o.deliveryDate.toISOString(),
        subtotal: Number(o.subtotal),
        discount: Number(o.discount),
        advancePaid: Number(o.advancePaid),
        total: Number(o.total),
        dueBalance: Number(o.dueBalance),
        status: o.status,
        notes: o.notes,
        convertedSaleId: o.convertedSaleId,
        createdAt: o.createdAt.toISOString(),
        itemCount: o.items.length,
        items: o.items.map((i) => ({
          id: i.id,
          productId: i.productId,
          productName: i.productName,
          sku: i.product?.sku ?? "",
          unit: i.product?.unit ?? "pcs",
          quantity: Number(i.quantity),
          unitPrice: Number(i.unitPrice),
          lineTotal: Number(i.lineTotal),
        })),
      })),
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
      metrics: {
        pendingCount,
        readyCount,
        deliveredCount,
        totalAdvanceCollected,
        totalOutstandingDue,
      },
    };
  });
}

export async function getOrderById(id: string) {
  return withDbRetry(async () => {
    const session = await requireAuth();
    const orgId = session.organizationId;

    const order = await prisma.order.findFirst({
      where: { id, organizationId: orgId },
      include: {
        contact: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) return null;

    return {
      id: order.id,
      orderNo: order.orderNo,
      contactId: order.contactId,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      deliveryDate: order.deliveryDate.toISOString(),
      subtotal: Number(order.subtotal),
      discount: Number(order.discount),
      advancePaid: Number(order.advancePaid),
      total: Number(order.total),
      dueBalance: Number(order.dueBalance),
      status: order.status,
      notes: order.notes,
      convertedSaleId: order.convertedSaleId,
      createdAt: order.createdAt.toISOString(),
      items: order.items.map((i) => ({
        id: i.id,
        productId: i.productId,
        productName: i.productName,
        sku: i.product?.sku ?? "",
        unit: i.product?.unit ?? "pcs",
        quantity: Number(i.quantity),
        unitPrice: Number(i.unitPrice),
        lineTotal: Number(i.lineTotal),
      })),
    };
  });
}

export async function createOrderAction(rawData: z.infer<typeof CreateOrderSchema>) {
  return handleAction("createOrderAction", async () => {
    const session = await requireRole(["OWNER", "ADMIN", "MANAGER", "CASHIER"]);
    const orgId = session.organizationId;
    const validated = CreateOrderSchema.parse(rawData);

    if (validated.advancePaid > 0 && !validated.accountId) {
      throw new BusinessError("An account must be selected when receiving advance payment");
    }

    // Guard books closed cutoff
    const org = await prisma.organization.findUniqueOrThrow({
      where: { id: orgId },
      select: { booksClosedThrough: true },
    });
    if (org.booksClosedThrough && new Date() <= org.booksClosedThrough) {
      throw new BusinessError("Cannot place orders with transaction dates before the closed book cutoff");
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Generate Order Number: ORD-YYYYMMDD-XXXX
      const today = new Date();
      const yyyymmdd = today.toISOString().slice(0, 10).replace(/-/g, "");
      const orderCountToday = await tx.order.count({
        where: {
          organizationId: orgId,
          orderNo: { startsWith: `ORD-${yyyymmdd}` },
        },
      });
      const orderNo = `ORD-${yyyymmdd}-${String(orderCountToday + 1).padStart(4, "0")}`;

      // 2. Resolve Contact
      let contactId = validated.contactId || null;
      if (!contactId && validated.customerPhone) {
        const existingContact = await tx.contact.findFirst({
          where: { organizationId: orgId, phone: validated.customerPhone },
        });
        if (existingContact) {
          contactId = existingContact.id;
        }
      }

      // 3. Compute Totals
      let subtotal = D(0);
      const itemsToCreate = [];

      for (const item of validated.items) {
        const product = await tx.product.findFirst({
          where: { id: item.productId, organizationId: orgId, active: true },
        });
        if (!product) throw new BusinessError(`Product not found: ${item.productId}`);

        const lineTotal = D(item.quantity).times(D(item.unitPrice));
        subtotal = subtotal.plus(lineTotal);

        itemsToCreate.push({
          productId: product.id,
          productName: product.name,
          quantity: D(item.quantity),
          unitPrice: D(item.unitPrice),
          lineTotal,
        });
      }

      const discount = D(validated.discount || 0);
      if (discount.gt(subtotal)) {
        throw new BusinessError("Discount cannot exceed subtotal");
      }
      const total = subtotal.minus(discount);
      const advancePaid = D(validated.advancePaid || 0);
      if (advancePaid.gt(total)) {
        throw new BusinessError("Advance paid cannot exceed order total");
      }
      const dueBalance = total.minus(advancePaid);

      // 4. Create Order
      const order = await tx.order.create({
        data: {
          organizationId: orgId,
          orderNo,
          contactId,
          customerName: validated.customerName,
          customerPhone: validated.customerPhone,
          deliveryDate: new Date(validated.deliveryDate),
          subtotal,
          discount,
          advancePaid,
          total,
          dueBalance,
          status: OrderStatus.PENDING,
          notes: validated.notes || null,
          createdById: session.userId,
          items: {
            create: itemsToCreate,
          },
        },
        include: { items: true },
      });

      // 5. Post advance payment if any
      if (advancePaid.gt(0) && validated.accountId) {
        await tx.transaction.create({
          data: {
            organizationId: orgId,
            type: "INCOME",
            source: "SALE",
            amount: advancePaid,
            accountId: validated.accountId,
            description: `Advance for Order ${orderNo} (${validated.customerName})`,
            occurredAt: new Date(),
            createdById: session.userId,
          },
        });

        // If customer contact exists, log into contact ledger
        if (contactId) {
          const contact = await tx.contact.findUniqueOrThrow({ where: { id: contactId } });
          await tx.contactLedger.create({
            data: {
              organizationId: orgId,
              contactId,
              date: new Date(),
              refType: "ORDER_ADVANCE",
              refId: order.id,
              description: `Advance payment for order ${orderNo}`,
              credit: advancePaid,
              balanceAfter: contact.currentDue, // advance does not increase customer receivable
              createdById: session.userId,
            },
          });
        }
      }

      return {
        orderId: order.id,
        orderNo: order.orderNo,
        total: Number(order.total),
        advancePaid: Number(order.advancePaid),
        dueBalance: Number(order.dueBalance),
      };
    }, TX_OPTIONS);
  });
}

export async function updateOrderStatusAction(rawData: z.infer<typeof UpdateOrderStatusSchema>) {
  return handleAction("updateOrderStatusAction", async () => {
    const session = await requireRole(["OWNER", "ADMIN", "MANAGER", "CASHIER"]);
    const orgId = session.organizationId;
    const validated = UpdateOrderStatusSchema.parse(rawData);

    const order = await prisma.order.findFirst({
      where: { id: validated.orderId, organizationId: orgId },
    });
    if (!order) throw new BusinessError("Order not found");

    if (order.status === "DELIVERED") {
      throw new BusinessError("Delivered orders cannot have their status altered. Use returns if necessary.");
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: validated.status,
        notes: validated.notes !== undefined ? validated.notes : order.notes,
      },
    });

    revalidatePath("/orders");
    return { id: updated.id, status: updated.status };
  });
}

export async function convertOrderToSaleAction(rawData: z.infer<typeof ConvertOrderToSaleSchema>) {
  return handleAction("convertOrderToSaleAction", async () => {
    const session = await requireRole(["OWNER", "ADMIN", "MANAGER", "CASHIER"]);
    const orgId = session.organizationId;
    const validated = ConvertOrderToSaleSchema.parse(rawData);

    const order = await prisma.order.findFirst({
      where: { id: validated.orderId, organizationId: orgId },
      include: { items: true, contact: true },
    });
    if (!order) throw new BusinessError("Order not found");
    if (order.status === "DELIVERED" || order.convertedSaleId) {
      throw new BusinessError("This order has already been delivered and converted to a sale.");
    }
    if (order.status === "CANCELLED") {
      throw new BusinessError("Cannot convert a cancelled order to sale.");
    }

    const now = new Date();
    await assertPostingAllowed(prisma as any, orgId, now);

    return await prisma.$transaction(async (tx) => {
      // 1. Generate Invoice Sequence
      const seq = await tx.invoiceSequence.upsert({
        where: { organizationId: orgId },
        create: { organizationId: orgId, lastNo: 1 },
        update: { lastNo: { increment: 1 } },
      });
      const invoiceNo = `INV-${String(seq.lastNo).padStart(6, "0")}`;

      // 2. Decrement inventory stock & create StockMovement for each order item
      const builtSaleItems = [];
      for (const item of order.items) {
        const { unitCost } = await applyMovement(tx, {
          orgId,
          productId: item.productId,
          type: "SALE",
          qty: D(item.quantity).neg(),
          refType: "order_delivery",
          userId: session.userId,
        });

        builtSaleItems.push({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          unitCost,
          lineTotal: item.lineTotal,
        });
      }

      // 3. Payment handling
      const advancePaid = D(order.advancePaid);
      const finalPaid = D(validated.finalPaidAmount || 0);
      const totalPaid = advancePaid.plus(finalPaid);
      const orderTotal = D(order.total);
      const finalDue = orderTotal.gt(totalPaid) ? orderTotal.minus(totalPaid) : D(0);

      if (finalPaid.gt(0) && !validated.accountId) {
        throw new BusinessError("An account is required for the final delivery payment");
      }

      // 4. Create Sale Record
      const sale = await tx.sale.create({
        data: {
          organizationId: orgId,
          invoiceNo,
          contactId: order.contactId,
          customerName: order.customerName,
          subtotal: order.subtotal,
          discount: order.discount,
          vatAmount: 0,
          total: orderTotal,
          paid: totalPaid,
          due: finalDue,
          createdById: session.userId,
          items: {
            create: builtSaleItems,
          },
        },
      });

      // 5. If final payment received at delivery, record Income transaction
      if (finalPaid.gt(0) && validated.accountId) {
        await tx.transaction.create({
          data: {
            organizationId: orgId,
            type: "INCOME",
            source: "SALE",
            amount: finalPaid,
            accountId: validated.accountId,
            saleId: sale.id,
            description: `${invoiceNo} - Order delivery payment (${order.orderNo})`,
            occurredAt: now,
            createdById: session.userId,
          },
        });
      }

      // 6. If remaining due > 0 and contact linked, update customer due & ledger
      if (finalDue.gt(0) && order.contactId) {
        const contact = await tx.contact.findUniqueOrThrow({ where: { id: order.contactId } });
        const newCustomerDue = D(contact.currentDue).plus(finalDue);

        await tx.contact.update({
          where: { id: order.contactId },
          data: { currentDue: newCustomerDue },
        });

        await tx.contactLedger.create({
          data: {
            organizationId: orgId,
            contactId: order.contactId,
            date: now,
            refType: "SALE",
            refId: sale.id,
            description: `Order delivered with remaining due: ${invoiceNo} (${order.orderNo})`,
            debit: finalDue,
            credit: 0,
            balanceAfter: newCustomerDue,
            createdById: session.userId,
          },
        });
      }

      // 7. Mark Order as DELIVERED and link convertedSaleId
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.DELIVERED,
          convertedSaleId: sale.id,
          dueBalance: finalDue,
        },
      });

      return {
        saleId: sale.id,
        invoiceNo: sale.invoiceNo,
        total: Number(sale.total),
        paid: Number(sale.paid),
        due: Number(sale.due),
      };
    }, TX_OPTIONS);
  });
}
