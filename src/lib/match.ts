import { fold } from "./ingredients";
import type { Recipe } from "./types";

const STOPWORDS = new Set([
  "and",
  "or",
  "the",
  "a",
  "an",
  "of",
  "with",
  "for",
  "to",
  "in",
  "on",
  "at",
  "into",
  "i",
  "ili",
  "za",
  "sa",
  "od",
  "na",
  "u",
  "te",
]);

/** Same-ingredient translations / aliases — used for full-word matches only. */
const SYNONYM_GROUPS: string[][] = [
  ["chicken", "piletina", "pileci", "pile"],
  ["beef", "steak", "govedina"],
  ["pork", "bacon", "svinjetina"],
  ["flour", "brasno"],
  ["egg", "eggs", "jaje", "jajce", "jaja"],
  ["milk", "mlijeko", "mleko"],
  ["butter", "maslac"],
  ["tomato", "tomatoes", "rajcica"],
  ["onion", "onions", "luk"],
  ["garlic", "cesnjak"],
  ["pepper", "peppers", "paprika"],
  ["zucchini", "courgette", "tikvica"],
  ["chocolate", "cokolada"],
  ["sugar", "secer"],
  ["basil", "bosiljak"],
  ["lemon", "limun"],
  ["oil", "ulje"],
  ["salt", "sol"],
  ["rice", "riza"],
  ["pasta", "spaghetti", "tjestenina"],
];

const ALIAS_LOOKUP: Map<string, Set<string>> = (() => {
  const map = new Map<string, Set<string>>();
  for (const group of SYNONYM_GROUPS) {
    const aliases = new Set<string>();
    for (const item of group) {
      for (const form of wordForms(item)) aliases.add(form);
    }
    for (const form of aliases) map.set(form, aliases);
  }
  return map;
})();

export type MatchField = "tags" | "title" | "body";
export type MatchKind = "exact" | "partial";

const FIELD_RANK: Record<MatchField, number> = { tags: 0, title: 1, body: 2 };
const KIND_RANK: Record<MatchKind, number> = { exact: 0, partial: 1 };

function wordForms(token: string): string[] {
  const folded = fold(token);
  if (!folded) return [];
  const forms = new Set<string>([folded]);
  if (folded.endsWith("ies") && folded.length > 4) {
    forms.add(`${folded.slice(0, -3)}y`);
  }
  if (folded.endsWith("oes") && folded.length > 4) {
    forms.add(folded.slice(0, -2));
  } else if (folded.endsWith("es") && folded.length > 4) {
    forms.add(folded.slice(0, -2));
  }
  if (folded.endsWith("s") && !folded.endsWith("ss") && folded.length > 3) {
    forms.add(folded.slice(0, -1));
  }
  forms.add(`${folded}s`);
  forms.add(`${folded}es`);
  if (folded.endsWith("y") && folded.length > 3) {
    forms.add(`${folded.slice(0, -1)}ies`);
  }
  return [...forms];
}

function aliasesFor(token: string): Set<string> {
  const forms = wordForms(token);
  const aliases = new Set<string>(forms);
  for (const form of forms) {
    const group = ALIAS_LOOKUP.get(form);
    if (!group) continue;
    for (const item of group) aliases.add(item);
  }
  return aliases;
}

function tokenize(value: string): string[] {
  return fold(value)
    .split(" ")
    .map((part) => part.trim())
    .filter((part) => part.length > 1 && !STOPWORDS.has(part));
}

function fullWordMatch(term: string, words: string[]): boolean {
  const termAliases = aliasesFor(term);
  return words.some((word) => {
    if (termAliases.has(word)) return true;
    for (const alias of aliasesFor(word)) {
      if (termAliases.has(alias)) return true;
    }
    return false;
  });
}

function classifyHit(term: string, foldedHaystack: string, words: string[]): MatchKind | null {
  if (term.length < 2 || !foldedHaystack) return null;
  if (fullWordMatch(term, words)) return "exact";
  if (foldedHaystack.includes(term)) return "partial";
  return null;
}

