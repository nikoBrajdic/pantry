import { normalizeRecipe } from "./normalize";
import {
  normalizeTagLabel,
  normalizeTagSlug,
  type ShelfTag,
} from "./tag-normalize";
import { RECIPE_TAGS } from "./tags";
import type { Recipe } from "./types";
import { createClient } from "./supabase/server";

export type TagScope = { owner_user_id: string } | { household_code: string };

export type ShelfTagRow = ShelfTag & {
  lastUsed?: string | null;
};

type TagRow = {
  row_id: string;
  id: string;
  label: string;
};

export function normalizeRecipeTags(recipe: Recipe): Recipe {
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const raw of recipe.tags ?? []) {
    const id = normalizeTagSlug(raw);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    tags.push(id);
  }
  return { ...recipe, tags };
}

/** Shelf catalog ordered by most recently assigned. */
export async function listShelfTags(scope: TagScope): Promise<ShelfTagRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("tags")
    .select("id, label, last_used")
    .order("last_used", { ascending: false, nullsFirst: false })
    .order("label", { ascending: true });
  if ("owner_user_id" in scope) {
    query = query.eq("owner_user_id", scope.owner_user_id);
  } else {
    query = query.eq("household_code", scope.household_code);
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    id: row.id as string,
    label:
      normalizeTagLabel((row.label as string) || String(row.id).replace(/-/g, " ")) ||
      String(row.id),
    lastUsed: (row.last_used as string | null) ?? null,
  }));
}

async function ensureTag(
  scope: TagScope,
  slug: string,
  labelHint?: string,
  usedAt?: string,
): Promise<TagRow> {
  const supabase = await createClient();
  let find = supabase.from("tags").select("row_id, id, label").eq("id", slug);
  if ("owner_user_id" in scope) {
    find = find.eq("owner_user_id", scope.owner_user_id);
  } else {
    find = find.eq("household_code", scope.household_code);
  }
  const { data: existing, error: findError } = await find.maybeSingle();
  if (findError) throw new Error(findError.message);
  if (existing) return existing as TagRow;

  const builtin = RECIPE_TAGS.find((tag) => tag.id === slug);
  const label =
    normalizeTagLabel(labelHint || builtin?.label || slug.replace(/-/g, " ")) || slug;
  const now = usedAt || new Date().toISOString();

  const { data, error } = await supabase
    .from("tags")
    .insert({
      id: slug,
      label,
      owner_user_id: "owner_user_id" in scope ? scope.owner_user_id : null,
      household_code: "household_code" in scope ? scope.household_code : null,
      last_used: now,
      updated_at: now,
    })
    .select("row_id, id, label")
    .single();
  if (error) {
    let retry = supabase.from("tags").select("row_id, id, label").eq("id", slug);
    if ("owner_user_id" in scope) {
      retry = retry.eq("owner_user_id", scope.owner_user_id);
    } else {
      retry = retry.eq("household_code", scope.household_code);
    }
    const again = await retry.maybeSingle();
    if (again.data) return again.data as TagRow;
    throw new Error(error.message);
  }
  return data as TagRow;
}

/** Upsert catalog entries, rebuild recipe_tags, bump last_used on assigned tags. */
export async function syncRecipeTags(
  scope: TagScope,
  recipes: { row_id: string; recipe: Recipe }[],
) {
  const supabase = await createClient();
  const recipeRowIds = recipes.map((item) => item.row_id);
  if (recipeRowIds.length === 0) return;

  const { error: clearError } = await supabase
    .from("recipe_tags")
    .delete()
    .in("recipe_row_id", recipeRowIds);
  if (clearError) throw new Error(clearError.message);

  const links: { recipe_row_id: string; tag_row_id: string }[] = [];
  const tagCache = new Map<string, TagRow>();
  const now = new Date().toISOString();

  for (const item of recipes) {
    const normalized = normalizeRecipeTags(normalizeRecipe(item.recipe));
    for (const raw of normalized.tags) {
      const slug = normalizeTagSlug(raw);
      if (!slug) continue;
      let tag = tagCache.get(slug);
      if (!tag) {
        tag = await ensureTag(
          scope,
          slug,
          raw.includes("-") ? raw.replace(/-/g, " ") : raw,
          now,
        );
        tagCache.set(slug, tag);
      }
      links.push({ recipe_row_id: item.row_id, tag_row_id: tag.row_id });
    }
  }

  if (links.length === 0) return;

  const { error: linkError } = await supabase.from("recipe_tags").insert(links);
  if (linkError) throw new Error(linkError.message);

  const usedTagIds = [...new Set(links.map((link) => link.tag_row_id))];
  const { error: touchError } = await supabase
    .from("tags")
    .update({ last_used: now, updated_at: now })
    .in("row_id", usedTagIds);
  if (touchError) throw new Error(touchError.message);
}
