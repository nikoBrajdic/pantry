import { normalizeRecipe } from "./normalize";
import { normalizeRecipeTags, syncRecipeTags, type TagScope } from "./tag-store";
import type { Recipe } from "./types";
import { createClient } from "./supabase/server";

type RecipeRow = {
  row_id: string;
  id: string;
  data: Recipe;
  created_at: string;
  updated_at: string;
};

function rowToRecipe(row: Omit<RecipeRow, "row_id"> & { row_id?: string }): Recipe {
  const raw = row.data && typeof row.data === "object" ? row.data : ({} as Recipe);
  return normalizeRecipeTags(
    normalizeRecipe({
      ...raw,
      id: row.id || raw.id,
      createdAt: raw.createdAt || row.created_at,
      updatedAt: raw.updatedAt || row.updated_at,
    }),
  );
}

function sortRecipes(recipes: Recipe[]) {
  return [...recipes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function listPersonalRecipes(userId: string): Promise<Recipe[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recipes")
    .select("row_id, id, data, created_at, updated_at")
    .eq("owner_user_id", userId);
  if (error) throw new Error(error.message);
  return sortRecipes((data as RecipeRow[] | null)?.map(rowToRecipe) ?? []);
}

export async function listHouseholdRecipes(code: string): Promise<Recipe[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recipes")
    .select("row_id, id, data, created_at, updated_at")
    .eq("household_code", code);
  if (error) throw new Error(error.message);
  return sortRecipes((data as RecipeRow[] | null)?.map(rowToRecipe) ?? []);
}

async function replaceScopedRecipes(
  scope: TagScope,
  recipes: Recipe[],
): Promise<Recipe[]> {
  const supabase = await createClient();
  const normalized = recipes.map((recipe) => normalizeRecipeTags(normalizeRecipe(recipe)));
  const now = new Date().toISOString();

  let existingQuery = supabase.from("recipes").select("row_id, id");
  if ("owner_user_id" in scope) {
    existingQuery = existingQuery.eq("owner_user_id", scope.owner_user_id);
  } else {
    existingQuery = existingQuery.eq("household_code", scope.household_code);
  }
  const { data: existing, error: existingError } = await existingQuery;
  if (existingError) throw new Error(existingError.message);

  const existingById = new Map(
    (existing ?? []).map((row) => [row.id as string, row.row_id as string]),
  );
  const nextIds = new Set(normalized.map((recipe) => recipe.id));
  const toDelete = [...existingById.entries()]
    .filter(([id]) => !nextIds.has(id))
    .map(([, rowId]) => rowId);

  if (toDelete.length > 0) {
    const { error: deleteError } = await supabase
      .from("recipes")
      .delete()
      .in("row_id", toDelete);
    if (deleteError) throw new Error(deleteError.message);
  }

  const synced: { row_id: string; recipe: Recipe }[] = [];

  for (const recipe of normalized) {
    const payload = {
      id: recipe.id,
      owner_user_id: "owner_user_id" in scope ? scope.owner_user_id : null,
      household_code: "household_code" in scope ? scope.household_code : null,
      data: recipe,
      created_at: recipe.createdAt || now,
      updated_at: recipe.updatedAt || now,
    };
    const existingRowId = existingById.get(recipe.id);
    if (existingRowId) {
      const { error } = await supabase
        .from("recipes")
        .update({
          data: recipe,
          updated_at: recipe.updatedAt || now,
        })
        .eq("row_id", existingRowId);
      if (error) throw new Error(error.message);
      synced.push({ row_id: existingRowId, recipe });
    } else {
      const { data, error } = await supabase
        .from("recipes")
        .insert(payload)
        .select("row_id")
        .single();
      if (error) throw new Error(error.message);
      synced.push({ row_id: data.row_id as string, recipe });
    }
  }

  await syncRecipeTags(scope, synced);

  if ("household_code" in scope) {
    await supabase
      .from("households")
      .update({ updated_at: now })
      .eq("code", scope.household_code);
  }

  return sortRecipes(normalized);
}

export async function replacePersonalRecipes(userId: string, recipes: Recipe[]) {
  return replaceScopedRecipes({ owner_user_id: userId }, recipes);
}

export async function replaceHouseholdRecipes(code: string, recipes: Recipe[]) {
  return replaceScopedRecipes({ household_code: code }, recipes);
}

export async function insertPersonalRecipe(userId: string, recipe: Recipe) {
  const supabase = await createClient();
  const normalized = normalizeRecipeTags(normalizeRecipe(recipe));
  const { data, error } = await supabase
    .from("recipes")
    .insert({
      id: normalized.id,
      owner_user_id: userId,
      household_code: null,
      data: normalized,
      created_at: normalized.createdAt,
      updated_at: normalized.updatedAt,
    })
    .select("row_id")
    .single();
  if (error) throw new Error(error.message);
  await syncRecipeTags({ owner_user_id: userId }, [
    { row_id: data.row_id as string, recipe: normalized },
  ]);
  return normalized;
}

export async function insertHouseholdRecipe(code: string, recipe: Recipe) {
  const supabase = await createClient();
  const normalized = normalizeRecipeTags(normalizeRecipe(recipe));
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("recipes")
    .insert({
      id: normalized.id,
      owner_user_id: null,
      household_code: code,
      data: normalized,
      created_at: normalized.createdAt,
      updated_at: normalized.updatedAt,
    })
    .select("row_id")
    .single();
  if (error) throw new Error(error.message);
  await syncRecipeTags({ household_code: code }, [
    { row_id: data.row_id as string, recipe: normalized },
  ]);
  await supabase.from("households").update({ updated_at: now }).eq("code", code);
  return normalized;
}
