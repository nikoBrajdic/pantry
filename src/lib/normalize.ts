import type { Nutrition, Recipe } from "./types";
import { formatIngredient, parseIngredient } from "./ingredients";
import { normalizeImagePosition } from "./image-position";
import { normalizeTagSlug } from "./tag-normalize";

export function normalizeNutrition(value: unknown): Nutrition | undefined {
  if (!value || typeof value !== "object") return undefined;
  const raw = value as Record<string, unknown>;
  const nutrition: Nutrition = {
    calories: typeof raw.calories === "number" ? raw.calories : undefined,
    proteinG: typeof raw.proteinG === "number" ? raw.proteinG : undefined,
    fatG: typeof raw.fatG === "number" ? raw.fatG : undefined,
    carbsG: typeof raw.carbsG === "number" ? raw.carbsG : undefined,
    fiberG: typeof raw.fiberG === "number" ? raw.fiberG : undefined,
    sugarG: typeof raw.sugarG === "number" ? raw.sugarG : undefined,
    sodiumMg: typeof raw.sodiumMg === "number" ? raw.sodiumMg : undefined,
  };
  return Object.values(nutrition).some((item) => item != null) ? nutrition : undefined;
}

export function scaleNutrition(nutrition: Nutrition | undefined, factor: number): Nutrition | undefined {
  if (!nutrition) return undefined;
  const scale = (n?: number) => (n == null ? undefined : Math.round(n * factor * 10) / 10);
  return {
    calories: scale(nutrition.calories),
    proteinG: scale(nutrition.proteinG),
    fatG: scale(nutrition.fatG),
    carbsG: scale(nutrition.carbsG),
    fiberG: scale(nutrition.fiberG),
    sugarG: scale(nutrition.sugarG),
    sodiumMg: scale(nutrition.sodiumMg),
  };
}

export function normalizeRecipe(recipe: Recipe): Recipe {
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const raw of recipe.tags ?? []) {
    const id = normalizeTagSlug(raw);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    tags.push(id);
  }
  return {
    ...recipe,
    list: recipe.list === "keeper" ? "keeper" : "wishlist",
    timesCooked: Number.isFinite(recipe.timesCooked) ? recipe.timesCooked : 0,
    imagePosition: recipe.imageUrl
      ? normalizeImagePosition(recipe.imagePosition)
      : undefined,
    ingredients: (recipe.ingredients ?? []).map((ingredient) => {
      const parsed = ingredient.raw?.trim()
        ? parseIngredient(ingredient.raw)
        : ingredient;
      const section = ingredient.section?.trim();
      const withSection = section
        ? { ...parsed, section }
        : { ...parsed, section: undefined };
      // Keep stored raw in decimal form for easier editing / mental math.
      return {
        ...withSection,
        raw: formatIngredient(withSection, 1, "original"),
      };
    }),
    instructions: recipe.instructions ?? [],
    tags,
    nutrition: normalizeNutrition(recipe.nutrition),
  };
}
