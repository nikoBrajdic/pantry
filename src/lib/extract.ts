import { parseIngredient } from "./ingredients";
import type { ExtractedRecipe, Pace } from "./types";

const ISO_DURATION = /P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?/i;

function asArray<T>(value: T | T[] | undefined | null): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function textOf(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
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

function flattenInstructions(value: unknown): string[] {
  if (value == null) return [];
  if (typeof value === "string") {
    return value
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
  const ingredients = asArray(node.recipeIngredient)
    .map(textOf)
    .filter(Boolean)
    .map(parseIngredient);
  const instructions = flattenInstructions(node.recipeInstructions);

  if (!title && ingredients.length === 0) return null;

  const total =
    parseDurationMinutes(node.totalTime) ??
    (parseDurationMinutes(node.prepTime) ?? 0) + (parseDurationMinutes(node.cookTime) ?? 0);
  const suggestedPace: Pace | undefined =
    total > 0 ? (total <= 35 ? "quick" : "time-consuming") : undefined;

  return {
    title: title || "Recept bez naslova",
    sourceUrl,
    imageUrl: firstImage(node.image, sourceUrl),
    servings: parseServings(node.recipeYield ?? node.yield),
    ingredients,
    instructions,
    suggestedPace,
  };
}

function decodeEntities(html: string) {
  return html
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function fallbackFromHtml(html: string, sourceUrl: string): ExtractedRecipe | null {
  const title =
    html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1] ||
    html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] ||
    "";
  const image =
    html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1];

  const ingredientBlocks = [
    ...html.matchAll(
      /itemprop=["']recipeIngredient["'][^>]*>([^<]+)</gi,
    ),
  ].map((match) => decodeEntities(match[1]).trim());

  const instructionBlocks = [
    ...html.matchAll(/itemprop=["']recipeInstructions["'][^>]*>([\s\S]*?)<\/(?:p|li|div|span)>/gi),
  ]
    .map((match) => decodeEntities(match[1].replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim())
    .filter(Boolean);

  if (ingredientBlocks.length === 0) return null;

  return {
    title: decodeEntities(title).trim() || "Recept bez naslova",
    sourceUrl,
    imageUrl: image ? resolveUrl(image, sourceUrl) : undefined,
    servings: 4,
    ingredients: ingredientBlocks.map(parseIngredient),
    instructions: instructionBlocks,
  };
}

export function extractRecipeFromHtml(html: string, sourceUrl: string): ExtractedRecipe {
  const nodes: Record<string, unknown>[] = [];
  for (const block of collectJsonLd(html)) {
    walkNodes(block, nodes);
  }

  for (const node of nodes) {
    const recipe = recipeFromNode(node, sourceUrl);
    if (recipe && recipe.ingredients.length > 0) return recipe;
  }

  const fallback = fallbackFromHtml(html, sourceUrl);
  if (fallback) return fallback;

  throw new Error(
    "Na toj stranici nisam našla strukturirani recept. Pokušaj drugi link ili unesi recept ručno.",
  );
}

export function assertPublicHttpUrl(value: string) {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error("To ne izgleda kao valjan link.");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Link mora početi s http ili https.");
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
    throw new Error("Taj link nije javna web stranica.");
  }
  return parsed.toString();
}
