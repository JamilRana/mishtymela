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

  // 1. Financial Accounts
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

  // 2. Expense Categories
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

  // 3. Income Categories
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

  // 4. Units of Measurement (UOM)
  for (const [name, shortName, conversionRate] of [
    ["kg", "কেজি", 1.0],
    ["gm", "গ্রাম", 0.001],
    ["pcs", "পিস", 1.0],
    ["box", "বক্স", 1.0],
    ["liter", "লিটার", 1.0],
    ["dozen", "ডজন", 12.0],
  ] as const) {
    await prisma.unit.upsert({
      where: {
        organizationId_name: {
          organizationId: org.id,
          name,
        },
      },
      update: { shortName, conversionRate },
      create: {
        organizationId: org.id,
        name,
        shortName,
        conversionRate,
      },
    });
  }

  // 5. Default Brand
  const defaultBrand = await prisma.brand.upsert({
    where: {
      organizationId_name: {
        organizationId: org.id,
        name: "ইন-হাউস প্রস্তুত (In-House)",
      },
    },
    update: {},
    create: {
      organizationId: org.id,
      name: "ইন-হাউস প্রস্তুত (In-House)",
    },
  });

  // 6. Categories & Products
  const sweetsCategory = await prisma.category.upsert({
    where: {
      organizationId_name: {
        organizationId: org.id,
        name: "মিষ্টি (Sweets)",
      },
    },
    update: {},
    create: {
      organizationId: org.id,
      name: "মিষ্টি (Sweets)",
    },
  });

  const packagingCategory = await prisma.category.upsert({
    where: {
      organizationId_name: {
        organizationId: org.id,
        name: "প্যাকেজিং (Packaging)",
      },
    },
    update: {},
    create: {
      organizationId: org.id,
      name: "প্যাকেজিং (Packaging)",
    },
  });

  // Retail product DEMO-001
  await prisma.product.upsert({
    where: {
      organizationId_sku: {
        organizationId: org.id,
        sku: "DEMO-001",
      },
    },
    update: {},
    create: {
      organizationId: org.id,
      categoryId: sweetsCategory.id,
      brandId: defaultBrand.id,
      name: "স্পেশাল রসগোল্লা (Special Rosogolla)",
      sku: "DEMO-001",
      barcode: "200000000001",
      unit: "kg",
      productType: "RETAIL",
      isSellable: true,
      sellingPrice: 320,
      wholesalePrice: 290,
      avgCost: 220,
      stockQty: 50,
      reorderLevel: 10,
      expiryDays: 4,
    },
  });

  // Packaging Box Product
  await prisma.product.upsert({
    where: {
      organizationId_sku: {
        organizationId: org.id,
        sku: "BOX-001",
      },
    },
    update: {},
    create: {
      organizationId: org.id,
      categoryId: packagingCategory.id,
      name: "১ কেজি মিষ্টির বাক্স (1kg Sweet Box)",
      sku: "BOX-001",
      barcode: "200000000002",
      unit: "pcs",
      productType: "PACKAGING",
      isSellable: false,
      sellingPrice: 0,
      avgCost: 12,
      stockQty: 250,
      reorderLevel: 50,
    },
  });

  // 7. Sample Contacts
  // Customer
  const walkInCustomer = await prisma.contact.findFirst({
    where: { organizationId: org.id, phone: "01700000000", type: "CUSTOMER" },
  });
  if (!walkInCustomer) {
    await prisma.contact.create({
      data: {
        organizationId: org.id,
        type: "CUSTOMER",
        name: "সাধারণ খুচরা কাস্টমার (Walk-in)",
        phone: "01700000000",
        address: "ত্রিশাল বাজার",
        openingBalance: 0,
        currentDue: 0,
        creditLimit: 5000,
      },
    });
  }

  // Supplier
  const milkSupplier = await prisma.contact.findFirst({
    where: { organizationId: org.id, phone: "01800000000", type: "SUPPLIER" },
  });
  if (!milkSupplier) {
    await prisma.contact.create({
      data: {
        organizationId: org.id,
        type: "SUPPLIER",
        name: "আলাউদ্দিন ডেইরি ও ছানা খামার",
        phone: "01800000000",
        address: "ধলিতলা, ত্রিশাল",
        openingBalance: 0,
        currentDue: 0,
      },
    });
  }

  // Employee
  const staffWorker = await prisma.contact.findFirst({
    where: { organizationId: org.id, phone: "01900000000", type: "EMPLOYEE" },
  });
  if (!staffWorker) {
    await prisma.contact.create({
      data: {
        organizationId: org.id,
        type: "EMPLOYEE",
        name: "মো: রফিকুল ইসলাম (প্রধান কারিগর)",
        phone: "01900000000",
        address: "ত্রিশাল",
        monthlySalary: 22000,
        designation: "প্রধান মিষ্টি কারিগর",
      },
    });
  }

  // 8. Seed Users
  const passwordHash = await bcrypt.hash("admin123", 10);

  // OWNER
  await prisma.user.upsert({
    where: { email: "owner@example.com" },
    update: {
      name: "Abu Foysal Tarafdar (Jehan)",
      phone: "01671578965",
      passwordHash,
      role: "OWNER",
      active: true,
    },
    create: {
      organizationId: org.id,
      name: "Abu Foysal Tarafdar (Jehan)",
      email: "owner@example.com",
      phone: "01671578965",
      passwordHash,
      role: "OWNER",
      active: true,
    },
  });

  // MANAGER
  await prisma.user.upsert({
    where: { email: "manager@example.com" },
    update: {
      name: "কামাল উদ্দিন (ম্যানেজার)",
      phone: "01722222222",
      passwordHash,
      role: "MANAGER",
      active: true,
    },
    create: {
      organizationId: org.id,
      name: "কামাল উদ্দিন (ম্যানেজার)",
      email: "manager@example.com",
      phone: "01722222222",
      passwordHash,
      role: "MANAGER",
      active: true,
    },
  });

  // CASHIER
  await prisma.user.upsert({
    where: { email: "cashier@example.com" },
    update: {
      name: "সাকিব হাসান (ক্যাশিয়ার)",
      phone: "01711111111",
      passwordHash,
      role: "CASHIER",
      active: true,
    },
    create: {
      organizationId: org.id,
      name: "সাকিব হাসান (ক্যাশিয়ার)",
      email: "cashier@example.com",
      phone: "01711111111",
      passwordHash,
      role: "CASHIER",
      active: true,
    },
  });

  // 9. Invoice Sequences
  await prisma.invoiceSequence.upsert({
    where: { organizationId: org.id },
    update: {},
    create: {
      organizationId: org.id,
      lastNo: 0,
      lastPurchaseNo: 0,
      lastOrderNo: 0,
      lastReturnNo: 0,
    },
  });

  console.log("Seeded master data, demo products, contacts, and roles successfully for", org.id);
}

main().finally(() => prisma.$disconnect());
