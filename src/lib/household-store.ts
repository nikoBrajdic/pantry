import type { HouseholdPayload, Recipe } from "./types";
import { normalizeRecipe } from "./normalize";
import { createClient } from "./supabase/server";

function normalizeCode(code: string) {
  return code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function makeHouseholdCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

export async function readHousehold(code: string): Promise<HouseholdPayload | null> {
  const clean = normalizeCode(code);
  if (clean.length < 4) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("households")
    .select("code, recipes, updated_at")
    .eq("code", clean)
    .maybeSingle();

  if (error || !data) return null;

  return {
    code: data.code,
    recipes: ((data.recipes ?? []) as Recipe[]).map(normalizeRecipe),
    updatedAt: data.updated_at,
  };
}

export async function writeHousehold(code: string, recipes: Recipe[]) {
  const clean = normalizeCode(code);
  if (clean.length < 4) {
    throw new Error("That kitchen code is too short.");
  }

  const supabase = await createClient();
  const payload = {
    code: clean,
    recipes: recipes.map(normalizeRecipe),
    updated_at: new Date().toISOString(),
  };

  const { data: existing } = await supabase
    .from("households")
    .select("code")
    .eq("code", clean)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from("households")
      .update({ recipes: payload.recipes, updated_at: payload.updated_at })
      .eq("code", clean)
      .select("code, recipes, updated_at")
      .single();
    if (error) throw new Error(error.message);
    return {
      code: data.code,
      recipes: (data.recipes as Recipe[]).map(normalizeRecipe),
      updatedAt: data.updated_at,
    } satisfies HouseholdPayload;
  }

  const { data, error } = await supabase
    .from("households")
    .insert(payload)
    .select("code, recipes, updated_at")
    .single();
  if (error) throw new Error(error.message);

  return {
    code: data.code,
    recipes: (data.recipes as Recipe[]).map(normalizeRecipe),
    updatedAt: data.updated_at,
  } satisfies HouseholdPayload;
}
