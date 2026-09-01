import {
  isIngredientSectionHeader,
  metricizeIngredient,
  normalizeIngredientSection,
  parseIngredient,
} from "./ingredients";
import type { ExtractedRecipe, Ingredient, Nutrition, Pace } from "./types";

const ISO_DURATION = /P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?/i;

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  quot: '"',
  apos: "'",
  lt: "<",
  gt: ">",
  nbsp: " ",
  ndash: "-",
  mdash: "-",
  hellip: "...",
  lsquo: "'",
  rsquo: "'",
  ldquo: '"',
  rdquo: '"',
  bull: "*",
  middot: "*",
  times: "x",
  divide: "/",
  deg: "deg",
  frac12: "1/2",
  frac14: "1/4",
  frac34: "3/4",
  trade: "(TM)",
  copy: "(c)",
  reg: "(R)",
  euro: "EUR",
  pound: "GBP",
  yen: "JPY",
};

export function decodeEntities(input: string): string {
  return input
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => {
      const code = Number.parseInt(hex, 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : "";
    })
    .replace(/&#(\d+);/g, (_, dec: string) => {
      const code = Number(dec);
      return Number.isFinite(code) ? String.fromCodePoint(code) : "";
    })
    .replace(/&([a-zA-Z][a-zA-Z0-9]+);/g, (match, name: string) => {
      return NAMED_ENTITIES[name.toLowerCase()] ?? match;
    });
}

function asArray<T>(value: T | T[] | undefined | null): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function textOf(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return decodeEntities(value).trim();
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(textOf).filter(Boolean).join(" ");
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    return textOf(record.name ?? record.text ?? record["@value"]);
  }
  return "";
}

function firstImage(value: unknown, baseUrl: string): string | undefined {
  const items = asArray(value);
  for (const item of items) {
    if (typeof item === "string" && item.trim()) {
      return resolveUrl(item.trim(), baseUrl);
    }
    if (item && typeof item === "object") {
      const url = textOf((item as { url?: unknown }).url);
      if (url) return resolveUrl(url, baseUrl);
    }
  }
  return undefined;
}

function resolveUrl(value: string, baseUrl: string) {
  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return value;
  }
}

function parseServings(value: unknown): number {
  const texts = asArray(value).map(textOf).filter(Boolean);
  for (const text of texts) {
    const range = text.match(/(\d+(?:[.,]\d+)?)\s*[-–—]\s*(\d+(?:[.,]\d+)?)/);
    if (range) return Math.max(1, Math.round(Number(range[1].replace(",", "."))));
    const single = text.match(/(\d+(?:[.,]\d+)?)/);
    if (single) return Math.max(1, Math.round(Number(single[1].replace(",", "."))));
  }
  return 4;
}

function parseDurationMinutes(value: unknown): number | null {
  const text = textOf(value);
  if (!text) return null;
  const iso = text.match(ISO_DURATION);
  if (iso && text.startsWith("P")) {
    const days = Number(iso[1] ?? 0);
    const hours = Number(iso[2] ?? 0);
    const minutes = Number(iso[3] ?? 0);
    return days * 24 * 60 + hours * 60 + minutes;
  }
  const hours = text.match(/(\d+)\s*(h|hour|hours|sat|sata|sati)/i);
  const mins = text.match(/(\d+)\s*(m|min|minute|minuta|minuta)/i);
  if (hours || mins) {
    return Number(hours?.[1] ?? 0) * 60 + Number(mins?.[1] ?? 0);
  }
  return null;
}

function parseNutritionNumber(value: unknown): number | undefined {
  const text = textOf(value);
  if (!text) return undefined;
  const match = text.replace(",", ".").match(/(\d+(?:\.\d+)?)/);
  if (!match) return undefined;
  const n = Number(match[1]);
  return Number.isFinite(n) ? n : undefined;
}

function parseNutrition(value: unknown): Nutrition | undefined {
  if (!value || typeof value !== "object") return undefined;
  const node = value as Record<string, unknown>;
  const nutrition: Nutrition = {
    calories: parseNutritionNumber(node.calories ?? node.calorie),
    proteinG: parseNutritionNumber(node.proteinContent),
    fatG: parseNutritionNumber(node.fatContent),
    carbsG: parseNutritionNumber(node.carbohydrateContent),
    fiberG: parseNutritionNumber(node.fiberContent),
    sugarG: parseNutritionNumber(node.sugarContent),
    sodiumMg: parseNutritionNumber(node.sodiumContent),
  };
  const hasAny = Object.values(nutrition).some((item) => item != null);
  return hasAny ? nutrition : undefined;
}

