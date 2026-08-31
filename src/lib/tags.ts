import type { Difficulty, Pace } from "./types";

export const RECIPE_TAGS = [
  { id: "chicken", label: "Chicken" },
  { id: "beef", label: "Beef" },
  { id: "pork", label: "Pork" },
  { id: "lamb", label: "Lamb" },
  { id: "fish", label: "Fish" },
  { id: "seafood", label: "Seafood" },
  { id: "vegetarian", label: "Vegetarian" },
  { id: "vegan", label: "Vegan" },
  { id: "gluten-free", label: "Gluten-free" },
  { id: "breakfast", label: "Breakfast" },
  { id: "lunch", label: "Lunch" },
  { id: "dinner", label: "Dinner" },
  { id: "snack", label: "Snack" },
  { id: "dessert", label: "Dessert" },
  { id: "bread", label: "Bread" },
  { id: "pastry", label: "Pastry" },
  { id: "drinks", label: "Drinks" },
  { id: "pasta", label: "Pasta" },
  { id: "rice", label: "Rice" },
  { id: "soup", label: "Soup" },
  { id: "salad", label: "Salad" },
  { id: "vegetables", label: "Vegetables" },
  { id: "oven", label: "Oven" },
  { id: "grill", label: "Grill" },
  { id: "one-pot", label: "One pot" },
  { id: "meal-prep", label: "Meal prep" },
  { id: "spicy", label: "Spicy" },
  { id: "comfort", label: "Comfort food" },
] as const;

export type TagId = (typeof RECIPE_TAGS)[number]["id"];

/** Meal-type filters on the library page. */
export const MEAL_FILTERS = [
  { id: "breakfast", label: "Breakfast" },
  { id: "lunch", label: "Lunch" },
  { id: "dessert", label: "Dessert" },
  { id: "drinks", label: "Drinks" },
] as const;

/** Main ingredient / diet filters on the library page. */
export const INGREDIENT_FILTERS = [
  { id: "chicken", label: "Chicken" },
  { id: "beef", label: "Beef" },
  { id: "pork", label: "Pork" },
  { id: "lamb", label: "Lamb" },
  { id: "fish", label: "Fish" },
  { id: "seafood", label: "Seafood" },
  { id: "vegetarian", label: "Vegetarian" },
  { id: "vegan", label: "Vegan" },
  { id: "pasta", label: "Pasta" },
  { id: "rice", label: "Rice" },
  { id: "vegetables", label: "Vegetables" },
] as const;

export const DIFFICULTY_OPTIONS: { id: Difficulty; label: string; hint: string }[] = [
  { id: "easy", label: "Easy", hint: "Few steps, hard to mess up" },
  { id: "moderate", label: "Moderate", hint: "Needs a bit of care or time" },
  { id: "complicated", label: "Complicated", hint: "More technique or a long prep" },
];

export const PACE_OPTIONS: { id: Pace; label: string; hint: string }[] = [
  { id: "quick", label: "Quick", hint: "About 35 minutes or less" },
  { id: "time-consuming", label: "Time-consuming", hint: "Slow cooking, rising, chilling…" },
];

export function tagLabel(id: string) {
  return RECIPE_TAGS.find((tag) => tag.id === id)?.label ?? formatTagDisplay(id);
}

/** Human label for a tag id/slug (always capitalizes the first letter). */
export function formatTagDisplay(idOrLabel: string) {
  const asWords = idOrLabel
    .trim()
    .replace(/-/g, " ")
    .replace(/\s+/g, " ");
  if (!asWords) return idOrLabel;
  return asWords.charAt(0).toUpperCase() + asWords.slice(1);
}
