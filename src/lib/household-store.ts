import type { HouseholdPayload, KitchenSummary, Recipe } from "./types";
import {
  listHouseholdRecipes,
  replaceHouseholdRecipes,
} from "./recipe-store";
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

function kitchenName(raw: unknown, code: string) {
  const value = typeof raw === "string" ? raw.trim() : "";
  return value || code;
}

export async function readHousehold(code: string): Promise<HouseholdPayload | null> {
  const clean = normalizeCode(code);
  if (clean.length < 4) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("households")
    .select("code, name, updated_at")
    .eq("code", clean)
    .maybeSingle();

  if (error || !data) {
    if (error?.message.toLowerCase().includes("name")) {
      const fallback = await supabase
        .from("households")
        .select("code, updated_at")
        .eq("code", clean)
        .maybeSingle();
      if (fallback.error || !fallback.data) return null;
      const recipes = await listHouseholdRecipes(clean);
      const { count, error: countError } = await supabase
        .from("household_members")
        .select("*", { count: "exact", head: true })
        .eq("household_code", clean);
      return {
        code: fallback.data.code,
        name: fallback.data.code,
        recipes,
        updatedAt: fallback.data.updated_at,
        memberCount: countError ? undefined : (count ?? undefined),
      };
    }
    return null;
  }

  const recipes = await listHouseholdRecipes(clean);
  const { count, error: countError } = await supabase
    .from("household_members")
    .select("*", { count: "exact", head: true })
    .eq("household_code", clean);

  return {
    code: data.code,
    name: kitchenName(data.name, data.code),
    recipes,
    updatedAt: data.updated_at,
    memberCount: countError ? undefined : (count ?? undefined),
  };
}

export async function ensureHousehold(code: string, name?: string) {
  const clean = normalizeCode(code);
  if (clean.length < 4) {
    throw new Error("That kitchen code is too short.");
  }

  const supabase = await createClient();
  const updatedAt = new Date().toISOString();
  const { data: existing } = await supabase
    .from("households")
    .select("code, name, updated_at")
    .eq("code", clean)
    .maybeSingle();

  if (existing) {
    if (typeof name === "string" && name.trim() && name.trim() !== kitchenName(existing.name, existing.code)) {
      const { data, error } = await supabase
        .from("households")
        .update({ name: name.trim(), updated_at: updatedAt })
        .eq("code", clean)
        .select("code, name, updated_at")
        .single();
      if (error) throw new Error(error.message);
      return {
        code: data.code,
        name: kitchenName(data.name, data.code),
        updatedAt: data.updated_at,
      };
    }
    return {
      code: existing.code,
      name: kitchenName(existing.name, existing.code),
      updatedAt: existing.updated_at,
    };
  }

  const insertPayload: Record<string, unknown> = {
    code: clean,
    updated_at: updatedAt,
  };
  if (typeof name === "string" && name.trim()) {
    insertPayload.name = name.trim();
  }

  const { data, error } = await supabase
    .from("households")
    .insert(insertPayload)
    .select("code, name, updated_at")
    .single();
  if (error) {
    if (error.message.toLowerCase().includes("name")) {
      const retry = await supabase
        .from("households")
        .insert({ code: clean, updated_at: updatedAt })
        .select("code, updated_at")
        .single();
      if (retry.error) throw new Error(retry.error.message);
      return {
        code: retry.data.code,
        name: retry.data.code,
        updatedAt: retry.data.updated_at,
      };
    }
    throw new Error(error.message);
  }

  return {
    code: data.code,
    name: kitchenName(data.name, data.code),
    updatedAt: data.updated_at,
  };
}

export async function writeHousehold(code: string, recipes: Recipe[], name?: string) {
  const clean = normalizeCode(code);
  const meta = await ensureHousehold(clean, name);
  const nextRecipes = await replaceHouseholdRecipes(clean, recipes);
  return {
    code: meta.code,
    name: meta.name,
    recipes: nextRecipes,
    updatedAt: meta.updatedAt,
  } satisfies HouseholdPayload;
}

export async function renameHousehold(code: string, name: string) {
  const clean = normalizeCode(code);
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Give the kitchen a name.");
  if (trimmed.length > 48) throw new Error("That name is too long.");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("households")
    .update({ name: trimmed, updated_at: new Date().toISOString() })
    .eq("code", clean)
    .select("code, name, updated_at")
    .single();
  if (error) throw new Error(error.message);
  const recipes = await listHouseholdRecipes(clean);
  return {
    code: data.code,
    name: kitchenName(data.name, data.code),
    recipes,
    updatedAt: data.updated_at,
  } satisfies HouseholdPayload;
}

export async function listKitchens(userId: string): Promise<KitchenSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("household_members")
    .select("household_code, joined_at, households(code, name)")
    .eq("user_id", userId)
    .order("joined_at", { ascending: true });

  if (error) {
    if (error.message.toLowerCase().includes("household_members")) {
      return [];
    }
    const basic = await supabase
      .from("household_members")
      .select("household_code")
      .eq("user_id", userId)
      .order("joined_at", { ascending: true });
    if (basic.error) {
      if (basic.error.message.toLowerCase().includes("household_members")) return [];
      throw new Error(basic.error.message);
    }
    return (basic.data ?? []).map((row) => ({
      code: row.household_code as string,
      name: row.household_code as string,
    }));
  }

  return (data ?? []).map((row) => {
    const code = row.household_code as string;
    const linked = row.households as { code?: string; name?: string } | null;
    return {
      code,
      name: kitchenName(linked?.name, code),
    };
  });
}

/** @deprecated use listKitchens */
export async function listMemberships(userId: string): Promise<string[]> {
  const kitchens = await listKitchens(userId);
  return kitchens.map((item) => item.code);
}

export async function addMembership(userId: string, code: string) {
  const clean = normalizeCode(code);
  const supabase = await createClient();
  const { error } = await supabase.from("household_members").upsert(
    { household_code: clean, user_id: userId },
    { onConflict: "household_code,user_id" },
  );
  if (error && !error.message.toLowerCase().includes("household_members")) {
    throw new Error(error.message);
  }
}

export async function removeMembership(userId: string, code: string) {
  const clean = normalizeCode(code);
  const supabase = await createClient();
  const { error } = await supabase
    .from("household_members")
    .delete()
    .eq("user_id", userId)
    .eq("household_code", clean);
  if (error && !error.message.toLowerCase().includes("household_members")) {
    throw new Error(error.message);
  }
}
