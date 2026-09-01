import type { Difficulty, Ingredient, Nutrition, Pace, Recipe, RecipeList } from "./types";
import { normalizeRecipe } from "./normalize";
import { newId } from "./storage";

const DIFFICULTY: Difficulty[] = ["easy", "moderate", "complicated"];
const PACE: Pace[] = ["quick", "time-consuming"];
const LIST: RecipeList[] = ["keeper", "wishlist"];

/** Compact share tuple — short keys, no cook stats / timestamps / local image blobs. */
type CompactShare = [
  string, // title
  number, // servings
  Array<[string, number | null, string | null, string, string?]>, // ingredients (+ optional section)
  string[], // instructions
  string[], // tags
  number, // difficulty idx
  number, // pace idx
  0 | 1, // nextDay
  string, // nextDayNote
  string, // notes
  string, // sourceUrl
  string, // imageUrl (http only)
  number, // list idx
  Nutrition | null,
];

function shareableImageUrl(url?: string) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return "";
}

function toCompact(recipe: Recipe): CompactShare {
  return [
    recipe.title,
    recipe.servings,
    recipe.ingredients.map((item) => [
      item.raw,
      item.amount,
      item.unit,
      item.name,
      item.section ?? "",
    ]),
    recipe.instructions,
    recipe.tags,
    Math.max(0, DIFFICULTY.indexOf(recipe.difficulty)),
    Math.max(0, PACE.indexOf(recipe.pace)),
    recipe.nextDay ? 1 : 0,
    recipe.nextDayNote ?? "",
    recipe.notes ?? "",
    recipe.sourceUrl ?? "",
    shareableImageUrl(recipe.imageUrl),
    Math.max(0, LIST.indexOf(recipe.list)),
    recipe.nutrition ?? null,
  ];
}

function fromCompact(data: CompactShare): Recipe {
  const now = new Date().toISOString();
  const ingredients: Ingredient[] = (data[2] ?? []).map((row) => {
    const [raw, amount, unit, name, section] = row;
    return {
      raw,
      amount,
      unit,
      name,
      ...(section ? { section } : {}),
    };
  });
  return normalizeRecipe({
    id: newId(),
    title: data[0] || "Recipe",
    servings: Number(data[1]) || 2,
    ingredients,
    instructions: data[3] ?? [],
    tags: data[4] ?? [],
    difficulty: DIFFICULTY[data[5]] ?? "easy",
    pace: PACE[data[6]] ?? "quick",
    nextDay: Boolean(data[7]),
    nextDayNote: data[8] || undefined,
    notes: data[9] || undefined,
    sourceUrl: data[10] || undefined,
    imageUrl: data[11] || undefined,
    list: LIST[data[12]] ?? "wishlist",
    nutrition: data[13] ?? undefined,
    timesCooked: 0,
    createdAt: now,
    updatedAt: now,
  });
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const binary = atob(padded + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function deflate(text: string) {
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream("deflate-raw"));
  const buffer = await new Response(stream).arrayBuffer();
  return new Uint8Array(buffer);
}

async function inflate(bytes: Uint8Array) {
  const stream = new Blob([bytes as BlobPart])
    .stream()
    .pipeThrough(new DecompressionStream("deflate-raw"));
  return new Response(stream).text();
}

/** Compress recipe into a compact URL-safe payload (no local photo data). */
export async function encodeRecipeShare(recipe: Recipe) {
  const json = JSON.stringify(toCompact(recipe));
  const compressed = await deflate(json);
  return bytesToBase64Url(compressed);
}

export async function decodeRecipeShare(value: string): Promise<Recipe | null> {
  try {
    // New compact+deflate payload
    try {
      const json = await inflate(base64UrlToBytes(value));
      const data = JSON.parse(json) as CompactShare;
      if (Array.isArray(data) && typeof data[0] === "string") {
        return fromCompact(data);
      }
    } catch {
      // fall through to legacy
    }

    // Legacy: full JSON base64url
    const padded = value.replace(/-/g, "+").replace(/_/g, "/");
    const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
    const json = decodeURIComponent(escape(atob(padded + pad)));
    const recipe = JSON.parse(json) as Recipe;
    if (!recipe || typeof recipe.title !== "string") return null;
    return normalizeRecipe({
      ...recipe,
      id: newId(),
      timesCooked: 0,
      lastCookedAt: undefined,
      imageUrl: shareableImageUrl(recipe.imageUrl) || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch {
    return null;
  }
}

/** Prefer short server code; fall back to compressed payload in the URL. */
export async function shareUrlFor(recipe: Recipe, origin: string) {
  try {
    const response = await fetch("/api/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipe }),
    });
    if (response.ok) {
      const data = (await response.json()) as { id?: string };
      if (data.id) return `${origin}/import?c=${data.id}`;
    }
  } catch {
    // fall through
  }

  const packed = await encodeRecipeShare(recipe);
  return `${origin}/import?r=${packed}`;
}
