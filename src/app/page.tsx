"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MagnifyingGlassIcon, PlusCircleIcon } from "@phosphor-icons/react";
import { RecipeCard } from "@/components/recipe-card";
import { useRecipes } from "@/components/recipe-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DIFFICULTY_OPTIONS, PACE_OPTIONS, RECIPE_TAGS } from "@/lib/tags";
import { fold } from "@/lib/ingredients";
import { cn } from "@/lib/utils";
import type { Difficulty, Pace } from "@/lib/types";

export default function LibraryPage() {
  const { recipes, ready } = useRecipes();
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty | "">("");
  const [pace, setPace] = useState<Pace | "">("");
  const [nextDayOnly, setNextDayOnly] = useState(false);

  const filtered = useMemo(() => {
    const needle = fold(query);
    return recipes.filter((recipe) => {
      const hay = fold(
        [recipe.title, recipe.notes, ...recipe.ingredients.map((item) => item.name)].join(" "),
      );
      if (needle && !hay.includes(needle)) return false;
      if (tag && !recipe.tags.includes(tag)) return false;
      if (difficulty && recipe.difficulty !== difficulty) return false;
      if (pace && recipe.pace !== pace) return false;
      if (nextDayOnly && !recipe.nextDay) return false;
      return true;
    });
  }, [difficulty, nextDayOnly, pace, query, recipes, tag]);

  if (!ready) {
    return <p className="text-muted-foreground">Otvaram knjižnicu…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-primary text-sm font-medium">Tvoja knjižnica</p>
          <h1 className="font-heading text-4xl tracking-tight">Spremljeni recepti</h1>
          <p className="text-muted-foreground mt-2 max-w-xl text-base">
            Zalijepi link, izvuci sastojke i upute, pa kasnije pronađi jelo po onome
            što imaš u kući.
          </p>
        </div>
        <Button render={<Link href="/dodaj" />} className="h-11 rounded-full px-4 text-sm">
          <PlusCircleIcon className="size-4" />
          Dodaj recept
        </Button>
      </div>

      <div className="relative">
        <MagnifyingGlassIcon className="text-muted-foreground absolute top-3.5 left-3 size-4" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Traži po nazivu ili sastojku…"
          className="h-11 rounded-full pl-9 text-base"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterChip active={!tag && !difficulty && !pace && !nextDayOnly} onClick={() => {
          setTag("");
          setDifficulty("");
          setPace("");
          setNextDayOnly(false);
        }}>
          Sve
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
          Sljedeći dan
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
          <h2 className="font-heading text-2xl">Nema recepata za tu pretragu</h2>
          <p className="text-muted-foreground mx-auto mt-2 max-w-md">
            Promijeni filtere ili dodaj prvi recept zalijepljenjem linka.
          </p>
          <Button render={<Link href="/dodaj" />} className="mt-5 h-11 rounded-full px-4 text-sm">
            Dodaj recept
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
