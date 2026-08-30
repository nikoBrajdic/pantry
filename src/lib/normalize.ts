import type { Recipe } from "./types";

export function normalizeRecipe(recipe: Recipe): Recipe {
  return {
    ...recipe,
    list: recipe.list === "keeper" ? "keeper" : "wishlist",
    timesCooked: Number.isFinite(recipe.timesCooked) ? recipe.timesCooked : 0,
    ingredients: recipe.ingredients ?? [],
    instructions: recipe.instructions ?? [],
    tags: recipe.tags ?? [],
  };
}
