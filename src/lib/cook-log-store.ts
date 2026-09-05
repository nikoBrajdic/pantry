import type { CookLog } from "./types";
import { createClient } from "./supabase/server";

type CookLogRow = {
  id: string;
  recipe_id: string;
  recipe_title: string;
  recipe_image_url: string | null;
  household_code: string;
  cooked_at: string;
};

function rowToCookLog(row: CookLogRow): CookLog {
  return {
    id: row.id,
    recipeId: row.recipe_id,
    recipeTitle: row.recipe_title,
    recipeImageUrl: row.recipe_image_url || undefined,
    householdCode: row.household_code ?? "",
    cookedAt: row.cooked_at,
  };
}

export function publicRecipeImageUrl(url?: string) {
  if (!url) return undefined;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return undefined;
}

export async function listCookLogs(userId: string): Promise<CookLog[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cook_logs")
    .select("id, recipe_id, recipe_title, recipe_image_url, household_code, cooked_at")
    .eq("user_id", userId)
    .order("cooked_at", { ascending: false })
    .limit(500);
  if (error) throw new Error(error.message);
  return ((data as CookLogRow[] | null) ?? []).map(rowToCookLog);
}

export async function insertCookLog(
  userId: string,
  input: {
    recipeId: string;
    recipeTitle: string;
    recipeImageUrl?: string;
    householdCode?: string;
  },
): Promise<CookLog> {
  const recipeId = input.recipeId.trim();
  const recipeTitle = input.recipeTitle.trim();
  if (!recipeId || !recipeTitle) {
    throw new Error("A recipe is needed to log a cook.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cook_logs")
    .insert({
      user_id: userId,
      recipe_id: recipeId,
      recipe_title: recipeTitle,
      recipe_image_url: publicRecipeImageUrl(input.recipeImageUrl) ?? null,
      household_code: (input.householdCode ?? "").trim().toUpperCase(),
    })
    .select("id, recipe_id, recipe_title, recipe_image_url, household_code, cooked_at")
    .single();
  if (error) throw new Error(error.message);
  return rowToCookLog(data as CookLogRow);
}

export async function deleteCookLog(userId: string, id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("cook_logs")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
}
