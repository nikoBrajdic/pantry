import { fold } from "./ingredients";
import type { Recipe } from "./types";

const SYNONYMS: Record<string, string[]> = {
  piletina: ["piletina", "pileci", "pilece", "pile", "chicken", "batak", "prsa"],
  govedina: ["govedina", "junece", "junetina", "beef", "biftek"],
  svinjetina: ["svinjetina", "svinjsko", "pork", "slanina"],
  brasno: ["brasno", "flour"],
  jaja: ["jaje", "jajce", "jaja", "eggs", "egg"],
  mlijeko: ["mlijeko", "mleko", "milk"],
  maslac: ["maslac", "butter"],
  rajcica: ["rajcica", "rajcice", "tomato", "tomatoes"],
  luk: ["luk", "crveni luk", "onion", "onions"],
  cesnjak: ["cesnjak", "cesanj", "garlic"],
  paprika: ["paprika", "paprike", "pepper"],
  tikvica: ["tikvica", "tikvice", "zucchini"],
  cokolada: ["cokolada", "chocolate"],
  secer: ["secer", "sugar"],
  bosiljak: ["bosiljak", "basil"],
  limun: ["limun", "lemon"],
  ulje: ["ulje", "maslinovo ulje", "oil", "olive oil"],
  sol: ["sol", "salt"],
  papar: ["papar", "pepper"],
  riza: ["riza", "rice"],
  tjestenina: ["tjestenina", "pasta", "spaghetti"],
};

function tokens(value: string) {
  return fold(value)
    .split(" ")
    .map((part) => part.trim())
    .filter((part) => part.length > 1);
}

function expand(term: string) {
  const folded = fold(term);
  const extras = Object.values(SYNONYMS)
    .filter((group) => group.some((item) => folded.includes(item) || item.includes(folded)))
    .flat();
  return new Set([folded, ...extras, ...tokens(term)]);
}

export function parsePantry(input: string) {
  return input
    .split(/[,;\n]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export type RecipeMatch = {
  recipe: Recipe;
  score: number;
  matched: string[];
  missing: string[];
};

function ingredientMatches(have: Set<string>, ingredientName: string) {
  const parts = tokens(ingredientName);
  if (parts.length === 0) return false;
  const pantry = [...have];
  return parts.some((part) =>
    pantry.some((item) => item.includes(part) || part.includes(item)),
  );
}

export function matchRecipes(recipes: Recipe[], pantryItems: string[]): RecipeMatch[] {
  const have = new Set(pantryItems.flatMap((item) => [...expand(item)]));
  if (have.size === 0) return [];

  return recipes
    .map((recipe) => {
      const matched: string[] = [];
      const missing: string[] = [];
      for (const ingredient of recipe.ingredients) {
        if (ingredientMatches(have, ingredient.name || ingredient.raw)) {
          matched.push(ingredient.name || ingredient.raw);
        } else {
          missing.push(ingredient.name || ingredient.raw);
        }
      }
      const countable = recipe.ingredients.length || 1;
      const score = matched.length / countable;
      return { recipe, score, matched, missing };
    })
    .filter((item) => item.matched.length > 0)
    .sort((a, b) => b.score - a.score || a.missing.length - b.missing.length);
}
