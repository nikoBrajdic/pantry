import type { Ingredient } from "./types";
import {
  convertIngredient,
  convertAmountToMetric,
  displayUnit,
  type UnitSystem,
} from "./units";

export type { UnitSystem } from "./units";
export { convertIngredient, displayUnit } from "./units";

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
  ounce: "oz",
  ounces: "oz",
  lb: "lb",
  lbs: "lb",
  pound: "lb",
  pounds: "lb",
  floz: "floz",
  "fl oz": "floz",
  "fl. oz": "floz",
  "fl. oz.": "floz",
  "fluid ounce": "floz",
  "fluid ounces": "floz",
  pt: "pt",
  pint: "pt",
  pints: "pt",
  qt: "qt",
  quart: "qt",
  quarts: "qt",
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

function amountToDecimalString(amount: number): string {
  if (!Number.isFinite(amount)) return "";
  const sign = amount < 0 ? "-" : "";
  const abs = Math.abs(amount);

  if (Math.abs(abs - Math.round(abs)) < 0.02) {
    return `${sign}${Math.round(abs)}`;
  }

  const oneDecimal = Math.round(abs * 10) / 10;
  if (Math.abs(abs - oneDecimal) < 0.02) {
    return `${sign}${oneDecimal}`;
  }

  return `${sign}${Math.round(abs * 100) / 100}`;
}

/** Replace ½/⅝/… so fonts that lack those glyphs don't show □. */
export function decimalizeUnicodeFractions(text: string): string {
  return text.replace(/(\d*)\s*([½¼¾⅓⅔⅛⅜⅝⅞])/g, (_, whole: string, frac: string) => {
    const part = UNICODE_FRACTIONS[frac];
    if (part == null) return `${whole}${frac}`;
    return amountToDecimalString((whole ? Number(whole) : 0) + part);
  });
}

export function parseIngredient(raw: string): Ingredient {
  // Normalize spaces, strip list markers / checkbox glyphs from scraped HTML.
  const cleaned = decimalizeUnicodeFractions(
    raw
      .replace(/\s+/g, " ")
      .replace(/^[\s\-•*·▪▫■□▢▣◻◼⬜⬛☐☑☒✅✓✔◦‣⁃]+/u, "")
      .replace(/^\d+[.)]\s+/, "")
      .replace(/\s+([,.;:!?)\]}])/g, "$1")
      .replace(/([([{])\s+/g, "$1")
      .trim(),
  );

  const range = cleaned.match(
    /^(\d+(?:[.,]\d+)?(?:\s*\/\s*\d+)?)\s*[-–—]\s*(\d+(?:[.,]\d+)?(?:\s*\/\s*\d+)?)\s+(.+)$/,
  );
  if (range) {
    const first = parseNumberToken(range[1]);
    const rest = parseIngredient(`${first ?? range[1]} ${range[3]}`);
    return {
      ...rest,
      raw: decimalizeUnicodeFractions(cleaned),
      amount: first,
    };
  }

  const asciiMixed = cleaned.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)\s*(.*)$/);
  if (asciiMixed) {
    const amount = Number(asciiMixed[1]) + Number(asciiMixed[2]) / Number(asciiMixed[3]);
    return finishIngredient(cleaned, amount, asciiMixed[4]);
  }

  const plainFraction = cleaned.match(/^(\d+\s*\/\s*\d+)\s*(.*)$/);
  if (plainFraction) {
    const amount = parseNumberToken(plainFraction[1]);
    return finishIngredient(cleaned, amount, plainFraction[2]);
  }

  const decimal = cleaned.match(/^(\d+(?:[.,]\d+)?)\s*(.*)$/);
  if (!decimal) {
    return {
      raw: cleaned,
      amount: null,
      unit: null,
      name: cleaned || raw.trim(),
    };
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
      remainder = remainder
        .slice(candidate.length)
        .replace(/^[\s.,]+/i, "")
        .replace(/^of\s+/i, "")
        .trim();
      break;
    }
  }

  const name = remainder || cleaned;
  const raw =
    amount == null
      ? cleaned
      : `${amountToDecimalString(amount)}${unit ? ` ${unit}` : ""}${
          remainder ? ` ${remainder}` : ""
        }`.replace(/\s+/g, " ").trim();

  return {
    raw,
    amount,
    unit,
    name,
  };
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function formatAmount(amount: number): string {
  return amountToDecimalString(amount);
}

/** Rewrite oz/lb/fl oz/pt/qt into metric at scrape time. Leaves tsp/tbsp/cup alone. */
export function metricizeIngredient(ingredient: Ingredient): Ingredient {
  if (ingredient.amount == null || !ingredient.unit) return ingredient;
  const converted = convertAmountToMetric(ingredient.amount, ingredient.unit);
  if (!converted) return ingredient;
  const amount = formatAmount(converted.amount);
  const unitLabel = displayUnit(converted.unit);
  const name = ingredient.name?.trim() ?? "";
  return {
    ...ingredient,
    amount: converted.amount,
    unit: converted.unit,
    raw: `${amount}${unitLabel ? ` ${unitLabel}` : ""}${name ? ` ${name}` : ""}`
      .replace(/\s+/g, " ")
      .trim(),
  };
}

