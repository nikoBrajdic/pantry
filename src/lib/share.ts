import type { Recipe } from "./types";

export function encodeRecipeShare(recipe: Recipe) {
  const payload = JSON.stringify(recipe);
  return btoa(unescape(encodeURIComponent(payload)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function decodeRecipeShare(value: string): Recipe | null {
  try {
    const padded = value.replace(/-/g, "+").replace(/_/g, "/");
    const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
    const json = decodeURIComponent(escape(atob(padded + pad)));
    const recipe = JSON.parse(json) as Recipe;
    if (!recipe || typeof recipe.title !== "string") return null;
    return recipe;
  } catch {
    return null;
  }
}

export function shareUrlFor(recipe: Recipe, origin: string) {
  return `${origin}/import?r=${encodeURIComponent(encodeRecipeShare(recipe))}`;
}
