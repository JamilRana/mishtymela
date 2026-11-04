const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

export function toBnDigits(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return "";
  return String(val).replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)] ?? d);
}

export function toEnDigits(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return "";
  const bnToEn: Record<string, string> = {
    "০": "0", "১": "1", "২": "2", "৩": "3", "৪": "4",
    "৫": "5", "৬": "6", "৭": "7", "৮": "8", "৯": "9",
  };
  return String(val).replace(/[০-৯]/g, (d) => bnToEn[d] || d);
}

const BN_MONTHS = [
  "জানুয়ারি",
  "ফেব্রুয়ারি",
  "মার্চ",
  "এপ্রিল",
  "মে",
  "জুন",
  "জুলাই",
  "আগস্ট",
  "সেপ্টেম্বর",
  "অক্টোবর",
  "নভেম্বর",
  "ডিসেম্বর",
];

export function formatDhakaDateBangla(date: Date | string, showTime: boolean = true): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";

  // Convert to Asia/Dhaka
  const options: Intl.DateTimeFormatOptions = {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  };

  const formatter = new Intl.DateTimeFormat("en-US", options);
  const parts = formatter.formatToParts(d);

  const getPart = (type: string) => parts.find((p) => p.type === type)?.value || "";

  const day = getPart("day");
  const monthNum = parseInt(getPart("month") || "1", 10);
  const year = getPart("year");
  const hour = getPart("hour");
  const minute = getPart("minute");
  const dayPeriod = getPart("dayPeriod").toLowerCase(); // "am" or "pm"

  const monthName = BN_MONTHS[monthNum - 1] || "";
  const periodBn = dayPeriod === "pm" ? "অপরাহ্ন" : "পূর্বাহ্ন";

  let result = `${toBnDigits(day)} ${monthName} ${toBnDigits(year)}`;
  if (showTime) {
    result += `, ${toBnDigits(hour)}:${toBnDigits(minute)} ${periodBn}`;
  }
  return result;
}

const UNIT_MAP_BN: Record<string, string> = {
  kg: "কেজি",
  kilogram: "কেজি",
  gm: "গ্রাম",
  gram: "গ্রাম",
  pot: "হাঁড়ি",
  pcs: "পিস",
  piece: "পিস",
  pieces: "পিস",
  item: "টি",
  box: "বক্স",
  liter: "লিটার",
  ltr: "লিটার",
};

export function formatUnitBangla(unit: string): string {
  const lower = unit.toLowerCase().trim();
  return UNIT_MAP_BN[lower] || unit;
}
