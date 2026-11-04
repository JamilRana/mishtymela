import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "মৌচাক সুইটস অ্যান্ড কনফেকশনারি",
      currency: "BDT",
      timezone: "Asia/Dhaka",
      address: "১২/এ সাতমসজিদ রোড, ধানমন্ডি, ঢাকা-১২০৯",
      phone: "০১৭১১-২৩৪৫৬৭ (+880 1711-234567)",
      email: "info@mouchaksweets.com",
      vatNumber: "BIN-০০২৯৩৮৪৭১-০১০১",
      receiptFooter: "স্বাদে ও ঐতিহ্যে অনন্য • মিষ্টির মিষ্টি মুখ • সাথে থাকার জন্য ধন্যবাদ!",
    },
  });

  for (const [name, type] of [
    ["Cash", "CASH"],
    ["bKash", "MOBILE"],
    ["Bank", "BANK"],
  ] as const) {
    await prisma.account.upsert({
      where: { organizationId_name: { organizationId: org.id, name } },
      update: {},
      create: { organizationId: org.id, name, type },
    });
  }

  for (const name of [
    "Rent",
    "Salary",
    "Utilities",
    "Transport",
    "Marketing",
    "Repairs",
    "Other",
  ]) {
    await prisma.txCategory.upsert({
      where: {
        organizationId_name_type: {
          organizationId: org.id,
          name,
          type: "EXPENSE",
        },
      },
      update: {},
      create: { organizationId: org.id, name, type: "EXPENSE" },
    });
  }

  // Seed default users for each role with hashed passwords
  const adminHash = await bcrypt.hash("admin123", 10);
  const managerHash = await bcrypt.hash("manager123", 10);
  const cashierHash = await bcrypt.hash("cashier123", 10);

  await prisma.user.upsert({
    where: { email: "owner@example.com" },
    update: { passwordHash: adminHash, role: "OWNER", active: true },
    create: {
      organizationId: org.id,
      name: "Shop Owner (Admin)",
      email: "owner@example.com",
      passwordHash: adminHash,
      role: "OWNER",
      active: true,
    },
  });

  await prisma.user.upsert({
    where: { email: "manager@example.com" },
    update: { passwordHash: managerHash, role: "MANAGER", active: true },
    create: {
      organizationId: org.id,
      name: "Store Manager",
      email: "manager@example.com",
      passwordHash: managerHash,
      role: "MANAGER",
      active: true,
    },
  });

  await prisma.user.upsert({
    where: { email: "cashier@example.com" },
    update: { passwordHash: cashierHash, role: "CASHIER", active: true },
    create: {
      organizationId: org.id,
      name: "POS Cashier",
      email: "cashier@example.com",
      passwordHash: cashierHash,
      role: "CASHIER",
      active: true,
    },
  });

  await prisma.product.upsert({
    where: { organizationId_sku: { organizationId: org.id, sku: "DEMO-001" } },
    update: {},
    create: {
      organizationId: org.id,
      name: "Demo product",
      sku: "DEMO-001",
      sellingPrice: 120,
      reorderLevel: 10,
    },
  });

  console.log("Seeded organization and users successfully for", org.id);
}

main().finally(() => prisma.$disconnect());
