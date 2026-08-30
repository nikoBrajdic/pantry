export type Difficulty = "easy" | "moderate" | "complicated";
export type Pace = "quick" | "time-consuming";
export type RecipeList = "keeper" | "wishlist";

export type Ingredient = {
  raw: string;
  amount: number | null;
  unit: string | null;
  name: string;
};

/** Nutrition for the recipe as written (original servings). Scale by servings factor when displaying. */
export type Nutrition = {
  calories?: number;
  proteinG?: number;
  fatG?: number;
  carbsG?: number;
  fiberG?: number;
  sugarG?: number;
  sodiumMg?: number;
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
  nutrition?: Nutrition;
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
  nutrition?: Nutrition;
};

export type HouseholdPayload = {
  code: string;
  name: string;
  recipes: Recipe[];
  updatedAt: string;
  memberCount?: number;
};

export type KitchenSummary = {
  code: string;
  name: string;
};

export type UserLibrary = {
  email: string;
  householdCode: string;
  kitchens: KitchenSummary[];
  /** @deprecated prefer kitchens */
  householdCodes?: string[];
  recipes: Recipe[];
  updatedAt: string;
};
