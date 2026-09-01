import type { Ingredient } from "./types";

export type UnitSystem = "original" | "imperial";

function foldUnit(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "");
}

/** Volume/weight units we convert. tsp, tbsp, and cup are intentionally excluded. */
const WEIGHT_TO_G: Record<string, number> = {
  g: 1,
  kg: 1000,
  oz: 28.349523125,
  lb: 453.59237,
};

const VOLUME_TO_ML: Record<string, number> = {
  ml: 1,
  dl: 100,
  l: 1000,
  floz: 29.5735295625,
  pt: 473.176473,
  qt: 946.352946,
};

const SKIP_UNITS = new Set([
  "tsp",
  "tbsp",
  "cup",
  "pc",
  "pinch",
  "handful",
  "portion",
]);

/** Imperial weight/volume units rewritten to metric at scrape time. */
const IMPERIAL_UNITS = new Set(["oz", "lb", "floz", "pt", "qt"]);

/** Metric units that can be shown as imperial in the UI. */
const METRIC_UNITS = new Set(["g", "kg", "ml", "dl", "l"]);

export function normalizeConvertibleUnit(unit: string | null): string | null {
  if (!unit) return null;
  const key = foldUnit(unit);
  const aliases: Record<string, string> = {
    g: "g",
    gr: "g",
    gram: "g",
    grams: "g",
    kg: "kg",
    ml: "ml",
    dl: "dl",
    l: "l",
    liter: "l",
    litre: "l",
    liters: "l",
    litres: "l",
    oz: "oz",
    ounce: "oz",
    ounces: "oz",
    lb: "lb",
    lbs: "lb",
    pound: "lb",
    pounds: "lb",
    floz: "floz",
    flozs: "floz",
    fluidounce: "floz",
    fluidounces: "floz",
    pt: "pt",
    pint: "pt",
    pints: "pt",
    qt: "qt",
    quart: "qt",
    quarts: "qt",
  };
  return aliases[key] ?? null;
}

export function isImperialUnit(unit: string | null): boolean {
  const normalized = normalizeConvertibleUnit(unit);
  return normalized != null && IMPERIAL_UNITS.has(normalized);
}

function roundForUnit(amount: number, unit: string): number {
  if (!Number.isFinite(amount)) return amount;
  if (unit === "g" || unit === "ml") {
    if (amount >= 100) return Math.round(amount);
    if (amount >= 10) return Math.round(amount * 10) / 10;
    return Math.round(amount * 10) / 10;
  }
  if (unit === "kg" || unit === "l") return Math.round(amount * 100) / 100;
  if (unit === "lb" || unit === "pt" || unit === "qt") {
    return Math.round(amount * 100) / 100;
  }
  // oz, floz
  return Math.round(amount * 10) / 10;
}

function toMetricWeight(grams: number): { amount: number; unit: string } {
  if (grams >= 1000) {
    return { amount: roundForUnit(grams / 1000, "kg"), unit: "kg" };
  }
  return { amount: roundForUnit(grams, "g"), unit: "g" };
}

function toImperialWeight(grams: number): { amount: number; unit: string } {
  if (grams >= 453.59237) {
    return { amount: roundForUnit(grams / 453.59237, "lb"), unit: "lb" };
  }
  return { amount: roundForUnit(grams / 28.349523125, "oz"), unit: "oz" };
}

function toMetricVolume(ml: number): { amount: number; unit: string } {
  if (ml >= 1000) {
    return { amount: roundForUnit(ml / 1000, "l"), unit: "l" };
  }
  return { amount: roundForUnit(ml, "ml"), unit: "ml" };
}

function toImperialVolume(ml: number): { amount: number; unit: string } {
  if (ml >= 946.352946) {
    return { amount: roundForUnit(ml / 946.352946, "qt"), unit: "qt" };
  }
  if (ml >= 473.176473) {
    return { amount: roundForUnit(ml / 473.176473, "pt"), unit: "pt" };
  }
  return { amount: roundForUnit(ml / 29.5735295625, "floz"), unit: "floz" };
}

/** Convert imperial → metric (used at scrape). */
export function convertAmountToMetric(
  amount: number,
  unit: string,
): { amount: number; unit: string } | null {
  const normalized = normalizeConvertibleUnit(unit);
  if (!normalized || SKIP_UNITS.has(normalized) || !IMPERIAL_UNITS.has(normalized)) {
    return null;
  }

  if (WEIGHT_TO_G[normalized] != null) {
    return toMetricWeight(amount * WEIGHT_TO_G[normalized]);
  }
  if (VOLUME_TO_ML[normalized] != null) {
    return toMetricVolume(amount * VOLUME_TO_ML[normalized]);
  }
  return null;
}

/** Convert metric → imperial (UI toggle). */
export function convertAmountToImperial(
  amount: number,
  unit: string,
): { amount: number; unit: string } | null {
  const normalized = normalizeConvertibleUnit(unit);
  if (!normalized || SKIP_UNITS.has(normalized) || !METRIC_UNITS.has(normalized)) {
    return null;
  }

  if (WEIGHT_TO_G[normalized] != null) {
    return toImperialWeight(amount * WEIGHT_TO_G[normalized]);
  }
  if (VOLUME_TO_ML[normalized] != null) {
    return toImperialVolume(amount * VOLUME_TO_ML[normalized]);
  }
  return null;
}

/** Display label for converted units (fl oz stays readable). */
export function displayUnit(unit: string | null): string {
  if (!unit) return "";
  if (unit === "floz") return "fl oz";
  return unit;
}

export function convertIngredient(
  ingredient: Ingredient,
  system: UnitSystem,
): Ingredient {
  if (system === "original" || ingredient.amount == null || !ingredient.unit) {
    return ingredient;
  }
  const converted = convertAmountToImperial(ingredient.amount, ingredient.unit);
  if (!converted) return ingredient;
  return {
    ...ingredient,
    amount: converted.amount,
    unit: converted.unit,
  };
}
