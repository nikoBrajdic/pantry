import type { Ingredient } from "./types";

const UNICODE_FRACTIONS: Record<string, number> = {
  "½": 0.5,
  "¼": 0.25,
  "¾": 0.75,
  "⅓": 1 / 3,
  "⅔": 2 / 3,
  "⅛": 0.125,
  "⅜": 0.375,
  "⅝": 0.625,
  "⅞": 0.875,
};

const UNIT_ALIASES: Record<string, string> = {
  g: "g",
  gr: "g",
  gram: "g",
  grams: "g",
  grama: "g",
  kg: "kg",
  ml: "ml",
  dl: "dl",
  l: "l",
  litra: "l",
  litre: "l",
  liter: "l",
  liters: "l",
  litres: "l",
  tsp: "tsp",
  teaspoon: "tsp",
  teaspoons: "tsp",
  tbsp: "tbsp",
  tablespoon: "tbsp",
  tablespoons: "tbsp",
  cup: "cup",
  cups: "cup",
  oz: "oz",
  lb: "lb",
  piece: "pc",
  pieces: "pc",
  pcs: "pc",
  pc: "pc",
  // Recognise Croatian spellings from scraped recipes, store as English.
  kom: "pc",
  komad: "pc",
  komada: "pc",
  zlica: "tbsp",
  zlice: "tbsp",
  zlicica: "tsp",
  zlicice: "tsp",
  žlica: "tbsp",
  žlice: "tbsp",
  žličica: "tsp",
  žličice: "tsp",
  salica: "cup",
  salice: "cup",
  šalica: "cup",
  šalice: "cup",
  prstohvat: "pinch",
  pinch: "pinch",
  saka: "handful",
  šaka: "handful",
  handful: "handful",
  ptn: "portion",
  ptns: "portion",
  portion: "portion",
  portions: "portion",
};

const COMMON_UNITS = Object.keys(UNIT_ALIASES).sort((a, b) => b.length - a.length);

function parseNumberToken(token: string): number | null {
  const trimmed = token.trim();
  if (!trimmed) return null;
  if (UNICODE_FRACTIONS[trimmed] != null) return UNICODE_FRACTIONS[trimmed];

  const mixed = trimmed.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (mixed) {
    return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
  }

  const fraction = trimmed.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (fraction) {
    return Number(fraction[1]) / Number(fraction[2]);
  }

  const unicodeMixed = trimmed.match(/^(\d+)\s*([½¼¾⅓⅔⅛⅜⅝⅞])$/);
  if (unicodeMixed) {
    return Number(unicodeMixed[1]) + UNICODE_FRACTIONS[unicodeMixed[2]];
  }

  const normalized = trimmed.replace(",", ".");
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

function normalizeUnit(unit: string | null) {
  if (!unit) return null;
  const key = fold(unit);
  return UNIT_ALIASES[key] ?? unit.toLowerCase();
}

export function fold(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function parseIngredient(raw: string): Ingredient {
  // Normalize spaces, then strip list markers only (not amounts like "1 ½").
  const cleaned = raw
    .replace(/\s+/g, " ")
    .replace(/^[-•]+\s*/, "")
    .replace(/^\d+[.)]\s+/, "")
    .trim();

  const range = cleaned.match(
    /^(\d+(?:[.,]\d+)?(?:\s*\/\s*\d+)?|[½¼¾⅓⅔⅛⅜⅝⅞])\s*[-–—]\s*(\d+(?:[.,]\d+)?(?:\s*\/\s*\d+)?|[½¼¾⅓⅔⅛⅜⅝⅞])\s+(.+)$/,
  );
  if (range) {
    const first = parseNumberToken(range[1]);
    const rest = parseIngredient(`${first ?? range[1]} ${range[3]}`);
    return { ...rest, raw: cleaned, amount: first };
  }

  // Prefer whole + unicode fraction ("1 ½" or "1½") before a bare integer.
  const unicodeMixed = cleaned.match(
    /^(\d+)\s*([½¼¾⅓⅔⅛⅜⅝⅞])\s*(.*)$/,
  );
  if (unicodeMixed) {
    const amount =
      Number(unicodeMixed[1]) + (UNICODE_FRACTIONS[unicodeMixed[2]] ?? 0);
    return finishIngredient(cleaned, amount, unicodeMixed[3]);
  }

  const asciiMixed = cleaned.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)\s*(.*)$/);
  if (asciiMixed) {
    const amount = Number(asciiMixed[1]) + Number(asciiMixed[2]) / Number(asciiMixed[3]);
    return finishIngredient(cleaned, amount, asciiMixed[4]);
  }

  const plainFraction = cleaned.match(
    /^(\d+\s*\/\s*\d+|[½¼¾⅓⅔⅛⅜⅝⅞])\s*(.*)$/,
  );
  if (plainFraction) {
    const amount = parseNumberToken(plainFraction[1]);
    return finishIngredient(cleaned, amount, plainFraction[2]);
  }

  const decimal = cleaned.match(/^(\d+(?:[.,]\d+)?)\s*(.*)$/);
  if (!decimal) {
    return { raw: cleaned, amount: null, unit: null, name: cleaned || raw.trim() };
  }

  const amount = parseNumberToken(decimal[1]);
  return finishIngredient(cleaned, amount, decimal[2]);
}

