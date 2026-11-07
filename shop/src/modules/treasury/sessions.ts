import { z } from "zod";
import { prisma, D, BusinessError, TX_OPTIONS } from "@/lib/prisma";
import { assertPostingAllowed } from "./guard";
import { transferFunds } from "./transfers";

export const openDaySchema = z.object({
  orgId: z.string().uuid(),
  openingCash: z.coerce.number().min(0, "Opening cash float cannot be negative"),
  destinationAccountId: z.string().uuid().optional(),
  note: z.string().max(200).optional(),
  userId: z.string().uuid(),
});

export type OpenDayInput = z.input<typeof openDaySchema>;

/**
 * Returns Dhaka calendar date as a Date object for businessDate.
 */
export function getDhakaDateOnly(now: Date = new Date()): Date {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const dateStr = formatter.format(now); // "YYYY-MM-DD"
  return new Date(`${dateStr}T00:00:00.000Z`);
}

/**
 * Retrieves the currently open DaySession for the organization, or null if books are closed.
 */
export async function getCurrentSession(orgId: string) {
  return prisma.daySession.findFirst({
    where: { organizationId: orgId, status: "OPEN" },
    include: {
      openedBy: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
    orderBy: { openedAt: "desc" },
  });
}

/**
 * Retrieves the last closed session for carry-forward balances.
 */
export async function getLastClosedSession(orgId: string) {
  return prisma.daySession.findFirst({
    where: { organizationId: orgId, status: "CLOSED" },
    include: {
      closings: {
        include: {
          account: true,
        },
      },
      closedBy: {
        select: { id: true, name: true, role: true },
      },
      approvedBy: {
        select: { id: true, name: true, role: true },
      },
    },
    orderBy: { closedAt: "desc" },
  });
}

/**
 * Opens a new business trading day session.
 * Enforces one open session per org.
 * If the opening cash float differs from yesterday's counted close, posts a transfer
 * to/from the chosen Safe or Owner equity account.
 */
export async function openDay(input: OpenDayInput) {
  const i = openDaySchema.parse(input);

  return prisma.$transaction(async (tx) => {
    // 1. Invariant 5 check: Only one open session at any time
    const existing = await tx.daySession.findFirst({
      where: { organizationId: i.orgId, status: "OPEN" },
    });
    if (existing) {
      throw new BusinessError(
        "A trading day is already open. Please close the active day before opening a new one."
      );
    }

    // 2. Guard against posting in closed periods
    const now = new Date();
    await assertPostingAllowed(tx, i.orgId, now);

    // 3. Find primary Cash account
    const cashAccount = await tx.account.findFirst({
      where: { organizationId: i.orgId, type: "CASH", active: true },
    });
    if (!cashAccount) {
      throw new BusinessError("Primary Cash account not found.");
    }

    // 4. Find yesterday's closing cash (or current ledger balance if first session)
    const lastClosed = await tx.daySession.findFirst({
      where: { organizationId: i.orgId, status: "CLOSED" },
      include: {
        closings: {
          where: { accountId: cashAccount.id },
        },
      },
      orderBy: { closedAt: "desc" },
    });

    let previousCash: number;
    if (lastClosed?.closings?.[0]) {
      previousCash = Number(lastClosed.closings[0].countedBalance);
    } else {
      const [cashLedger] = await tx.$queryRaw<{ balance: string | null }[]>`
        SELECT COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount ELSE -amount END), 0)::text AS balance
        FROM "Transaction"
        WHERE "accountId" = ${cashAccount.id} AND "voidedAt" IS NULL`;
      previousCash = Number(cashLedger?.balance ?? 0);
    }

    const floatDiff = i.openingCash - previousCash;

    // 5. If float differs and destination account is selected, balance via transfer
    if (Math.abs(floatDiff) > 0.009) {
      if (!i.destinationAccountId) {
        throw new BusinessError(
          `Opening cash float (৳${i.openingCash.toFixed(2)}) differs from previous close (৳${previousCash.toFixed(2)}). Please select a destination Safe or Owner account for the ৳${Math.abs(floatDiff).toFixed(2)} difference.`
        );
      }

      if (floatDiff < 0) {
        // Less cash in drawer: Move money FROM Cash TO Safe/Owner
        const transferAmt = Math.abs(floatDiff);
        const transferId = crypto.randomUUID();
        await tx.transaction.create({
          data: {
            organizationId: i.orgId,
            type: "EXPENSE",
            source: "TRANSFER",
            amount: D(transferAmt),
            accountId: cashAccount.id,
            transferId,
            description: "Opening float adjustment (Cash out)",
            occurredAt: now,
            createdById: i.userId,
          },
        });
        await tx.transaction.create({
          data: {
            organizationId: i.orgId,
            type: "INCOME",
            source: "TRANSFER",
            amount: D(transferAmt),
            accountId: i.destinationAccountId,
            transferId,
            description: "Opening float adjustment (Excess cash deposited)",
            occurredAt: now,
            createdById: i.userId,
          },
        });
      } else {
        // More cash in drawer: Move money FROM Safe/Owner TO Cash
        const transferAmt = floatDiff;
        const transferId = crypto.randomUUID();
        await tx.transaction.create({
          data: {
            organizationId: i.orgId,
            type: "EXPENSE",
            source: "TRANSFER",
            amount: D(transferAmt),
            accountId: i.destinationAccountId,
            transferId,
            description: "Opening float addition (Funds injected into drawer)",
            occurredAt: now,
            createdById: i.userId,
          },
        });
        await tx.transaction.create({
          data: {
            organizationId: i.orgId,
            type: "INCOME",
            source: "TRANSFER",
            amount: D(transferAmt),
            accountId: cashAccount.id,
            transferId,
            description: "Opening float addition (Float received in drawer)",
            occurredAt: now,
            createdById: i.userId,
          },
        });
      }
    }

    // 6. Create the open session
    const businessDate = getDhakaDateOnly(now);
    const session = await tx.daySession.create({
      data: {
        organizationId: i.orgId,
        businessDate,
        status: "OPEN",
        openedAt: now,
        openedById: i.userId,
        note: i.note,
      },
      include: {
        openedBy: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    // 7. Audit log
    await tx.auditLog.create({
      data: {
        organizationId: i.orgId,
        userId: i.userId,
        action: "OPEN_DAY",
        entity: "DaySession",
        entityId: session.id,
        detail: {
          businessDate: businessDate.toISOString(),
          openingCash: i.openingCash,
          previousCash,
          floatDiff,
          destinationAccountId: i.destinationAccountId,
          note: i.note,
        },
      },
    });

    return session;
  }, TX_OPTIONS);
}

/**
 * Reopens the latest closed trading day (OWNER ONLY).
 * Rolls back booksClosedThrough, voids/deletes closing adjustments, and clears closing records.
 */
export async function reopenLastDay(p: { orgId: string; userId: string }) {
  return prisma.$transaction(async (tx) => {
    // 1. Check if there is an active open session
    const openSession = await tx.daySession.findFirst({
      where: { organizationId: p.orgId, status: "OPEN" },
    });
    if (openSession) {
      throw new BusinessError(
        "Cannot reopen a past day while another session is currently open. Close or resolve the active session first."
      );
    }

    // 2. Find latest closed session
    const latestClosed = await tx.daySession.findFirst({
      where: { organizationId: p.orgId, status: "CLOSED" },
      include: { closings: true },
      orderBy: { closedAt: "desc" },
    });

    if (!latestClosed) {
      throw new BusinessError("No closed day session found to reopen.");
    }

    // 3. Find prior closed session to restore booksClosedThrough cutoff
    const priorSession = await tx.daySession.findFirst({
      where: {
        organizationId: p.orgId,
        status: "CLOSED",
        id: { not: latestClosed.id },
        closedAt: { lt: latestClosed.closedAt ?? new Date() },
      },
      orderBy: { closedAt: "desc" },
    });

    // 4. Rollback organization booksClosedThrough
    await tx.organization.update({
      where: { id: p.orgId },
      data: { booksClosedThrough: priorSession?.closedAt ?? null },
    });

    // 5. Remove closing adjustment transactions generated during that close
    const adjTxIds = latestClosed.closings
      .map((c) => c.adjustmentTxId)
      .filter((id): id is string => Boolean(id));

    if (adjTxIds.length > 0) {
      await tx.transaction.deleteMany({
        where: { id: { in: adjTxIds }, organizationId: p.orgId },
      });
    }

    // 6. Delete DayAccountClosing records
    await tx.dayAccountClosing.deleteMany({
      where: { sessionId: latestClosed.id },
    });

    // 7. Reset session to OPEN
    const reopened = await tx.daySession.update({
      where: { id: latestClosed.id },
      data: {
        status: "OPEN",
        closedAt: null,
        closedById: null,
        approvedById: null,
      },
      include: {
        openedBy: { select: { id: true, name: true, role: true } },
      },
    });

    // 8. Audit log
    await tx.auditLog.create({
      data: {
        organizationId: p.orgId,
        userId: p.userId,
        action: "REOPEN_DAY",
        entity: "DaySession",
        entityId: reopened.id,
        detail: {
          reopenedSessionId: latestClosed.id,
          restoredCutoff: priorSession?.closedAt ?? null,
          deletedAdjustmentTxs: adjTxIds.length,
        },
      },
    });

    return reopened;
  }, TX_OPTIONS);
}
