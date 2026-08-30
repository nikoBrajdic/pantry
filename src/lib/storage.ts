import { SAMPLE_RECIPES } from "./samples";
import type { Recipe } from "./types";

export const RECIPES_KEY = "receptoteka:recipes";
export const HOUSEHOLD_KEY = "receptoteka:household";
export const SEEDED_KEY = "receptoteka:seeded";

function canUseStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function loadRecipes(): Recipe[] {
  if (!canUseStorage()) return [];
  const raw = localStorage.getItem(RECIPES_KEY);
  if (!raw) {
    if (!localStorage.getItem(SEEDED_KEY)) {
      localStorage.setItem(RECIPES_KEY, JSON.stringify(SAMPLE_RECIPES));
      localStorage.setItem(SEEDED_KEY, "1");
      return SAMPLE_RECIPES;
    }
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as Recipe[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveRecipes(recipes: Recipe[]) {
  if (!canUseStorage()) return;
  localStorage.setItem(RECIPES_KEY, JSON.stringify(recipes));
}

export function loadHouseholdCode() {
  if (!canUseStorage()) return "";
  return localStorage.getItem(HOUSEHOLD_KEY) ?? "";
}

export function saveHouseholdCode(code: string) {
  if (!canUseStorage()) return;
  if (code) localStorage.setItem(HOUSEHOLD_KEY, code);
  else localStorage.removeItem(HOUSEHOLD_KEY);
}

export function mergeRecipes(local: Recipe[], incoming: Recipe[]) {
  const byId = new Map<string, Recipe>();
  for (const recipe of [...local, ...incoming]) {
    const current = byId.get(recipe.id);
    if (!current || current.updatedAt <= recipe.updatedAt) {
      byId.set(recipe.id, recipe);
    }
  }
  return [...byId.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function newId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `r_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}
