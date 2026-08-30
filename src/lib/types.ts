export type Difficulty = "easy" | "moderate" | "complicated";
export type Pace = "quick" | "time-consuming";
export type RecipeList = "keeper" | "wishlist";

export type Ingredient = {
  raw: string;
  amount: number | null;
  unit: string | null;
  name: string;
};

export type Recipe = {
  id: string;
  title: string;
  sourceUrl?: string;
  imageUrl?: string;
  servings: number;
  ingredients: Ingredient[];
  instructions: string[];
  tags: string[];
  difficulty: Difficulty;
  pace: Pace;
  nextDay: boolean;
  nextDayNote?: string;
  notes?: string;
  list: RecipeList;
  timesCooked: number;
  lastCookedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type ExtractedRecipe = {
  title: string;
  sourceUrl: string;
  imageUrl?: string;
  servings: number;
  ingredients: Ingredient[];
  instructions: string[];
  suggestedPace?: Pace;
};

export type HouseholdPayload = {
  code: string;
  recipes: Recipe[];
  updatedAt: string;
};

export type UserLibrary = {
  email: string;
  householdCode: string;
  recipes: Recipe[];
  updatedAt: string;
};