function flattenInstructions(value: unknown): string[] {
  if (value == null) return [];
  if (typeof value === "string") {
    return decodeEntities(value)
      .split(/\r?\n|(?<=\.)\s+(?=[A-ZČĆŽŠĐ])/)
      .map((step) => step.trim())
      .filter((step) => step.length > 1);
  }
  if (Array.isArray(value)) {
    return value.flatMap(flattenInstructions).filter(Boolean);
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (record.itemListElement) return flattenInstructions(record.itemListElement);
    const text = textOf(record.text ?? record.name);
    return text ? [text] : [];
  }
  return [];
}

function collectJsonLd(html: string): unknown[] {
  const blocks: unknown[] = [];
  const regex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html))) {
    const raw = match[1]
      .replace(/<!--([\s\S]*?)-->/g, "")
      .trim();
    if (!raw) continue;
    try {
      blocks.push(JSON.parse(raw));
    } catch {
      try {
        blocks.push(JSON.parse(raw.replace(/,\s*([}\]])/g, "$1")));
      } catch {
        // ignore broken json-ld
      }
    }
  }
  return blocks;
}

function walkNodes(value: unknown, acc: Record<string, unknown>[]) {
  if (!value) return;
  if (Array.isArray(value)) {
    value.forEach((item) => walkNodes(item, acc));
    return;
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    acc.push(record);
    if (record["@graph"]) walkNodes(record["@graph"], acc);
  }
}

function isRecipeType(value: unknown) {
  const types = asArray(value).map((item) => String(item).toLowerCase());
  return types.some((type) => type.includes("recipe"));
}

function recipeFromNode(node: Record<string, unknown>, sourceUrl: string): ExtractedRecipe | null {
  if (!isRecipeType(node["@type"]) && !node.recipeIngredient && !node.recipeInstructions) {
    return null;
  }

  const title = textOf(node.name);
  const ingredients = parseIngredientBlocks(
    asArray(node.recipeIngredient).map(textOf).filter(Boolean),
  );
  const instructions = flattenInstructions(node.recipeInstructions);

  if (!title && ingredients.length === 0) return null;

  const total =
    parseDurationMinutes(node.totalTime) ??
    (parseDurationMinutes(node.prepTime) ?? 0) + (parseDurationMinutes(node.cookTime) ?? 0);
  const suggestedPace: Pace | undefined =
    total > 0 ? (total <= 35 ? "quick" : "time-consuming") : undefined;

  return {
    title: title || "Untitled recipe",
    sourceUrl,
    imageUrl: firstImage(node.image, sourceUrl),
    servings: parseServings(node.recipeYield ?? node.yield),
    ingredients,
    instructions,
    suggestedPace,
    nutrition: parseNutrition(node.nutrition),
  };
}

