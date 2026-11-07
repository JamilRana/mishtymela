"use server";

import { revalidatePath } from "next/cache";
import { requireAuth, requireRole } from "@/lib/auth";
import { handleAction } from "@/lib/action-handler";
import { withDbRetry } from "@/lib/prisma";
import {
  balancesAsOf,
  accountStatement,
} from "@/modules/treasury/balances";
import { transferFunds } from "@/modules/treasury/transfers";
import {
  getCurrentSession,
  getLastClosedSession,
  openDay,
  reopenLastDay,
} from "@/modules/treasury/sessions";
import {
  prepareClosing,
  closeDay,
  type CloseDayInput,
} from "@/modules/treasury/closing";

/**
 * Returns current open session, last closed session, and account balances for Treasury dashboard.
 */
export async function getTreasuryOverviewAction() {
  return withDbRetry(async () => {
    const session = await requireRole(["ADMIN", "OWNER", "MANAGER"]);
    const orgId = session.organizationId;

    const [currentSession, lastClosedSession, accounts] = await Promise.all([
      getCurrentSession(orgId),
      getLastClosedSession(orgId),
      balancesAsOf(orgId),
    ]);

    return {
      currentSession: currentSession
        ? {
            id: currentSession.id,
            businessDate: currentSession.businessDate.toISOString(),
            openedAt: currentSession.openedAt.toISOString(),
            status: currentSession.status,
            openedBy: currentSession.openedBy,
            note: currentSession.note,
          }
        : null,
      lastClosedSession: lastClosedSession
        ? {
            id: lastClosedSession.id,
            businessDate: lastClosedSession.businessDate.toISOString(),
            closedAt: lastClosedSession.closedAt?.toISOString() ?? null,
            closedBy: lastClosedSession.closedBy,
            approvedBy: lastClosedSession.approvedBy,
            closings: lastClosedSession.closings.map((c) => ({
              accountId: c.accountId,
              accountName: c.account.name,
              countedBalance: Number(c.countedBalance),
              variance: Number(c.variance),
              varianceReason: c.varianceReason,
            })),
          }
        : null,
      accounts,
      userRole: session.role,
    };
  });
}

/**
 * Opens a new business trading day session.
 */
export async function openDayAction(data: {
  openingCash: number;
  destinationAccountId?: string;
  note?: string;
}) {
  return handleAction(
    "openDayAction",
    async () => {
      const session = await requireRole(["ADMIN", "OWNER", "MANAGER"]);
      const orgId = session.organizationId;

      const res = await openDay({
        orgId,
        openingCash: data.openingCash,
        destinationAccountId: data.destinationAccountId,
        note: data.note,
        userId: session.userId,
      });

      try {
        revalidatePath("/finance");
        revalidatePath("/pos");
        revalidatePath("/dashboard");
      } catch {}

      return {
        id: res.id,
        openedAt: res.openedAt.toISOString(),
        businessDate: res.businessDate.toISOString(),
      };
    },
    "Failed to open trading day."
  );
}

/**
 * Transfers funds between two accounts.
 */
export async function transferFundsAction(data: {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  note?: string;
}) {
  return handleAction(
    "transferFundsAction",
    async () => {
      const session = await requireRole(["ADMIN", "OWNER", "MANAGER"]);
      const orgId = session.organizationId;

      const res = await transferFunds({
        orgId,
        fromAccountId: data.fromAccountId,
        toAccountId: data.toAccountId,
        amount: data.amount,
        note: data.note,
        userId: session.userId,
      });

      try {
        revalidatePath("/finance");
        revalidatePath("/dashboard");
      } catch {}

      return {
        transferId: res.transferId,
        amount: res.amount,
        fromAccount: res.fromAccount,
        toAccount: res.toAccount,
      };
    },
    "Failed to transfer funds."
  );
}

/**
 * Prepares the closing wizard calculations (expected balances, fingerprint, cashier stats).
 */
