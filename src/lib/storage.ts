import type { Recipe } from "./types";

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