function finishIngredient(
  cleaned: string,
  amount: number | null,
  remainderRaw: string,
): Ingredient {
  let remainder = remainderRaw.trim();
  let unit: string | null = null;

  for (const candidate of COMMON_UNITS) {
    const pattern = new RegExp(`^${escapeRegExp(candidate)}(?=[\\s.,(/]|$)`, "i");
    if (pattern.test(remainder)) {
      unit = normalizeUnit(candidate);
      remainder = remainder.slice(candidate.length).replace(/^[\s.,of]+/i, "").trim();
      break;
    }
  }

  return {
    raw: cleaned,
    amount,
    unit,
    name: remainder || cleaned,
  };
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function formatAmount(amount: number): string {
  if (!Number.isFinite(amount)) return "";
  const sign = amount < 0 ? "-" : "";
  const abs = Math.abs(amount);
  const whole = Math.floor(abs + 1e-8);
  const fraction = abs - whole;

  const pairs: [number, string][] = [
    [0.125, "⅛"],
    [0.25, "¼"],
    [1 / 3, "⅓"],
    [0.375, "⅜"],
    [0.5, "½"],
    [0.625, "⅝"],
    [2 / 3, "⅔"],
    [0.75, "¾"],
    [0.875, "⅞"],
  ];

  if (fraction < 0.02) {
    return `${sign}${whole || 0}`;
  }

  for (const [value, glyph] of pairs) {
    if (Math.abs(fraction - value) < 0.03) {
      return whole ? `${sign}${whole} ${glyph}` : `${sign}${glyph}`;
    }
  }

  const rounded = Math.round(abs * 10) / 10;
  if (Math.abs(rounded - Math.round(rounded)) < 0.01) {
    return `${sign}${Math.round(rounded)}`;
  }
  return `${sign}${rounded}`;
}

export function formatIngredient(ingredient: Ingredient, factor = 1) {
  // Re-parse from raw when present so older bad parses (e.g. "1 ½" → amount 1)
  // still scale correctly.
  const parsed =
    ingredient.raw && ingredient.raw.trim()
      ? parseIngredient(ingredient.raw)
      : ingredient;

  if (parsed.amount == null) {
    return parsed.raw || parsed.name || ingredient.name;
  }
  const amount = formatAmount(parsed.amount * factor);
  const unitLabel = normalizeUnit(parsed.unit) ?? parsed.unit;
  const unit = unitLabel ? ` ${unitLabel}` : "";
  const name = parsed.name ? ` ${parsed.name}` : "";
  return `${amount}${unit}${name}`.replace(/\s+/g, " ").trim();
}

export function parseIngredientList(lines: string[]) {
  return lines
    .map((line) => line.trim())
    .filter(Boolean)
    .map(parseIngredient);
}

export function scaleServings(original: number, next: number) {
  if (!original || !next) return 1;
  return next / original;
}

export function scaleFromHave(
  ingredient: Ingredient,
  haveAmount: number,
): number | null {
  if (ingredient.amount == null || ingredient.amount === 0) return null;
  if (!Number.isFinite(haveAmount) || haveAmount <= 0) return null;
  return haveAmount / ingredient.amount;
}