export async function prepareClosingAction() {
  return withDbRetry(async () => {
    const session = await requireRole(["ADMIN", "OWNER", "MANAGER"]);
    const orgId = session.organizationId;

    const res = await prepareClosing(orgId);
    return {
      session: {
        id: res.session.id,
        businessDate: res.session.businessDate.toISOString(),
        openedAt: res.session.openedAt.toISOString(),
        openedBy: res.session.openedBy,
      },
      accounts: res.accounts,
      cashierSummary: res.cashierSummary,
      fingerprint: res.fingerprint,
    };
  });
}

/**
 * Closes the active day session with counted figures and variance approvals.
 */
export async function closeDayAction(data: {
  counted: { accountId: string; amount: number; reason?: string }[];
  fingerprint: string;
  approverId?: string;
  approverPassword?: string;
  note?: string;
}) {
  return handleAction(
    "closeDayAction",
    async () => {
      const session = await requireRole(["ADMIN", "OWNER", "MANAGER"]);
      const orgId = session.organizationId;

      const res = await closeDay({
        orgId,
        counted: data.counted,
        fingerprint: data.fingerprint,
        approverId: data.approverId,
        approverPassword: data.approverPassword,
        note: data.note,
        userId: session.userId,
      });

      try {
        revalidatePath("/finance");
        revalidatePath("/pos");
        revalidatePath("/dashboard");
      } catch {}

      return {
        id: res.session.id,
        closedAt: res.session.closedAt?.toISOString() ?? null,
      };
    },
    "Failed to close trading day."
  );
}

/**
 * Reopens the latest closed day (OWNER ONLY).
 */
export async function reopenLastDayAction() {
  return handleAction(
    "reopenLastDayAction",
    async () => {
      const session = await requireRole(["OWNER"]);
      const orgId = session.organizationId;

      const res = await reopenLastDay({
        orgId,
        userId: session.userId,
      });

      try {
        revalidatePath("/finance");
        revalidatePath("/pos");
        revalidatePath("/dashboard");
      } catch {}

      return {
        id: res.id,
        status: res.status,
      };
    },
    "Failed to reopen day session."
  );
}

/**
 * Retrieves account statement with running balance and user attribution.
 */
export async function getAccountStatementAction(
  accountId: string,
  fromIso?: string,
  toIso?: string
) {
  return withDbRetry(async () => {
    const session = await requireRole(["ADMIN", "OWNER", "MANAGER"]);
    const orgId = session.organizationId;

    const from = fromIso ? new Date(fromIso) : new Date(Date.now() - 30 * 86400000);
    const to = toIso ? new Date(toIso) : new Date();

    const stmt = await accountStatement(orgId, accountId, from, to);
    return {
      account: stmt.account,
      from: stmt.from.toISOString(),
      to: stmt.to.toISOString(),
      openingBalance: stmt.openingBalance,
      closingBalance: stmt.closingBalance,
      lines: stmt.lines.map((l) => ({
        id: l.id,
        occurredAt: l.occurredAt.toISOString(),
        type: l.type,
        source: l.source,
        amount: l.amount,
        description: l.description,
        transferId: l.transferId,
        saleId: l.saleId,
        runningBalance: l.runningBalance,
        userName: l.user?.name ?? null,
        userRole: l.user?.role ?? null,
      })),
    };
  });
}

/**
 * Returns open session status for POS banner (any authenticated user).
 */
export async function getSessionStatusAction() {
  return withDbRetry(async () => {
    const session = await requireAuth();
    const cur = await getCurrentSession(session.organizationId);

    if (!cur) {
      return { isOpen: false };
    }

    return {
      isOpen: true,
      id: cur.id,
      openedAt: cur.openedAt.toISOString(),
      businessDate: cur.businessDate.toISOString(),
      openedByName: cur.openedBy.name,
    };
  });
}
