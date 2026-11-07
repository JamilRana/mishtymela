import { prisma, D } from "../src/lib/prisma";
import { transferFunds } from "../src/modules/treasury/transfers";
import { openDay, getCurrentSession, reopenLastDay } from "../src/modules/treasury/sessions";
import { prepareClosing, closeDay } from "../src/modules/treasury/closing";
import { accountStatement, balancesAsOf } from "../src/modules/treasury/balances";
import { createSale, voidSale } from "../src/modules/sales/service";
import { addManualTransaction } from "../src/modules/finance/service";

const orgId = "00000000-0000-0000-0000-000000000001";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`FAIL: ${msg}`);
  }
  console.log(`PASS: ${msg}`);
}

async function runTests() {
  console.log("=== Starting Treasury & Daily Reconciliation Integration Tests ===");

  // 1. Fetch seed users and accounts
  const owner = await prisma.user.findFirstOrThrow({ where: { organizationId: orgId, role: "OWNER" } });
  const cashier = await prisma.user.findFirstOrThrow({ where: { organizationId: orgId, role: "CASHIER" } });
  const cashAccount = await prisma.account.findFirstOrThrow({ where: { organizationId: orgId, name: "Cash" } });
  const bankAccount = await prisma.account.findFirstOrThrow({ where: { organizationId: orgId, name: "Bank" } });
  const safeAccount = await prisma.account.findFirstOrThrow({ where: { organizationId: orgId, name: "Safe" } });
  const product = await prisma.product.findFirstOrThrow({ where: { organizationId: orgId, sku: "DEMO-001" } });

  // Cleanup previous test sessions and reset cutoff for isolated deterministic run
  await prisma.dayAccountClosing.deleteMany({ where: { session: { organizationId: orgId } } });
  await prisma.daySession.deleteMany({ where: { organizationId: orgId } });
  await prisma.organization.update({ where: { id: orgId }, data: { booksClosedThrough: null } });

  // Ensure accounts have positive funds for testing
  for (const acc of [cashAccount, bankAccount, safeAccount]) {
    const balances = await balancesAsOf(orgId);
    const bal = balances.find((b) => b.id === acc.id)?.balance ?? 0;
    if (bal < 2000) {
      await prisma.transaction.create({
        data: {
          organizationId: orgId,
          type: "INCOME",
          source: "MANUAL",
          amount: D(3000 - bal),
          accountId: acc.id,
          description: "Initial balance for test run",
          createdById: owner.id,
        },
      });
    }
  }

  // 2. Test Transfer Neutrality & Overdraft Block
  console.log("\n--- Testing Transfers ---");
  const initialBalances = await balancesAsOf(orgId);
  const initialCash = initialBalances.find((b) => b.id === cashAccount.id)?.balance ?? 0;
  const initialBank = initialBalances.find((b) => b.id === bankAccount.id)?.balance ?? 0;

  // Attempt overdraft
  let overdraftBlocked = false;
  try {
    await transferFunds({
      orgId,
      fromAccountId: cashAccount.id,
      toAccountId: bankAccount.id,
      amount: initialCash + 9999999,
      userId: owner.id,
    });
  } catch (err: any) {
    overdraftBlocked = true;
  }
  assert(overdraftBlocked, "Overdrawing Cash account is blocked");

  // Valid transfer
  const transferAmount = 250;
  const transferResult = await transferFunds({
    orgId,
    fromAccountId: cashAccount.id,
    toAccountId: bankAccount.id,
    amount: transferAmount,
    note: "Nightly bank deposit",
    userId: owner.id,
  });

  assert(Boolean(transferResult.transferId), "Transfer generates a shared transferId");
  assert(transferResult.outRow.createdById === owner.id, "Transfer outRow tracks userId");
  assert(transferResult.inRow.createdById === owner.id, "Transfer inRow tracks userId");

  const postTransferBalances = await balancesAsOf(orgId);
  const postCash = postTransferBalances.find((b) => b.id === cashAccount.id)?.balance ?? 0;
  const postBank = postTransferBalances.find((b) => b.id === bankAccount.id)?.balance ?? 0;
  assert(
    Math.abs(postCash - (initialCash - transferAmount)) < 0.01,
    `Cash decreased by ${transferAmount}`
  );
  assert(
    Math.abs(postBank - (initialBank + transferAmount)) < 0.01,
    `Bank increased by ${transferAmount}`
  );

  // 3. Test Day Open & Invariant 5 (One open session per org)
  console.log("\n--- Testing Day Opening & Session Concurrency ---");
  const openedSession = await openDay({
    orgId,
    openingCash: postCash,
    destinationAccountId: safeAccount.id,
    userId: cashier.id,
    note: "Morning shift open",
  });

  assert(openedSession.status === "OPEN", "Day session successfully opened with OPEN status");
  assert(openedSession.openedById === cashier.id, "Day session tracks openedById (cashier)");

  let secondOpenBlocked = false;
  try {
    await openDay({
      orgId,
      openingCash: postCash,
      userId: owner.id,
    });
  } catch {
    secondOpenBlocked = true;
  }
  assert(secondOpenBlocked, "Second concurrent open session is rejected by partial unique index");

  // 4. Record sales and manual transactions during session
  console.log("\n--- Testing Transactions during Session ---");
  const saleKey = `treasury-test-sale-${Date.now()}`;
  const sale = await createSale({
    orgId,
    idempotencyKey: saleKey,
    accountId: cashAccount.id,
    items: [{ productId: product.id, quantity: 2 }],
    userId: cashier.id,
  });
  assert(sale.createdById === cashier.id, "Sale tracks createdById");

  const expenseTx = await addManualTransaction({
    orgId,
    type: "EXPENSE",
    amount: 50,
    accountId: cashAccount.id,
    description: "Cleaning supplies",
    userId: cashier.id,
  });
  assert(expenseTx.createdById === cashier.id, "Manual expense tracks createdById");

  // 5. Test prepareClosing & Fingerprint
  console.log("\n--- Testing prepareClosing ---");
  const prep = await prepareClosing(orgId);
  assert(Boolean(prep.fingerprint), "Fingerprint generated");
  assert(prep.cashierSummary.length > 0, "Cashier sales summary returned");
  const cashierStat = prep.cashierSummary.find((c) => c.userId === cashier.id);
  assert(Boolean(cashierStat && cashierStat.orderCount >= 1), "Cashier sales counted in summary");

  // 6. Test Closing with Variance Approval & bcrypt Password
  console.log("\n--- Testing Closing with Variance ---");
  const cashCalc = prep.accounts.find((a) => a.accountId === cashAccount.id)!;
  const expectedCash = cashCalc.expectedBalance;

  // Test closing with variance but NO reason -> must reject
  let missingReasonRejected = false;
  try {
    await closeDay({
      orgId,
      counted: prep.accounts.map((a) => ({
        accountId: a.accountId,
        amount: a.accountId === cashAccount.id ? expectedCash - 20 : a.expectedBalance,
      })),
      fingerprint: prep.fingerprint,
      userId: cashier.id,
    });
  } catch (err: any) {
    missingReasonRejected = true;
  }
  assert(missingReasonRejected, "Closing with variance without reason is rejected");

  // Test closing with variance and WRONG password -> must reject
  let wrongPassRejected = false;
  try {
    await closeDay({
      orgId,
      counted: prep.accounts.map((a) => ({
        accountId: a.accountId,
        amount: a.accountId === cashAccount.id ? expectedCash - 20 : a.expectedBalance,
        reason: "Drawer short by 20 taka",
      })),
      fingerprint: prep.fingerprint,
      approverId: owner.id,
      approverPassword: "wrongpassword",
      userId: cashier.id,
    });
  } catch (err: any) {
    wrongPassRejected = true;
  }
  assert(wrongPassRejected, "Closing with invalid approver password is rejected");

  // Test closing with valid owner password ("admin123" from seed)
  const closeResult = await closeDay({
    orgId,
    counted: prep.accounts.map((a) => ({
      accountId: a.accountId,
      amount: a.accountId === cashAccount.id ? expectedCash - 20 : a.expectedBalance,
      reason: "Shortage approved",
    })),
    fingerprint: prep.fingerprint,
    approverId: owner.id,
    approverPassword: "admin123",
    userId: cashier.id,
  });

  assert(closeResult.session.status === "CLOSED", "Session marked CLOSED");
  assert(closeResult.session.closedById === cashier.id, "Session tracks closedById");
  assert(closeResult.session.approvedById === owner.id, "Session tracks approvedById");

  // Verify cutoff is set
  const updatedOrg = await prisma.organization.findUniqueOrThrow({ where: { id: orgId } });
  assert(Boolean(updatedOrg.booksClosedThrough), "Organization booksClosedThrough cutoff is set");

  // Verify ledger balance equals counted balance
  const closedBalances = await balancesAsOf(orgId);
  const finalCash = closedBalances.find((b) => b.id === cashAccount.id)?.balance ?? 0;
  assert(
    Math.abs(finalCash - (expectedCash - 20)) < 0.01,
    "After close, ledger cash balance exactly equals counted cash balance"
  );

  // 7. Test Invariant 4: Closed days are immutable
  console.log("\n--- Testing Immutability Guard ---");
  let guardBlocked = false;
  try {
    await addManualTransaction({
      orgId,
      type: "EXPENSE",
      amount: 100,
      accountId: cashAccount.id,
      description: "Backdated expense",
      occurredAt: new Date(Date.now() - 3600000), // 1 hour ago (before cutoff)
      userId: owner.id,
    });
  } catch {
    guardBlocked = true;
  }
  assert(guardBlocked, "Posting transaction prior to cutoff is strictly blocked");

  // 8. Test Post-Close Void / Refund
  console.log("\n--- Testing Post-Close Voiding / Refund ---");
  const postCloseSale = sale;
  const voidResult = await voidSale({
    orgId,
    saleId: postCloseSale.id,
    userId: owner.id,
  });
  // Original sale must NOT be marked VOID
  const fetchedSale = await prisma.sale.findUniqueOrThrow({ where: { id: postCloseSale.id } });
  assert(fetchedSale.status === "COMPLETED", "Historical closed-day sale status remains COMPLETED");

  const refundTx = await prisma.transaction.findFirst({
    where: { saleId: postCloseSale.id, source: "REFUND" },
  });
  assert(Boolean(refundTx), "Refund EXPENSE transaction was created dated now");
  assert(refundTx?.createdById === owner.id, "Refund transaction tracks userId");

  // 9. Test Reopen Last Day
  console.log("\n--- Testing Reopen Last Day ---");
  const reopened = await reopenLastDay({ orgId, userId: owner.id });
  assert(reopened.status === "OPEN", "Latest day successfully reopened by Owner");

  const orgAfterReopen = await prisma.organization.findUniqueOrThrow({ where: { id: orgId } });
  const priorSession = await prisma.daySession.findFirst({
    where: {
      organizationId: orgId,
      status: "CLOSED",
      id: { not: reopened.id },
    },
    orderBy: { closedAt: "desc" },
  });
  const expectedCutoffTime = priorSession?.closedAt ? priorSession.closedAt.getTime() : null;
  const actualCutoffTime = orgAfterReopen.booksClosedThrough
    ? orgAfterReopen.booksClosedThrough.getTime()
    : null;
  assert(
    actualCutoffTime === expectedCutoffTime,
    "booksClosedThrough cutoff successfully rolled back on reopen"
  );

  // 10. Test Account Statement with User Attribution & Running Balance
  console.log("\n--- Testing Account Statement ---");
  const statement = await accountStatement(
    orgId,
    cashAccount.id,
    new Date(Date.now() - 86400000),
    new Date(Date.now() + 86400000)
  );

  assert(statement.lines.length > 0, "Statement lines returned");
  const firstLineWithUser = statement.lines.find((l) => l.user !== null);
  assert(Boolean(firstLineWithUser?.user?.name), `Statement includes creator name: ${firstLineWithUser?.user?.name}`);

  // Clean up reopened session so environment remains clean
  await prisma.daySession.delete({ where: { id: reopened.id } });

  console.log("\n=== ALL TREASURY & DAILY RECONCILIATION TESTS PASSED! ===");
}

runTests()
  .catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
