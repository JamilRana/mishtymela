import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {
      name: "মিষ্টি মেলা",
      address: "ত্রিশাল",
      phone: "01671578965",
      email: "mishtymela@gmail.com",
      receiptFooter: "মিষ্টি মেলা - স্বাদে ও ঐতিহ্যে অনন্য • সাথে থাকার জন্য ধন্যবাদ!",
    },
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "মিষ্টি মেলা",
      currency: "BDT",
      timezone: "Asia/Dhaka",
      address: "ত্রিশাল",
      phone: "01671578965",
      email: "mishtymela@gmail.com",
      vatNumber: "BIN-০০২৯৩৮৪৭১-০১০১",
      receiptFooter: "মিষ্টি মেলা - স্বাদে ও ঐতিহ্যে অনন্য • সাথে থাকার জন্য ধন্যবাদ!",
    },
  });

  for (const [name, type] of [
    ["Cash", "CASH"],
    ["bKash", "MOBILE"],
    ["Bank", "BANK"],
    ["Safe", "SAFE"],
    ["Owner Capital/Drawings", "OWNER"],
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
    "Payment gateway fees",
    "Cash difference",
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

  for (const name of [
    "Other Income (অন্যান্য আয়)",
    "Capital Investment (মূলধন বিনিয়োগ)",
    "Commission & Rebate (কমিশন ও ছাড়)",
    "Scrap / Container Sale (খালি টিন ও অবশিষ্ট বিক্রয়)",
    "Cash difference",
  ]) {
    await prisma.txCategory.upsert({
      where: {
        organizationId_name_type: {
          organizationId: org.id,
          name,
          type: "INCOME",
        },
      },
      update: {},
      create: { organizationId: org.id, name, type: "INCOME" },
    });
  }

  // Seed default users for each role with hashed passwords
  const adminHash = await bcrypt.hash("admin123", 10);
  const managerHash = await bcrypt.hash("manager123", 10);
  const cashierHash = await bcrypt.hash("cashier123", 10);

  await prisma.user.upsert({
    where: { email: "owner@example.com" },
    update: {
      name: "Abu Foysal Tarafdar (Jehan)",
      phone: "01671578965",
      passwordHash: adminHash,
      role: "OWNER",
      active: true,
    },
    create: {
      organizationId: org.id,
      name: "Abu Foysal Tarafdar (Jehan)",
      email: "owner@example.com",
      phone: "01671578965",
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
