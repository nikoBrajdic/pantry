"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FireIcon, MagnifyingGlassIcon, PlusCircleIcon } from "@phosphor-icons/react";
import { RecipeCard } from "@/components/recipe-card";
import { useRecipes } from "@/components/recipe-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DIFFICULTY_OPTIONS, PACE_OPTIONS, RECIPE_TAGS } from "@/lib/tags";
import { fold } from "@/lib/ingredients";
import { cn } from "@/lib/utils";
import type { Difficulty, Pace } from "@/lib/types";

type Shelf = "all" | "keepers" | "wishlist" | "hits";

export default function LibraryPage() {
  const { recipes, ready } = useRecipes();
  const [query, setQuery] = useState("");
  const [shelf, setShelf] = useState<Shelf>("all");
  const [tag, setTag] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty | "">("");
  const [pace, setPace] = useState<Pace | "">("");
  const [nextDayOnly, setNextDayOnly] = useState(false);

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
    const needle = fold(query);
    return recipes
      .filter((recipe) => {
        if (shelf === "keepers" && recipe.list !== "keeper") return false;
        if (shelf === "wishlist" && recipe.list !== "wishlist") return false;
        if (shelf === "hits" && recipe.timesCooked < 1) return false;
        const hay = fold(
          [recipe.title, recipe.notes, ...recipe.ingredients.map((item) => item.name)].join(" "),
        );
        if (needle && !hay.includes(needle)) return false;
        if (tag && !recipe.tags.includes(tag)) return false;
        if (difficulty && recipe.difficulty !== difficulty) return false;
        if (pace && recipe.pace !== pace) return false;
        if (nextDayOnly && !recipe.nextDay) return false;
        return true;
      })
      .sort((a, b) =>
        shelf === "hits"
          ? b.timesCooked - a.timesCooked || b.updatedAt.localeCompare(a.updatedAt)
          : b.updatedAt.localeCompare(a.updatedAt),
      );
  }, [difficulty, nextDayOnly, pace, query, recipes, shelf, tag]);

  if (!ready) {
    return <p className="text-muted-foreground">Opening your shelf…</p>;
  }

  return (
    <div className="space-y-6">
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
            All recipes is everything on the shelf. Keepers are the ones you stand
            by, the wishlist is what you still want to try, and Kitchen hits are
            ranked by how many times you cooked them.
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

      <div className="relative">
        <MagnifyingGlassIcon className="text-muted-foreground absolute top-3.5 left-3 size-4" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name or ingredient…"
          className="h-11 rounded-full pl-9 text-base"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterChip
          active={!tag && !difficulty && !pace && !nextDayOnly}
          onClick={() => {
            setTag("");
            setDifficulty("");
            setPace("");
            setNextDayOnly(false);
          }}
        >
          All tags
        </FilterChip>
        {DIFFICULTY_OPTIONS.map((option) => (
          <FilterChip
            key={option.id}
            active={difficulty === option.id}
            onClick={() => setDifficulty(difficulty === option.id ? "" : option.id)}
          >
            {option.label}
          </FilterChip>
        ))}
        {PACE_OPTIONS.map((option) => (
          <FilterChip
            key={option.id}
            active={pace === option.id}
            onClick={() => setPace(pace === option.id ? "" : option.id)}
          >
            {option.label}
          </FilterChip>
        ))}
        <FilterChip active={nextDayOnly} onClick={() => setNextDayOnly((value) => !value)}>
          Next day
        </FilterChip>
        {RECIPE_TAGS.slice(0, 12).map((item) => (
          <FilterChip
            key={item.id}
            active={tag === item.id}
            onClick={() => setTag(tag === item.id ? "" : item.id)}
          >
            {item.label}
          </FilterChip>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card/60 px-6 py-16 text-center">
          <h2 className="font-heading text-2xl">Nothing on this shelf yet</h2>
          <p className="text-muted-foreground mx-auto mt-2 max-w-md">
            {shelf === "hits"
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
          : "border-border bg-card hover:border-primary/30",
      )}
    >
      {children}
    </button>
  );
}
