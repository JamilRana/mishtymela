import { PrismaClient, ContactType } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
  console.log("--- Testing Dues Management & Contact Ledgers ---");

  const org = await prisma.organization.findFirstOrThrow();
  console.log("Organization:", org.name);

  // 1. Find or create a test customer with due
  let customer = await prisma.contact.findFirst({
    where: { organizationId: org.id, type: ContactType.CUSTOMER, phone: "01799990001" },
  });

  if (!customer) {
    customer = await prisma.contact.create({
      data: {
        organizationId: org.id,
        type: ContactType.CUSTOMER,
        name: "পরীক্ষামূলক গ্রাহক (Test Customer)",
        phone: "01799990001",
        currentDue: 1500.0,
        creditLimit: 5000.0,
      },
    });
    console.log("Created test customer with initial due ৳1500");
  } else {
    customer = await prisma.contact.update({
      where: { id: customer.id },
      data: { currentDue: 1500.0 },
    });
    console.log("Reset test customer due to ৳1500");
  }

  // 2. Find a cash/mobile account
  const account = await prisma.account.findFirstOrThrow({
    where: { organizationId: org.id, type: { in: ["CASH", "MOBILE"] } },
  });
  console.log("Using account:", account.name, account.type);

  // 3. Simulate customer due collection of ৳500
  const collectionAmount = 500;
  const balanceBefore = Number(customer.currentDue);
  const balanceAfter = balanceBefore - collectionAmount;

  await prisma.$transaction(async (tx) => {
    // A. Update customer currentDue
    await tx.contact.update({
      where: { id: customer!.id },
      data: { currentDue: balanceAfter },
    });

    // B. Ledger entry
    await tx.contactLedger.create({
      data: {
        organizationId: org.id,
        contactId: customer!.id,
        date: new Date(),
        refType: "DUE_COLLECTION",
        refId: "DUE-COL-TEST-01",
        description: "বাকি আদায় (Customer Due Collection Test)",
        credit: collectionAmount,
        balanceAfter: balanceAfter,
      },
    });

    // C. Treasury account income
    await tx.transaction.create({
      data: {
        organizationId: org.id,
        type: "INCOME",
        source: "CUSTOMER_DUE_PAYMENT",
        amount: collectionAmount,
        accountId: account.id,
        description: `Customer due received: ${customer!.name}`,
      },
    });
  });

  // Verify updated customer
  const updatedCustomer = await prisma.contact.findUniqueOrThrow({
    where: { id: customer.id },
    include: {
      ledgerEntries: {
        orderBy: { date: "desc" },
        take: 3,
      },
    },
  });

  console.log("Updated Customer Current Due:", updatedCustomer.currentDue.toString());
  console.log("Latest Ledger Entry:", {
    refType: updatedCustomer.ledgerEntries[0].refType,
    credit: updatedCustomer.ledgerEntries[0].credit.toString(),
    balanceAfter: updatedCustomer.ledgerEntries[0].balanceAfter.toString(),
  });

  if (Number(updatedCustomer.currentDue) !== 1000) {
    throw new Error(`Expected due 1000, got ${updatedCustomer.currentDue}`);
  }

  console.log("✅ Dues test passed successfully!");
}

run()
  .catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