export function parsePantry(input: string) {
  const seen = new Set<string>();
  const terms: string[] = [];
  for (const chunk of input.split(/[,;\n]+/)) {
    for (const token of tokenize(chunk)) {
      if (seen.has(token)) continue;
      seen.add(token);
      terms.push(token);
    }
  }
  return terms;
}

export type RecipeMatch = {
  recipe: Recipe;
  field: MatchField;
  kind: MatchKind;
  fieldHits: number;
  exactHits: number;
};

type FieldIndex = {
  folded: string;
  words: string[];
};

function fieldIndex(parts: string[]): FieldIndex {
  const folded = fold(parts.filter(Boolean).join(" "));
  return { folded, words: tokenize(folded) };
}

function recipeIndexes(recipe: Recipe) {
  const tagParts = recipe.tags.flatMap((tag) => [tag, tag.replace(/-/g, " ")]);
  const bodyParts = [
    ...recipe.ingredients.map((ingredient) => ingredient.raw || ingredient.name),
    ...recipe.instructions,
    recipe.notes ?? "",
    recipe.nextDayNote ?? "",
  ];
  return {
    tags: fieldIndex(tagParts),
    title: fieldIndex([recipe.title]),
    body: fieldIndex(bodyParts),
  };
}

function betterKind(current: MatchKind | null, next: MatchKind): MatchKind {
  if (current === "exact") return "exact";
  return next;
}

export function matchRecipes(recipes: Recipe[], pantryItems: string[]): RecipeMatch[] {
  const terms = pantryItems.map((item) => fold(item)).filter((item) => item.length > 1);
  if (terms.length === 0) return [];

  return recipes
    .flatMap((recipe) => {
      const indexes = recipeIndexes(recipe);
      let tagsKind: MatchKind | null = null;
      let titleKind: MatchKind | null = null;
      let bodyKind: MatchKind | null = null;
      let tagsHits = 0;
      let titleHits = 0;
      let bodyHits = 0;
      let tagsExact = 0;
      let titleExact = 0;
      let bodyExact = 0;

      for (const term of terms) {
        const tagHit = classifyHit(term, indexes.tags.folded, indexes.tags.words);
        const titleHit = classifyHit(term, indexes.title.folded, indexes.title.words);
        const bodyHit = classifyHit(term, indexes.body.folded, indexes.body.words);
        if (!tagHit && !titleHit && !bodyHit) return [];

        if (tagHit) {
          tagsHits += 1;
          if (tagHit === "exact") tagsExact += 1;
          tagsKind = betterKind(tagsKind, tagHit);
        }
        if (titleHit) {
          titleHits += 1;
          if (titleHit === "exact") titleExact += 1;
          titleKind = betterKind(titleKind, titleHit);
        }
        if (bodyHit) {
          bodyHits += 1;
          if (bodyHit === "exact") bodyExact += 1;
          bodyKind = betterKind(bodyKind, bodyHit);
        }
      }

      const field: MatchField = tagsKind ? "tags" : titleKind ? "title" : "body";
      const kind = (field === "tags" ? tagsKind : field === "title" ? titleKind : bodyKind) ?? "partial";
      const fieldHits = field === "tags" ? tagsHits : field === "title" ? titleHits : bodyHits;
      const exactHits = field === "tags" ? tagsExact : field === "title" ? titleExact : bodyExact;

      return [{ recipe, field, kind, fieldHits, exactHits }];
    })
    .sort((a, b) => {
      const field = FIELD_RANK[a.field] - FIELD_RANK[b.field];
      if (field) return field;
      const kind = KIND_RANK[a.kind] - KIND_RANK[b.kind];
      if (kind) return kind;
      if (b.exactHits !== a.exactHits) return b.exactHits - a.exactHits;
      if (b.fieldHits !== a.fieldHits) return b.fieldHits - a.fieldHits;
      return a.recipe.title.localeCompare(b.recipe.title);
    });
}
