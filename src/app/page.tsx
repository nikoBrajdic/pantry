"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FireIcon, CaretDownIcon, PlusCircleIcon } from "@phosphor-icons/react";
import { RecipeCard } from "@/components/recipe-card";
import { useRecipes } from "@/components/recipe-provider";
import { ShelfLoading } from "@/components/shelf-loading";
import { Button } from "@/components/ui/button";
import {
  DIFFICULTY_OPTIONS,
  INGREDIENT_FILTERS,
  MEAL_FILTERS,
  PACE_OPTIONS,
} from "@/lib/tags";
import { cn } from "@/lib/utils";
import type { Difficulty, Pace } from "@/lib/types";

type Shelf = "all" | "keepers" | "wishlist" | "hits";

export default function LibraryPage() {
  const { recipes, ready, syncState } = useRecipes();
  const [shelf, setShelf] = useState<Shelf>("all");
  const [difficulty, setDifficulty] = useState<Difficulty | "">("");
  const [pace, setPace] = useState<Pace | "">("");
  const [meal, setMeal] = useState("");
  const [ingredient, setIngredient] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const counts = useMemo(
    () => ({
      all: recipes.length,
      keepers: recipes.filter((recipe) => recipe.list === "keeper").length,
      wishlist: recipes.filter((recipe) => recipe.list === "wishlist").length,
      hits: recipes.filter((recipe) => recipe.timesCooked > 0).length,
    }),
    [recipes],
  );

  const filtered = useMemo(() => {
    return recipes
      .filter((recipe) => {
        if (shelf === "keepers" && recipe.list !== "keeper") return false;
        if (shelf === "wishlist" && recipe.list !== "wishlist") return false;
        if (shelf === "hits" && recipe.timesCooked < 1) return false;
        if (difficulty && recipe.difficulty !== difficulty) return false;
        if (pace && recipe.pace !== pace) return false;
        if (meal && !recipe.tags.includes(meal)) return false;
        if (ingredient && !recipe.tags.includes(ingredient)) return false;
        return true;
      })
      .sort((a, b) =>
        shelf === "hits"
          ? b.timesCooked - a.timesCooked || b.updatedAt.localeCompare(a.updatedAt)
          : b.updatedAt.localeCompare(a.updatedAt),
      );
  }, [difficulty, ingredient, meal, pace, recipes, shelf]);

  const hasFilters = Boolean(difficulty || pace || meal || ingredient);
  const activeFilterCount = [difficulty, pace, meal, ingredient].filter(Boolean).length;

  if (!ready) {
    return <ShelfLoading />;
  }

  return (
    <div className="space-y-6">
      {syncState === "error" && recipes.length === 0 ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
          Could not load your shelf from Supabase. Confirm both SQL migrations were run in the
          SQL editor, then sign out and back in.
        </div>
      ) : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-primary text-sm font-medium">On your shelf</p>
          <h1 className="font-heading text-4xl tracking-tight">
            {shelf === "all"
              ? "All recipes"
              : shelf === "hits"
                ? "Kitchen hits"
                : shelf === "wishlist"
                  ? "Wishlist"
                  : "Keepers"}
          </h1>
          <p className="text-muted-foreground mt-2 max-w-xl text-base">
            All recipes is everything on the shelf. Keepers are the ones you stand by, the
            wishlist is what you still want to try, and Kitchen hits are ranked by how many
            times you cooked them.
          </p>
        </div>
        <Button render={<Link href="/add" />} className="h-11 rounded-full px-4 text-sm">
          <PlusCircleIcon className="size-4" />
          Add a recipe
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", "All recipes", counts.all],
            ["keepers", "Keepers", counts.keepers],
            ["wishlist", "Wishlist", counts.wishlist],
            ["hits", "Kitchen hits", counts.hits],
          ] as [Shelf, string, number][]
        ).map(([id, label, count]) => (
          <button
            key={id}
            type="button"
            onClick={() => setShelf(id)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm",
              shelf === id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card",
            )}
          >
            {id === "hits" ? <FireIcon className="size-4" /> : null}
            {label}
            <span className="opacity-80">{count}</span>
          </button>
        ))}
      </div>

      <div className="space-y-4 rounded-3xl border border-border bg-card/70 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            className="flex items-center gap-2 text-sm font-medium"
            aria-expanded={filtersOpen}
            onClick={() => setFiltersOpen((value) => !value)}
          >
            <CaretDownIcon
              className={cn("size-4 transition-transform", filtersOpen ? "rotate-0" : "-rotate-90")}
            />
            Filters
            {activeFilterCount > 0 ? (
              <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                {activeFilterCount}
              </span>
            ) : null}
          </button>
          {hasFilters ? (
            <button
              type="button"
              className="text-muted-foreground text-sm underline-offset-4 hover:underline"
              onClick={() => {
                setDifficulty("");
                setPace("");
                setMeal("");
                setIngredient("");
              }}
            >
              Clear filters
            </button>
          ) : null}
        </div>

        {filtersOpen ? (
          <div className="space-y-4">
            <FilterRow label="Difficulty">
              {DIFFICULTY_OPTIONS.map((option) => (
                <FilterChip
                  key={option.id}
                  active={difficulty === option.id}
                  onClick={() => setDifficulty(difficulty === option.id ? "" : option.id)}
                >
                  {option.label}
                </FilterChip>
              ))}
            </FilterRow>

            <FilterRow label="Time">
              {PACE_OPTIONS.map((option) => (
                <FilterChip
                  key={option.id}
                  active={pace === option.id}
                  onClick={() => setPace(pace === option.id ? "" : option.id)}
                >
                  {option.label}
                </FilterChip>
              ))}
            </FilterRow>

            <FilterRow label="Meal">
              {MEAL_FILTERS.map((option) => (
                <FilterChip
                  key={option.id}
                  active={meal === option.id}
                  onClick={() => setMeal(meal === option.id ? "" : option.id)}
                >
                  {option.label}
                </FilterChip>
              ))}
            </FilterRow>

            <FilterRow label="Ingredient">
              {INGREDIENT_FILTERS.map((option) => (
                <FilterChip
                  key={option.id}
                  active={ingredient === option.id}
                  onClick={() => setIngredient(ingredient === option.id ? "" : option.id)}
                >
                  {option.label}
                </FilterChip>
              ))}
            </FilterRow>
          </div>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card/60 px-6 py-16 text-center">
          <h2 className="font-heading text-2xl">Nothing on this shelf yet</h2>
          <p className="text-muted-foreground mx-auto mt-2 max-w-md">
            {hasFilters
              ? "Nothing matches these filters. Clear them or try another combination."
              : shelf === "hits"
                ? "Cook a recipe all the way through — check every ingredient and step — and it lands here."
                : shelf === "all"
                  ? "Add a recipe from a link to get the shelf started."
                  : "Add a recipe from a link, or move one from another list."}
          </p>
          <Button render={<Link href="/add" />} className="mt-5 h-11 rounded-full px-4 text-sm">
            Add a recipe
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-sm",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background hover:border-primary/30",
      )}
    >
      {children}
    </button>
  );
}
