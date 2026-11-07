import { BusinessError, type Tx } from "@/lib/prisma";

/**
 * Guard that guarantees closed periods are immutable.
 * Throws a BusinessError if occurredAt is at or before the organization's booksClosedThrough cutoff.
 */
export async function assertPostingAllowed(
  tx: Tx,
  orgId: string,
  occurredAt: Date = new Date()
) {
  const org = await tx.organization.findUnique({
    where: { id: orgId },
    select: { booksClosedThrough: true },
  });

  if (!org) {
    throw new BusinessError("Organization not found.");
  }

  if (org.booksClosedThrough && occurredAt <= org.booksClosedThrough) {
    const closedDateStr = org.booksClosedThrough.toLocaleString("en-GB", {
      timeZone: "Asia/Dhaka",
    });
    throw new BusinessError(
      `Books are closed through ${closedDateStr} (Dhaka time). Postings or modifications on or before this cutoff are not allowed.`
    );
  }
}
