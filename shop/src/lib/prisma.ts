import { PrismaClient, Prisma } from "@prisma/client";
const g = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = g.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") g.prisma = prisma;
export type Tx = Prisma.TransactionClient;
export const D = (v: Prisma.Decimal.Value) => new Prisma.Decimal(v);
export class BusinessError extends Error {}
export const TX_OPTIONS = { maxWait: 10000, timeout: 25000 };
