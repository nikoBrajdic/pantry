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
  grama: "g",
  kg: "kg",
  ml: "ml",
  dl: "dl",
  l: "l",
  litra: "l",
  litre: "l",
  tsp: "žličica",
  teaspoon: "žličica",
  teaspoons: "žličica",
  tbsp: "žlica",
  tablespoon: "žlica",
  tablespoons: "žlica",
  cup: "šalica",
  cups: "šalica",
  oz: "oz",
  lb: "lb",
  piece: "kom",
  pieces: "kom",
  pcs: "kom",
  kom: "kom",
  komad: "kom",
  komada: "kom",
  zlica: "žlica",
  zlice: "žlica",
  zlicica: "žličica",
  zlicice: "žličica",
  žlica: "žlica",
  žlice: "žlica",
  žličica: "žličica",
  žličice: "žličica",
  salica: "šalica",
  salice: "šalica",
  šalica: "šalica",
  šalice: "šalica",
  prstohvat: "prstohvat",
  saka: "šaka",
  šaka: "šaka",
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
  const cleaned = raw.replace(/\s+/g, " ").replace(/^[-•\d.)\s]+/, (match) => {
    return /^\d/.test(match.trim()) ? match.trim() : "";
  }).trim();

  const range = cleaned.match(
    /^(\d+(?:[.,]\d+)?(?:\s*\/\s*\d+)?|[½¼¾⅓⅔⅛⅜⅝⅞])\s*[-–—]\s*(\d+(?:[.,]\d+)?(?:\s*\/\s*\d+)?|[½¼¾⅓⅔⅛⅜⅝⅞])\s+(.+)$/
  );
  if (range) {
    const first = parseNumberToken(range[1]);
    const rest = parseIngredient(`${first ?? range[1]} ${range[3]}`);
    return { ...rest, raw: cleaned, amount: first };
  }

  const match = cleaned.match(
    /^((?:\d+\s+)?(?:\d+\s*\/\s*\d+|[½¼¾⅓⅔⅛⅜⅝⅞]|\d+(?:[.,]\d+)?))\s*(.*)$/
  );

  if (!match) {
    return { raw: cleaned, amount: null, unit: null, name: cleaned || raw.trim() };
  }

  const amount = parseNumberToken(match[1]);
  let remainder = match[2].trim();
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
  return `${sign}${rounded.toString().replace(".", ",")}`;
}

export function formatIngredient(ingredient: Ingredient, factor = 1) {
  if (ingredient.amount == null) {
    return ingredient.raw || ingredient.name;
  }
  const amount = formatAmount(ingredient.amount * factor);
  const unit = ingredient.unit ? ` ${ingredient.unit}` : "";
  const name = ingredient.name ? ` ${ingredient.name}` : "";
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
