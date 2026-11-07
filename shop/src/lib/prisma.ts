import { PrismaClient, Prisma } from "@prisma/client";

const g = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  g.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") g.prisma = prisma;

export type Tx = Prisma.TransactionClient;
export const D = (v: Prisma.Decimal.Value) => new Prisma.Decimal(v);
export class BusinessError extends Error {}
export const TX_OPTIONS = { maxWait: 10000, timeout: 25000 };

/**
 * Retry a database operation on transient connection issues (e.g. Neon cold starts / pooler wakeups).
 */
export async function withDbRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 1000
): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err: any) {
      attempt++;
      const isTransient =
        err?.code === "P1001" || // Can't reach database server
        err?.code === "P1002" || // Database server timed out
        err?.code === "P1008" || // Operations timed out
        err?.code === "P1017" || // Server has closed the connection
        err?.message?.includes("Can't reach database server") ||
        err?.message?.includes("Connection pool timeout") ||
        err?.message?.includes("connection closed");

      if (attempt < retries && isTransient) {
        console.warn(
          `[Prisma] Transient DB error (${err?.code || "P1001"}), retrying attempt ${attempt}/${retries} in ${delayMs * attempt}ms...`
        );
        await new Promise((res) => setTimeout(res, delayMs * attempt));
        continue;
      }
      throw err;
    }
  }
}
