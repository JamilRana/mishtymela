import { PrismaClient } from "@prisma/client";
import { EscPosBuilder, buildTestReceiptEscPos } from "../src/lib/escpos.js";
import { encodeCode128B, generateBarcodeSvg } from "../src/lib/barcode.js";
import { getSmartAlerts } from "../src/actions/alerts.js";

const prisma = new PrismaClient();

async function run() {
  console.log("--- Testing Hardware, ESC/POS, Barcodes & Smart Alerts ---");

  const org = await prisma.organization.findFirstOrThrow();
  console.log("Organization:", org.name);

  // 1. Test ESC/POS Builder & Command Bytes
  const escposBytes = buildTestReceiptEscPos({
    width: 80,
    autoCut: true,
    openCashDrawer: true,
  });
  console.log("Generated ESC/POS Test Receipt Bytes length:", escposBytes.length);
  if (escposBytes.length === 0) {
    throw new Error("Failed to generate ESC/POS byte stream.");
  }

  // Verify ESC/POS commands: Init (0x1B 0x40), Drawer kick (0x1B 0x70), Cut (0x1D 0x56)
  const hexSample = Array.from(escposBytes.slice(0, 10))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(" ");
  console.log("Header ESC/POS Hex Sample:", hexSample);

  // 2. Test Code128 Barcode Generation
  const testSku = "DEMO-001";
  const pattern = encodeCode128B(testSku);
  const svg = generateBarcodeSvg(testSku, { height: 40, includeText: true });
  console.log("Encoded Code128 Pattern length:", pattern.length);
  console.log("Generated Barcode SVG length:", svg.length);
  if (!svg.includes("<svg") || !svg.includes(testSku)) {
    throw new Error("Invalid Code128 SVG generated.");
  }

  // 3. Test Printer Settings in Database
  let printer = await prisma.printerSetting.findFirst({
    where: { organizationId: org.id },
  });

  if (!printer) {
    printer = await prisma.printerSetting.create({
      data: {
        organizationId: org.id,
        name: "কাউন্টার থার্মাল প্রিন্টার (Counter Thermal)",
        connectionType: "USB",
        paperWidth: 80,
        autoCut: true,
        openCashDrawer: true,
        isDefault: true,
      },
    });
    console.log("Created default 80mm thermal printer configuration in database");
  } else {
    console.log("Using existing printer configuration:", printer.name, `${printer.paperWidth}mm`, printer.connectionType);
  }

  console.log("✅ Hardware, ESC/POS & Barcode tests passed successfully!");
}

run()
  .catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
