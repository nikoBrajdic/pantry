import { normalizeRecipe } from "./normalize";
import type { Recipe } from "./types";
import { createClient } from "./supabase/server";

type RecipeRow = {
  id: string;
  data: Recipe;
  created_at: string;
  updated_at: string;
};

function rowToRecipe(row: RecipeRow): Recipe {
  const raw = row.data && typeof row.data === "object" ? row.data : ({} as Recipe);
  return normalizeRecipe({
    ...raw,
    id: row.id || raw.id,
    createdAt: raw.createdAt || row.created_at,
    updatedAt: raw.updatedAt || row.updated_at,
  });
}

function sortRecipes(recipes: Recipe[]) {
  return [...recipes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function listPersonalRecipes(userId: string): Promise<Recipe[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recipes")
    .select("id, data, created_at, updated_at")
    .eq("owner_user_id", userId);
  if (error) throw new Error(error.message);
  return sortRecipes((data as RecipeRow[] | null)?.map(rowToRecipe) ?? []);
}

export async function listHouseholdRecipes(code: string): Promise<Recipe[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recipes")
    .select("id, data, created_at, updated_at")
    .eq("household_code", code);
  if (error) throw new Error(error.message);
  return sortRecipes((data as RecipeRow[] | null)?.map(rowToRecipe) ?? []);
}

async function replaceScopedRecipes(
  scope: { owner_user_id: string } | { household_code: string },
  recipes: Recipe[],
): Promise<Recipe[]> {
  const supabase = await createClient();
  const normalized = recipes.map(normalizeRecipe);
  const now = new Date().toISOString();

  let clearQuery = supabase.from("recipes").delete();
  if ("owner_user_id" in scope) {
    clearQuery = clearQuery.eq("owner_user_id", scope.owner_user_id);
  } else {
    clearQuery = clearQuery.eq("household_code", scope.household_code);
  }
  const { error: clearError } = await clearQuery;
  if (clearError) throw new Error(clearError.message);

  if (normalized.length > 0) {
    const rows = normalized.map((recipe) => ({
      id: recipe.id,
      owner_user_id: "owner_user_id" in scope ? scope.owner_user_id : null,
      household_code: "household_code" in scope ? scope.household_code : null,
      data: recipe,
      created_at: recipe.createdAt || now,
      updated_at: recipe.updatedAt || now,
    }));
    const { error: insertError } = await supabase.from("recipes").insert(rows);
    if (insertError) throw new Error(insertError.message);
  }

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
  const normalized = normalizeRecipe(recipe);
  const { error } = await supabase.from("recipes").insert({
    id: normalized.id,
    owner_user_id: userId,
    household_code: null,
    data: normalized,
    created_at: normalized.createdAt,
    updated_at: normalized.updatedAt,
  });
  if (error) throw new Error(error.message);
  return normalized;
}

export async function insertHouseholdRecipe(code: string, recipe: Recipe) {
  const supabase = await createClient();
  const normalized = normalizeRecipe(recipe);
  const now = new Date().toISOString();
  const { error } = await supabase.from("recipes").insert({
    id: normalized.id,
    owner_user_id: null,
    household_code: code,
    data: normalized,
    created_at: normalized.createdAt,
    updated_at: normalized.updatedAt,
  });
  if (error) throw new Error(error.message);
  await supabase.from("households").update({ updated_at: now }).eq("code", code);
  return normalized;
}
