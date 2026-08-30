import { SAMPLE_RECIPES } from "./samples";
import { normalizeRecipe } from "./normalize";
import type { KitchenSummary, Recipe, UserLibrary } from "./types";
import {
  addMembership,
  listKitchens,
  readHousehold,
  removeMembership,
  renameHousehold,
  writeHousehold,
} from "./household-store";
import { createClient } from "./supabase/server";

export function userKey(email: string) {
  return email.trim().toLowerCase();
}

type ProfileRow = {
  id: string;
  email: string;
  household_code: string;
  recipes: Recipe[];
  updated_at: string;
};

async function requireAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    throw new Error("You need to sign in first.");
  }
  return { supabase, user };
}

async function ensureProfile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  user: { id: string; email: string },
): Promise<ProfileRow> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, household_code, recipes, updated_at")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (data) return data as ProfileRow;

  const seeded = SAMPLE_RECIPES.map(normalizeRecipe);
  const fresh = {
    id: user.id,
    email: userKey(user.email),
    household_code: "",
    recipes: seeded,
    updated_at: new Date().toISOString(),
  };
  const { data: created, error: insertError } = await supabase
    .from("profiles")
    .insert(fresh)
    .select("id, email, household_code, recipes, updated_at")
    .single();
  if (insertError) throw new Error(insertError.message);
  return created as ProfileRow;
}

async function toLibrary(
  userEmail: string,
  profile: ProfileRow,
  kitchens: KitchenSummary[],
): Promise<UserLibrary> {
  if (profile.household_code) {
    const household = await readHousehold(profile.household_code);
    if (household) {
      return {
        email: userKey(userEmail),
        householdCode: household.code,
        kitchens,
        householdCodes: kitchens.map((item) => item.code),
        recipes: household.recipes.map(normalizeRecipe),
        updatedAt: household.updatedAt,
      };
    }
  }

  return {
    email: userKey(userEmail),
    householdCode: "",
    kitchens,
    householdCodes: kitchens.map((item) => item.code),
    recipes: ((profile.recipes ?? []) as Recipe[]).map(normalizeRecipe),
    updatedAt: profile.updated_at,
  };
}

export async function readUserLibrary(email?: string): Promise<UserLibrary> {
  const { supabase, user } = await requireAuthUser();
  if (email && userKey(email) !== userKey(user.email!)) {
    throw new Error("You need to sign in first.");
  }

  let profile = await ensureProfile(supabase, {
    id: user.id,
    email: user.email!,
  });

  const recipes = ((profile.recipes ?? []) as Recipe[]).map(normalizeRecipe);
  if (recipes.length === 0 && !profile.household_code) {
    const seeded = SAMPLE_RECIPES.map(normalizeRecipe);
    const { data, error } = await supabase
      .from("profiles")
      .update({ recipes: seeded, updated_at: new Date().toISOString() })
      .eq("id", user.id)
      .select("id, email, household_code, recipes, updated_at")
      .single();
    if (error) throw new Error(error.message);
    profile = data as ProfileRow;
  }

  if (profile.household_code) {
    await addMembership(user.id, profile.household_code).catch(() => undefined);
  }

  const kitchens = await listKitchens(user.id);
  return toLibrary(user.email!, profile, kitchens);
}

export async function writeUserLibrary(library: UserLibrary) {
  const { supabase, user } = await requireAuthUser();
  await ensureProfile(supabase, { id: user.id, email: user.email! });

  const householdCode = library.householdCode ?? "";
  const recipes = library.recipes.map(normalizeRecipe);
  const updatedAt = new Date().toISOString();

  if (householdCode) {
    await addMembership(user.id, householdCode);
    await writeHousehold(householdCode, recipes);
    const { data, error } = await supabase
      .from("profiles")
      .update({
        household_code: householdCode,
        updated_at: updatedAt,
      })
      .eq("id", user.id)
      .select("id, email, household_code, recipes, updated_at")
      .single();
    if (error) throw new Error(error.message);
    const kitchens = await listKitchens(user.id);
    return toLibrary(user.email!, data as ProfileRow, kitchens);
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({
      household_code: "",
      recipes,
      updated_at: updatedAt,
    })
    .eq("id", user.id)
    .select("id, email, household_code, recipes, updated_at")
    .single();
  if (error) throw new Error(error.message);

  const kitchens = await listKitchens(user.id);
  return {
    email: userKey(user.email!),
    householdCode: "",
    kitchens,
    householdCodes: kitchens.map((item) => item.code),
    recipes: ((data.recipes ?? []) as Recipe[]).map(normalizeRecipe),
    updatedAt: data.updated_at,
  } satisfies UserLibrary;
}

export async function saveUserRecipes(
  email: string,
  recipes: Recipe[],
  householdCode?: string,
) {
  const current = await readUserLibrary(email).catch(() => null);
  return writeUserLibrary({
    email,
    householdCode: householdCode ?? current?.householdCode ?? "",
    kitchens: current?.kitchens ?? [],
    householdCodes: current?.householdCodes ?? [],
    recipes,
    updatedAt: new Date().toISOString(),
  });
}

export async function switchHousehold(code: string) {
  const { supabase, user } = await requireAuthUser();
  const profile = await ensureProfile(supabase, { id: user.id, email: user.email! });
  const clean = code.trim().toUpperCase();

  if (!clean) {
    const { data, error } = await supabase
      .from("profiles")
      .update({ household_code: "", updated_at: new Date().toISOString() })
      .eq("id", user.id)
      .select("id, email, household_code, recipes, updated_at")
      .single();
    if (error) throw new Error(error.message);
    const kitchens = await listKitchens(user.id);
    return toLibrary(user.email!, data as ProfileRow, kitchens);
  }

  const kitchens = await listKitchens(user.id);
  if (!kitchens.some((item) => item.code === clean)) {
    throw new Error("You are not in that kitchen.");
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({ household_code: clean, updated_at: new Date().toISOString() })
    .eq("id", user.id)
    .select("id, email, household_code, recipes, updated_at")
    .single();
  if (error) throw new Error(error.message);
  return toLibrary(user.email!, { ...profile, ...data } as ProfileRow, kitchens);
}

export async function leaveHouseholdMembership(code: string) {
  const { supabase, user } = await requireAuthUser();
  const profile = await ensureProfile(supabase, { id: user.id, email: user.email! });
  const clean = code.trim().toUpperCase();
  await removeMembership(user.id, clean);

  const nextActive = profile.household_code === clean ? "" : profile.household_code;

  const { data, error } = await supabase
    .from("profiles")
    .update({
      household_code: nextActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)
    .select("id, email, household_code, recipes, updated_at")
    .single();
  if (error) throw new Error(error.message);

  const kitchens = await listKitchens(user.id);
  return toLibrary(user.email!, data as ProfileRow, kitchens);
}

export async function renameKitchen(code: string, name: string) {
  const { user } = await requireAuthUser();
  const kitchens = await listKitchens(user.id);
  const clean = code.trim().toUpperCase();
  if (!kitchens.some((item) => item.code === clean)) {
    throw new Error("You are not in that kitchen.");
  }
  await renameHousehold(clean, name);
  return readUserLibrary();
}
