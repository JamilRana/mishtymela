-- AlterEnum
ALTER TYPE "TxSource" ADD VALUE IF NOT EXISTS 'TRANSFER';
ALTER TYPE "TxSource" ADD VALUE IF NOT EXISTS 'CLOSING_ADJUSTMENT';
ALTER TYPE "TxSource" ADD VALUE IF NOT EXISTS 'REFUND';

-- AlterEnum
ALTER TYPE "AccountType" ADD VALUE IF NOT EXISTS 'SAFE';
ALTER TYPE "AccountType" ADD VALUE IF NOT EXISTS 'OWNER';

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "SessionStatus" AS ENUM ('OPEN', 'CLOSED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterTable Organization
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "booksClosedThrough" TIMESTAMP(3);

-- AlterTable Transaction
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "transferId" TEXT;

-- CreateTable DaySession
CREATE TABLE IF NOT EXISTS "DaySession" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "businessDate" DATE NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'OPEN',
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "openedById" TEXT NOT NULL,
    "closedAt" TIMESTAMP(3),
    "closedById" TEXT,
    "approvedById" TEXT,
    "note" TEXT,

    CONSTRAINT "DaySession_pkey" PRIMARY KEY ("id")
);

-- CreateTable DayAccountClosing
CREATE TABLE IF NOT EXISTS "DayAccountClosing" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "openingBalance" DECIMAL(14,2) NOT NULL,
    "salesIn" DECIMAL(14,2) NOT NULL,
    "otherIn" DECIMAL(14,2) NOT NULL,
    "expensesOut" DECIMAL(14,2) NOT NULL,
    "purchasesOut" DECIMAL(14,2) NOT NULL,
    "transfersNet" DECIMAL(14,2) NOT NULL,
    "expectedBalance" DECIMAL(14,2) NOT NULL,
    "countedBalance" DECIMAL(14,2) NOT NULL,
    "variance" DECIMAL(14,2) NOT NULL,
    "varianceReason" TEXT,
    "adjustmentTxId" TEXT,

    CONSTRAINT "DayAccountClosing_pkey" PRIMARY KEY ("id")
);

-- CreateTable AuditLog
CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "detail" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- Unique constraints & indexes
CREATE UNIQUE INDEX IF NOT EXISTS "DayAccountClosing_sessionId_accountId_key" ON "DayAccountClosing"("sessionId", "accountId");
CREATE INDEX IF NOT EXISTS "Transaction_organizationId_transferId_idx" ON "Transaction"("organizationId", "transferId");
CREATE INDEX IF NOT EXISTS "Transaction_organizationId_accountId_occurredAt_id_idx" ON "Transaction"("organizationId", "accountId", "occurredAt", "id");
CREATE INDEX IF NOT EXISTS "Transaction_organizationId_createdById_idx" ON "Transaction"("organizationId", "createdById");
CREATE INDEX IF NOT EXISTS "DaySession_organizationId_openedAt_idx" ON "DaySession"("organizationId", "openedAt");
CREATE INDEX IF NOT EXISTS "DaySession_organizationId_status_idx" ON "DaySession"("organizationId", "status");
CREATE INDEX IF NOT EXISTS "AuditLog_organizationId_createdAt_idx" ON "AuditLog"("organizationId", "createdAt");
CREATE INDEX IF NOT EXISTS "AuditLog_organizationId_userId_idx" ON "AuditLog"("organizationId", "userId");

-- Invariant 5: Partial Unique Index: only one open session per organization
CREATE UNIQUE INDEX IF NOT EXISTS "DaySession_one_open_per_org"
  ON "DaySession" ("organizationId") WHERE status = 'OPEN';

-- Foreign Keys
DO $$ BEGIN
  ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "DaySession" ADD CONSTRAINT "DaySession_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "DaySession" ADD CONSTRAINT "DaySession_openedById_fkey" FOREIGN KEY ("openedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "DaySession" ADD CONSTRAINT "DaySession_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "DaySession" ADD CONSTRAINT "DaySession_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "DayAccountClosing" ADD CONSTRAINT "DayAccountClosing_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "DaySession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "DayAccountClosing" ADD CONSTRAINT "DayAccountClosing_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
