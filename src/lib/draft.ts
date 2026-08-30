import { parseIngredientList } from "./ingredients";
import { newId } from "./storage";
import type { Difficulty, ExtractedRecipe, Pace, Recipe } from "./types";

export type RecipeDraft = {
  id?: string;
  title: string;
  sourceUrl: string;
  imageUrl: string;
  servings: number;
  ingredientsText: string;
  instructionsText: string;
  tags: string[];
  difficulty: Difficulty;
  pace: Pace;
  nextDay: boolean;
  nextDayNote: string;
  notes: string;
};

export function emptyDraft(): RecipeDraft {
  return {
    title: "",
    sourceUrl: "",
    imageUrl: "",
    servings: 4,
    ingredientsText: "",
    instructionsText: "",
    tags: [],
    difficulty: "easy",
    pace: "quick",
    nextDay: false,
    nextDayNote: "",
    notes: "",
  };
}

export function draftFromExtracted(extracted: ExtractedRecipe): RecipeDraft {
  return {
    ...emptyDraft(),
    title: extracted.title,
    sourceUrl: extracted.sourceUrl,
    imageUrl: extracted.imageUrl ?? "",
    servings: extracted.servings || 4,
    ingredientsText: extracted.ingredients.map((item) => item.raw || item.name).join("\n"),
    instructionsText: extracted.instructions.join("\n"),
    pace: extracted.suggestedPace ?? "quick",
  };
}

export function draftFromRecipe(recipe: Recipe): RecipeDraft {
  return {
    id: recipe.id,
    title: recipe.title,
    sourceUrl: recipe.sourceUrl ?? "",
    imageUrl: recipe.imageUrl ?? "",
    servings: recipe.servings,
    ingredientsText: recipe.ingredients.map((item) => item.raw || item.name).join("\n"),
    instructionsText: recipe.instructions.join("\n"),
    tags: recipe.tags,
    difficulty: recipe.difficulty,
    pace: recipe.pace,
    nextDay: recipe.nextDay,
    nextDayNote: recipe.nextDayNote ?? "",
    notes: recipe.notes ?? "",
  };
}

export function recipeFromDraft(draft: RecipeDraft, existing?: Recipe): Recipe {
  const now = new Date().toISOString();
  return {
    id: draft.id ?? existing?.id ?? newId(),
    title: draft.title.trim() || "Recept bez naslova",
    sourceUrl: draft.sourceUrl.trim() || undefined,
    imageUrl: draft.imageUrl.trim() || undefined,
    servings: Math.max(1, Number(draft.servings) || 1),
    ingredients: parseIngredientList(draft.ingredientsText.split(/\r?\n/)),
    instructions: draft.instructionsText
      .split(/\r?\n/)
      .map((step) => step.replace(/^\d+[.)]\s*/, "").trim())
      .filter(Boolean),
    tags: draft.tags,
    difficulty: draft.difficulty,
    pace: draft.pace,
    nextDay: draft.nextDay,
    nextDayNote: draft.nextDayNote.trim() || undefined,
    notes: draft.notes.trim() || undefined,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}
