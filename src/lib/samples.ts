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
    title: "Sheet-pan chicken with vegetables",
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
  stamp("sample-cake", "2026-02-03T18:20:00.000Z", {
    title: "Overnight chocolate cake",
    imageUrl:
      "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1200&q=80",
    servings: 8,
    ingredients: parseIngredientList([
      "200 g dark chocolate",
      "150 g butter",
      "150 g sugar",
      "4 eggs",
      "80 g flour",
      "1 pinch salt",
      "1 tsp vanilla",
    ]),
    instructions: [
      "Melt the chocolate and butter over a bain-marie, then let them cool slightly.",
      "Beat the eggs and sugar until pale. Stir in the chocolate, vanilla, and salt.",
      "Fold in the flour and pour into a 20–22 cm tin lined with paper.",
      "Bake at 170°C / 340°F for about 25 minutes — the centre should stay a little fudgy.",
      "Cool completely, then chill overnight. Slice it the next day.",
    ],
    tags: ["dessert", "oven", "comfort"],
    difficulty: "moderate",
    pace: "time-consuming",
    nextDay: true,
    nextDayNote: "It needs to cool fully and rest in the fridge. Best the next day.",
    notes: "",
    list: "wishlist",
    timesCooked: 0,
  }),
  stamp("sample-soup", "2026-03-08T12:00:00.000Z", {
    title: "Tomato basil soup",
    imageUrl:
      "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=1200&q=80",
    servings: 4,
    ingredients: parseIngredientList([
      "1 kg ripe tomatoes",
      "1 onion",
      "2 garlic cloves",
      "2 tbsp olive oil",
      "500 ml vegetable stock",
      "1 tsp sugar",
      "a handful of fresh basil",
      "salt and pepper",
    ]),
    instructions: [
      "Soften the chopped onion in the oil, then add the garlic.",
      "Add the chopped tomatoes, sugar, salt, and pepper. Cook 10 minutes.",
      "Pour in the stock and simmer another 15 minutes.",
      "Blend until smooth, then stir in the chopped basil.",
      "Serve with a drizzle of olive oil and toasted bread.",
    ],
    tags: ["soup", "vegetarian", "lunch", "vegan", "vegetables"],
    difficulty: "easy",
    pace: "quick",
    nextDay: false,
    list: "keeper",
    timesCooked: 1,
    lastCookedAt: "2026-07-02T12:00:00.000Z",
  }),
  stamp("sample-pancakes", "2026-04-01T08:30:00.000Z", {
    title: "Fridge-clearing pancakes",
    imageUrl:
      "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=1200&q=80",
    servings: 4,
    ingredients: parseIngredientList([
      "250 g flour",
      "3 eggs",
      "500 ml milk",
      "1 pinch salt",
      "1 tbsp sugar",
      "20 g butter for frying",
    ]),
    instructions: [
      "Whisk the eggs, milk, salt, and sugar, then add the flour until smooth.",
      "Rest the batter 15 minutes.",
      "Fry thin pancakes in butter on medium heat, both sides.",
      "Serve with jam, chocolate spread, or cheese — whatever is in the house.",
    ],
    tags: ["breakfast", "snack", "vegetarian"],
    difficulty: "easy",
    pace: "quick",
    nextDay: false,
    notes: "I use oat milk when we are out of regular milk. Still works.",
    list: "keeper",
    timesCooked: 6,
    lastCookedAt: "2026-08-28T09:00:00.000Z",
  }),
];
