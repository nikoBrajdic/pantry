import type { TagId } from "./tags";
import { RECIPE_TAGS } from "./tags";

export type ShelfTag = {
  id: string;
  label: string;
};

/** Stable id: trim, lower, spaces/punct → hyphens. */
export function normalizeTagSlug(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Display label: trim + collapse whitespace, keep user casing. */
export function normalizeTagLabel(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

export function isBuiltinTag(id: string): id is TagId {
  return RECIPE_TAGS.some((tag) => tag.id === id);
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 0; i < a.length; i += 1) {
    let prev = i;
    for (let j = 0; j < b.length; j += 1) {
      const cur = row[j + 1];
      const cost = a[i] === b[j] ? 0 : 1;
      row[j + 1] = Math.min(row[j + 1] + 1, row[j] + 1, prev + cost);
      prev = cur;
    }
  }
  return row[b.length];
}

function pluralVariants(slug: string): string[] {
  const out = new Set<string>([slug]);
  if (slug.endsWith("ies") && slug.length > 4) {
    out.add(`${slug.slice(0, -3)}y`);
  } else if (slug.endsWith("es") && slug.length > 3) {
    out.add(slug.slice(0, -2));
    out.add(slug.slice(0, -1));
  } else if (slug.endsWith("s") && slug.length > 2) {
    out.add(slug.slice(0, -1));
  } else {
    out.add(`${slug}s`);
    out.add(`${slug}es`);
    if (slug.endsWith("y") && slug.length > 2) {
      out.add(`${slug.slice(0, -1)}ies`);
    }
  }
  return [...out];
}

/** Rank catalog tags for a query; closer / plural-related first. */
export function suggestTags(
  query: string,
  catalog: ShelfTag[],
  opts?: { limit?: number; exclude?: string[] },
): ShelfTag[] {
  const limit = opts?.limit ?? 8;
  const exclude = new Set(opts?.exclude ?? []);
  const q = normalizeTagSlug(query);
  const variants = q ? new Set(pluralVariants(q)) : new Set<string>();

  const scored = catalog
    .filter((tag) => !exclude.has(tag.id))
    .map((tag) => {
      const id = tag.id;
      let score = 1000;
      if (!q) {
        score = 50;
      } else if (id === q) {
        score = 0;
      } else if (variants.has(id)) {
        score = 1;
      } else if (id.startsWith(q)) {
        score = 2;
      } else if (id.includes(q)) {
        score = 3;
      } else {
        const distance = levenshtein(q, id);
        if (distance <= 2 && Math.max(q.length, id.length) >= 3) {
          score = 4 + distance;
        } else {
          return null;
        }
      }
      return { tag, score };
    })
    .filter((item): item is { tag: ShelfTag; score: number } => item != null)
    .sort((a, b) => a.score - b.score || a.tag.label.localeCompare(b.tag.label));

  const seen = new Set<string>();
  const out: ShelfTag[] = [];
  for (const item of scored) {
    if (seen.has(item.tag.id)) continue;
    seen.add(item.tag.id);
    out.push(item.tag);
    if (out.length >= limit) break;
  }
  return out;
}

export function exactTagMatch(query: string, catalog: ShelfTag[]): ShelfTag | null {
  const slug = normalizeTagSlug(query);
  if (!slug) return null;
  return catalog.find((tag) => tag.id === slug) ?? null;
}
