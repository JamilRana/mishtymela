import { PrismaClient, ContactType } from "@prisma/client";
import { TX_OPTIONS } from "../src/lib/prisma.js";
import { Decimal } from "@prisma/client/runtime/library";

const D = (n: number | string | Decimal) => new Decimal(n);
const prisma = new PrismaClient();

async function run() {
  console.log("--- Testing Payroll & Employee Salary Management ---");

  const org = await prisma.organization.findFirstOrThrow();
  console.log("Organization:", org.name);

  // 1. Find or create an employee contact
  let employee = await prisma.contact.findFirst({
    where: { organizationId: org.id, type: ContactType.EMPLOYEE },
  });

  if (!employee) {
    employee = await prisma.contact.create({
      data: {
        organizationId: org.id,
        type: ContactType.EMPLOYEE,
        name: "টেস্ট মিষ্টি কারিগর (Test Sweet Craftsman)",
        phone: "01999990001",
        monthlySalary: 25000,
        designation: "সিনিয়র কারিগর",
      },
    });
    console.log("Created test employee with monthly salary ৳25,000");
  } else {
    console.log("Using existing employee:", employee.name, "Salary:", employee.monthlySalary?.toString());
  }

  const account = await prisma.account.findFirstOrThrow({
    where: { organizationId: org.id, type: { in: ["CASH", "BANK"] } },
  });
  console.log("Using disbursement account:", account.name, account.type);

  // 2. Generate or reset test payroll record for current month/year
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  let payroll = await prisma.payrollRecord.findUnique({
    where: {
      organizationId_contactId_month_year: {
        organizationId: org.id,
        contactId: employee.id,
        month,
        year,
      },
    },
  });

  const baseSalary = employee.monthlySalary ? Number(employee.monthlySalary) : 25000;
  const bonus = 2000; // Festival bonus
  const deduction = 1000; // Advance deduction
  const netPayable = baseSalary + bonus - deduction;

  if (payroll) {
    payroll = await prisma.payrollRecord.update({
      where: { id: payroll.id },
      data: {
        baseSalary,
        bonus,
        deduction,
        netPayable,
        paidAmount: 0,
        status: "UNPAID",
      },
    });
    console.log("Reset existing payroll record for month:", month, year);
  } else {
    payroll = await prisma.payrollRecord.create({
      data: {
        organizationId: org.id,
        contactId: employee.id,
        month,
        year,
        baseSalary,
        bonus,
        deduction,
        netPayable,
        paidAmount: 0,
        status: "UNPAID",
      },
    });
    console.log("Created payroll record for month:", month, year);
  }

  console.log("Net Payable calculated:", netPayable.toString(), "Status:", payroll.status);

  // 3. Disburse Salary via atomic transaction
  const payAmount = netPayable;
  const disburseResult = await prisma.$transaction(async (tx) => {
    // A. Expense transaction
    const transaction = await tx.transaction.create({
      data: {
        organizationId: org.id,
        type: "EXPENSE",
        source: "PAYROLL",
        amount: payAmount,
        accountId: account.id,
        description: `Salary: ${employee!.name} (${month}/${year})`,
        occurredAt: new Date(),
      },
    });

    // B. Contact Ledger audit
    await tx.contactLedger.create({
      data: {
        organizationId: org.id,
        contactId: employee!.id,
        date: new Date(),
        refType: "PAYROLL",
        refId: payroll!.id,
        description: `Salary Payment (${month}/${year})`,
        debit: payAmount,
        credit: 0,
        balanceAfter: employee!.currentDue,
      },
    });

    // C. Update Payroll Record
    const updated = await tx.payrollRecord.update({
      where: { id: payroll!.id },
      data: {
        paidAmount: payAmount,
        status: "PAID",
        accountId: account.id,
        paymentDate: new Date(),
      },
    });

    return { updated, transaction };
  }, TX_OPTIONS);

  console.log("Disbursed successfully! Status:", disburseResult.updated.status, "Paid Amount:", disburseResult.updated.paidAmount.toString());

  // 4. Verify in DB
  const verified = await prisma.payrollRecord.findUniqueOrThrow({
    where: { id: payroll.id },
    include: { employee: true },
  });

  if (verified.status !== "PAID" || Number(verified.paidAmount) !== netPayable) {
    throw new Error(`Verification failed: Expected PAID with ${netPayable}, got ${verified.status} with ${verified.paidAmount}`);
  }

  console.log("✅ Payroll & Salary Disbursement test passed successfully!");
}

run()
  .catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
