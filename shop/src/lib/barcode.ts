/**
 * Pure TypeScript Code128 Barcode Generator (Code128B)
 * Generates clean SVG barcode vectors without any external npm packages
 */

// Code128 Pattern Dictionary (Value 0 - 106)
const PATTERNS: string[] = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213", // 0-9
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132", // 10-19
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211", // 20-29
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313", // 30-39
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331", // 40-49
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111", // 50-59
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214", // 60-69
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111", // 70-79
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141", // 80-89
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141", // 90-99
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112", // 100-106 (106 is STOP)
];

const START_CODE_B = 104;
const STOP_CODE = 106;

/**
 * Encodes an ASCII string into Code128B pattern string
 */
export function encodeCode128B(text: string): string {
  const sanitized = text.replace(/[^\x20-\x7E]/g, ""); // Keep printable ASCII
  if (!sanitized) return "";

  const codes: number[] = [START_CODE_B];
  let checksum = START_CODE_B;

  for (let i = 0; i < sanitized.length; i++) {
    const code = sanitized.charCodeAt(i) - 32;
    codes.push(code);
    checksum += code * (i + 1);
  }

  const checkDigit = checksum % 103;
  codes.push(checkDigit);
  codes.push(STOP_CODE);

  // Convert codes to pattern of bar widths
  let pattern = "";
  for (const c of codes) {
    pattern += PATTERNS[c] || "";
  }

  return pattern;
}

/**
 * Generate an SVG barcode element string
 */
export function generateBarcodeSvg(
  text: string,
  options: {
    height?: number;
    moduleWidth?: number;
    includeText?: boolean;
    color?: string;
  } = {}
): string {
  const height = options.height ?? 40;
  const moduleWidth = options.moduleWidth ?? 1.5;
  const includeText = options.includeText ?? true;
  const color = options.color ?? "#000000";

  const pattern = encodeCode128B(text);
  if (!pattern) return "";

  let x = 10; // Left quiet zone
  let rects = "";
  let isBar = true;

  for (let i = 0; i < pattern.length; i++) {
    const width = parseInt(pattern[i], 10) * moduleWidth;
    if (isBar) {
      rects += `<rect x="${x}" y="0" width="${width}" height="${height}" fill="${color}" />`;
    }
    x += width;
    isBar = !isBar;
  }

  const totalWidth = x + 10; // Plus right quiet zone
  const totalHeight = includeText ? height + 16 : height;

  const textElement = includeText
    ? `<text x="${totalWidth / 2}" y="${height + 12}" text-anchor="middle" font-family="monospace" font-size="11" font-weight="600" fill="${color}">${text}</text>`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${totalHeight}" width="${totalWidth}" height="${totalHeight}">
    <rect width="${totalWidth}" height="${totalHeight}" fill="#ffffff" />
    ${rects}
    ${textElement}
  </svg>`;
}
