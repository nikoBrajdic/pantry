import type { Recipe } from "./types";
import { parseIngredientList } from "./ingredients";

function stamp(
  id: string,
  createdAt: string,
  rest: Omit<Recipe, "id" | "createdAt" | "updatedAt">,
): Recipe {
  return { id, createdAt, updatedAt: createdAt, ...rest };
}

export const SAMPLE_RECIPES: Recipe[] = [
  stamp("sample-chicken", "2026-01-12T10:00:00.000Z", {
    title: "Sample recipe",
    imageUrl:
      "https://images.unsplash.com/photo-1598103442097-8b74394b95c2?auto=format&fit=crop&w=1200&q=80",
    servings: 4,
    ingredients: parseIngredientList([
      "800 g chicken thighs",
      "2 red peppers",
      "1 zucchini",
      "1 red onion",
      "3 garlic cloves",
      "3 tbsp olive oil",
      "1 lemon",
      "1 tsp dried oregano",
      "salt and pepper",
    ]),
    instructions: [
      "Heat the oven to 200°C / 400°F.",
      "Pat the chicken dry, then salt and pepper it. Cut the peppers, zucchini, and onion into large chunks.",
      "Pile everything into a roasting pan. Add crushed garlic, oregano, lemon zest and juice, and olive oil.",
      "Roast 35–40 minutes, until the chicken is browned and the vegetables are soft.",
      "Rest 5 minutes and serve with bread or rice.",
    ],
    tags: ["chicken", "lunch", "dinner", "oven", "one-pot"],
    difficulty: "easy",
    pace: "quick",
    nextDay: false,
    notes: "For crispier skin, switch to the grill for the last 5 minutes.",
    list: "keeper",
    timesCooked: 3,
    lastCookedAt: "2026-08-10T18:00:00.000Z",
  }),
];