export function formatIngredient(
  ingredient: Ingredient,
  factor = 1,
  system: UnitSystem = "original",
) {
  // Re-parse from raw when present so older bad parses (e.g. "1 ½" → amount 1)
  // still scale correctly.
  const parsed =
    ingredient.raw && ingredient.raw.trim()
      ? parseIngredient(ingredient.raw)
      : ingredient;

  if (parsed.amount == null) {
    return parsed.raw || parsed.name || ingredient.name;
  }

  const scaled: Ingredient = {
    ...parsed,
    amount: parsed.amount * factor,
  };
  const converted = convertIngredient(scaled, system);
  const amount = formatAmount(converted.amount ?? scaled.amount!);
  const unitRaw = normalizeUnit(converted.unit) ?? converted.unit;
  const unitLabel = displayUnit(unitRaw);
  const unit = unitLabel ? ` ${unitLabel}` : "";
  const name = converted.name ? ` ${converted.name}` : "";
  return `${amount}${unit}${name}`.replace(/\s+/g, " ").trim();
}

export function parseIngredientList(lines: string[]) {
  let currentSection: string | undefined;
  const ingredients: Ingredient[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (isIngredientSectionHeader(trimmed)) {
      currentSection = normalizeIngredientSection(trimmed);
      continue;
    }

    const parsed = parseIngredient(trimmed);
    ingredients.push(
      currentSection ? { ...parsed, section: currentSection } : parsed,
    );
  }

  return ingredients;
}

/** True for lines like "For the sauce:", "Glaze:", "FOR THE CHICKEN", "## Sponge". */
export function isIngredientSectionHeader(line: string): boolean {
  const cleaned = line.replace(/^#+\s*/, "").trim();
  if (!cleaned || cleaned.length > 80) return false;
  // Looks like an amount → ingredient, not a heading
  if (/^(\d|[½¼¾⅓⅔⅛⅜⅝⅞])/.test(cleaned)) return false;
  // Quantities / package sizes belong to ingredients
  if (/\d/.test(cleaned)) return false;
  if (/^(for|za)\b/i.test(cleaned)) return true;
  if (/[:：]\s*$/.test(cleaned)) return true;
  // ALL CAPS section titles from many recipe sites
  const letters = cleaned.replace(/[^a-zA-Z\s'-]/g, "").trim();
  if (
    letters.length >= 3 &&
    /[A-Z]/.test(letters) &&
    letters === letters.toUpperCase() &&
    letters.split(/\s+/).length <= 8
  ) {
    return true;
  }
  return false;
}

export function normalizeIngredientSection(line: string): string {
  return line
    .replace(/^#+\s*/, "")
    .replace(/[:：]\s*$/, "")
    .trim();
}

/** Round-trip ingredients (with sections) to editable textarea text. */
export function formatIngredientsText(ingredients: Ingredient[]): string {
  const lines: string[] = [];
  let lastSection: string | undefined;

  for (const item of ingredients) {
    const section = item.section?.trim() || undefined;
    if (section !== lastSection) {
      if (lines.length > 0) lines.push("");
      if (section) lines.push(`${section}:`);
      lastSection = section;
    }
    // Prefer decimal amounts over scraped fraction glyphs (½, ⅝, …).
    lines.push(formatIngredient(item, 1, "original"));
  }

  return lines.join("\n");
}

export type IngredientGroup = {
  section?: string;
  items: { ingredient: Ingredient; index: number }[];
};

export function groupIngredients(ingredients: Ingredient[]): IngredientGroup[] {
  const groups: IngredientGroup[] = [];
  for (let index = 0; index < ingredients.length; index += 1) {
    const ingredient = ingredients[index]!;
    const section = ingredient.section?.trim() || undefined;
    const last = groups[groups.length - 1];
    if (last && last.section === section) {
      last.items.push({ ingredient, index });
    } else {
      groups.push({ section, items: [{ ingredient, index }] });
    }
  }
  return groups;
}

export function scaleServings(original: number, next: number) {
  if (!original || !next) return 1;
  return next / original;
}

export function scaleFromHave(
  ingredient: Ingredient,
  haveAmount: number,
  system: UnitSystem = "original",
): number | null {
  const parsed =
    ingredient.raw && ingredient.raw.trim()
      ? parseIngredient(ingredient.raw)
      : ingredient;
  if (parsed.amount == null || parsed.amount === 0) return null;
  if (!Number.isFinite(haveAmount) || haveAmount <= 0) return null;

  const displayed = convertIngredient(parsed, system);
  const baseAmount = displayed.amount;
  if (baseAmount == null || baseAmount === 0) return null;
  return haveAmount / baseAmount;
}