function fallbackFromHtml(html: string, sourceUrl: string): ExtractedRecipe | null {
  const title =
    html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1] ||
    html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] ||
    "";
  const image =
    html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1];

  const ingredientBlocks = extractIngredientLinesFromHtml(html);

  const instructionBlocks = [
    ...html.matchAll(/itemprop=["']recipeInstructions["'][^>]*>([\s\S]*?)<\/(?:p|li|div|span)>/gi),
  ]
    .map((match) => decodeEntities(match[1].replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim())
    .filter(Boolean);

  if (ingredientBlocks.length === 0) return null;

  return {
    title: decodeEntities(title).trim() || "Untitled recipe",
    sourceUrl,
    imageUrl: image ? resolveUrl(image, sourceUrl) : undefined,
    servings: 4,
    ingredients: parseIngredientBlocks(ingredientBlocks),
    instructions: instructionBlocks,
  };
}

/** Prefer grouped HTML (heading + items); fall back to flat recipeIngredient nodes. */
function extractIngredientLinesFromHtml(html: string): string[] {
  const grouped = extractGroupedIngredientLines(html);
  if (grouped.length > 0) return grouped;

  return [
    ...html.matchAll(/itemprop=["']recipeIngredient["'][^>]*>([^<]+)</gi),
  ]
    .map((match) => decodeEntities(match[1]).trim())
    .filter(Boolean);
}

/** Collapse tag-replacement spaces so "salt , pepper" → "salt, pepper". */
function tidyPlainText(value: string) {
  return value
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?)\]}])/g, "$1")
    .replace(/([([{])\s+/g, "$1")
    .trim();
}

function stripTags(value: string) {
  return tidyPlainText(
    decodeEntities(value.replace(/<[^>]+>/g, " ")).replace(
      /[\u2610\u2611\u2612\u25A0-\u25A3\u25FB\u25FC\u2B1B\u2B1C□■☐☑☒]/g,
      " ",
    ),
  );
}

function extractGroupedIngredientLines(html: string): string[] {
  const lines: string[] = [];

  const groupBlocks = [
    ...html.matchAll(
      /<(?:div|section)[^>]*class=["'][^"']*ingredient(?:s)?-group[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|section)>/gi,
    ),
  ];

  for (const match of groupBlocks) {
    const block = match[1] ?? "";
    const nameHtml =
      block.match(
        /<(?:h[1-6]|p|div|span|strong)[^>]*class=["'][^"']*(?:group-name|group__name|ingredient-group-name|ingredients-group-name)[^"']*["'][^>]*>([\s\S]*?)<\/(?:h[1-6]|p|div|span|strong)>/i,
      )?.[1] ??
      block.match(/<(?:h[1-6])[^>]*>([\s\S]*?)<\/(?:h[1-6])>/i)?.[1];

    const heading = nameHtml ? stripTags(nameHtml) : "";
    if (heading) {
      lines.push(/[:：]\s*$/.test(heading) ? heading : `${heading}:`);
    }

    const itempropItems = [
      ...block.matchAll(/itemprop=["']recipeIngredient["'][^>]*>([^<]+)</gi),
    ]
      .map((item) => decodeEntities(item[1]).trim())
      .filter(Boolean);

    if (itempropItems.length > 0) {
      lines.push(...itempropItems);
      continue;
    }

    const listItems = [...block.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)]
      .map((item) => stripTags(item[1] ?? ""))
      .filter((text) => text && !isIngredientSectionHeader(text));

    lines.push(...listItems);
  }

  // Need at least one real ingredient, not only headings
  const hasIngredient = lines.some((line) => !isIngredientSectionHeader(line));
  return hasIngredient ? lines : [];
}

function parseIngredientBlocks(blocks: string[]): Ingredient[] {
  let currentSection: string | undefined;
  const ingredients: Ingredient[] = [];

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;
    if (isIngredientSectionHeader(trimmed)) {
      currentSection = normalizeIngredientSection(trimmed);
      continue;
    }
    const parsed = metricizeIngredient(parseIngredient(trimmed));
    // Header-like lines without amounts sometimes slip through as bare names
    // (e.g. "For the sauce"). Do not append ":" — that makes every bare
    // ingredient like "basmati rice" look like a section title.
    if (
      parsed.amount == null &&
      !parsed.unit &&
      isIngredientSectionHeader(parsed.name)
    ) {
      currentSection = normalizeIngredientSection(parsed.name);
      continue;
    }
    ingredients.push(
      currentSection ? { ...parsed, section: currentSection } : parsed,
    );
  }

  return ingredients;
}

export function extractRecipeFromHtml(html: string, sourceUrl: string): ExtractedRecipe {
  const groupedLines = extractGroupedIngredientLines(html);
  const nodes: Record<string, unknown>[] = [];
  for (const block of collectJsonLd(html)) {
    walkNodes(block, nodes);
  }

  for (const node of nodes) {
    const recipe = recipeFromNode(node, sourceUrl);
    if (recipe && recipe.ingredients.length > 0) {
      // JSON-LD usually omits "For the sauce" headings; HTML groups keep them.
      if (groupedLines.length > 0) {
        return {
          ...recipe,
          ingredients: parseIngredientBlocks(groupedLines),
        };
      }
      return recipe;
    }
  }

  const fallback = fallbackFromHtml(html, sourceUrl);
  if (fallback) return fallback;

  throw new Error(
    "That page did not include a structured recipe. Try another link or add it by hand.",
  );
}

export function assertPublicHttpUrl(value: string) {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error("That does not look like a valid link.");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("The link must start with http or https.");
  }
  const host = parsed.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host.endsWith(".local") ||
    host === "0.0.0.0" ||
    host.startsWith("127.") ||
    host.startsWith("10.") ||
    host.startsWith("192.168.") ||
    host.startsWith("169.254.")
  ) {
    throw new Error("That link is not a public web page.");
  }
  return parsed.toString();
}
