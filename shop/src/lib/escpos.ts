/**
 * ESC/POS Binary Command Encoder for 58mm & 80mm Thermal Receipt Printers
 * Standard Epson ESC/POS Command Reference
 */

export const ESC = 0x1b;
export const GS = 0x1d;
export const FS = 0x1c;

export interface EscPosOptions {
  width: 58 | 80;
  autoCut?: boolean;
  openCashDrawer?: boolean;
}

export class EscPosBuilder {
  private buffer: number[] = [];
  private width: 58 | 80;

  constructor(options: EscPosOptions = { width: 80, autoCut: true, openCashDrawer: false }) {
    this.width = options.width;
    this.init();
    if (options.openCashDrawer) {
      this.kickDrawer();
    }
  }

  /** Initialize printer */
  init(): this {
    this.buffer.push(ESC, 0x40); // ESC @
    return this;
  }

  /** Kick standard RJ11 cash drawer on Pin 2 or Pin 5 */
  kickDrawer(): this {
    this.buffer.push(ESC, 0x70, 0x00, 0x19, 0xfa); // ESC p 0 25 250
    return this;
  }

  /** Align text: 'left' | 'center' | 'right' */
  align(alignment: "left" | "center" | "right"): this {
    const val = alignment === "center" ? 0x01 : alignment === "right" ? 0x02 : 0x00;
    this.buffer.push(ESC, 0x61, val);
    return this;
  }

  /** Bold text toggle */
  bold(enable: boolean = true): this {
    this.buffer.push(ESC, 0x45, enable ? 0x01 : 0x00);
    return this;
  }

  /** Double height and double width */
  doubleSize(enable: boolean = true): this {
    this.buffer.push(GS, 0x21, enable ? 0x11 : 0x00);
    return this;
  }

  /** Underline toggle */
  underline(enable: boolean = true): this {
    this.buffer.push(ESC, 0x2d, enable ? 0x01 : 0x00);
    return this;
  }

  /** Append text (UTF-8 bytes or ASCII) */
  text(str: string): this {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    for (let i = 0; i < bytes.length; i++) {
      this.buffer.push(bytes[i]);
    }
    return this;
  }

  /** Append text with line feed */
  line(str: string = ""): this {
    if (str) this.text(str);
    this.buffer.push(0x0a); // LF
    return this;
  }

  /** Feed n lines */
  feed(lines: number = 1): this {
    for (let i = 0; i < lines; i++) {
      this.buffer.push(0x0a);
    }
    return this;
  }

  /** Draw dashed separator line */
  separator(char: string = "-"): this {
    const cols = this.width === 58 ? 32 : 48;
    this.line(char.repeat(cols));
    return this;
  }

  /** Two-column row: Left aligned text, Right aligned text (e.g. Item & Price) */
  row(left: string, right: string): this {
    const cols = this.width === 58 ? 32 : 48;
    const rightLen = right.length;
    const maxLeftLen = cols - rightLen - 1;

    let trimmedLeft = left;
    if (left.length > maxLeftLen) {
      trimmedLeft = left.substring(0, maxLeftLen);
    }

    const spaces = Math.max(1, cols - trimmedLeft.length - rightLen);
    this.line(trimmedLeft + " ".repeat(spaces) + right);
    return this;
  }

  /** Feed lines and trigger full or partial paper cut */
  cut(partial: boolean = false): this {
    this.feed(3);
    this.buffer.push(GS, 0x56, partial ? 0x01 : 0x00); // GS V 0
    return this;
  }

  /** Export as Uint8Array for WebUSB or raw TCP socket transmission */
  toBytes(): Uint8Array {
    return new Uint8Array(this.buffer);
  }

  /** Export as base64 string for transmission via HTTP */
  toBase64(): string {
    const bytes = this.toBytes();
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}

/**
 * Generate a standard test receipt for thermal printer verification
 */
export function buildTestReceiptEscPos(options: EscPosOptions): Uint8Array {
  const b = new EscPosBuilder(options);

  b.align("center")
    .doubleSize(true)
    .line("MISTI MELA")
    .doubleSize(false)
    .line("Sweets & Bakery Retail POS")
    .line("Phone: 01700-000000")
    .separator("=")
    .bold(true)
    .line(`PRINTER TEST PAGE (${options.width}mm)`)
    .bold(false)
    .line(new Date().toLocaleString("en-GB", { timeZone: "Asia/Dhaka" }))
    .separator("-");

  b.align("left")
    .row("Paper Specification:", `${options.width}mm Thermal`)
    .row("ESC/POS Emulation:", "Active")
    .row("Cash Drawer Trigger:", options.openCashDrawer ? "Enabled" : "Disabled")
    .row("Auto-Cutter Mechanism:", options.autoCut ? "Enabled" : "Disabled")
    .separator("-")
    .align("center")
    .bold(true)
    .line("THANK YOU FOR YOUR BUSINESS!")
    .bold(false)
    .line("Powered by Retail Core ERP");

  if (options.autoCut) {
    b.cut();
  } else {
    b.feed(3);
  }

  return b.toBytes();
}
