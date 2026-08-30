"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FireIcon, CaretDownIcon, PlusCircleIcon } from "@phosphor-icons/react";
import { RecipeCard } from "@/components/recipe-card";
import { useLocale } from "@/components/locale-provider";
import { useRecipes } from "@/components/recipe-provider";
import { ShelfLoading } from "@/components/shelf-loading";
import { Button } from "@/components/ui/button";
import {
  DIFFICULTY_OPTIONS,
  INGREDIENT_FILTERS,
  MEAL_FILTERS,
  PACE_OPTIONS,
} from "@/lib/tags";
import {
  difficultyMessageKey,
  paceMessageKey,
  tagMessageKey,
  type MessageKey,
} from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { Difficulty, Pace } from "@/lib/types";

type Shelf = "all" | "keepers" | "wishlist" | "hits";

export default function LibraryPage() {
  const { recipes, ready, syncState, household, kitchens, switchHousehold } = useRecipes();
  const { t } = useLocale();
  const [shelf, setShelf] = useState<Shelf>("all");
  const [difficulty, setDifficulty] = useState<Difficulty | "">("");
  const [pace, setPace] = useState<Pace | "">("");
  const [meal, setMeal] = useState("");
  const [ingredient, setIngredient] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

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

  const shelfTitleKey: MessageKey =
    shelf === "all"
      ? "library.title.all"
      : shelf === "hits"
        ? "library.title.hits"
        : shelf === "wishlist"
          ? "library.title.wishlist"
          : "library.title.keepers";

  if (!ready) {
    return <ShelfLoading />;
  }

  async function openKitchen(code: string) {
    if (code === household || switching) return;
    setSwitching(true);
    try {
      await switchHousehold(code);
    } finally {
      setSwitching(false);
    }
  }

  return (
    <div className="space-y-6">
      {syncState === "error" && recipes.length === 0 ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
          {t("library.syncError")}
        </div>
      ) : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-primary text-sm font-medium">{t("library.eyebrow")}</p>
          <h1 className="font-heading text-4xl tracking-tight">{t(shelfTitleKey)}</h1>
          <p className="text-muted-foreground mt-2 max-w-xl text-base">{t("library.blurb")}</p>
        </div>
        <Button render={<Link href="/add" />} className="h-11 rounded-full px-4 text-sm">
          <PlusCircleIcon className="size-4" />
          {t("library.add")}
        </Button>
      </div>

      {kitchens.length > 0 ? (
        <div className="space-y-2">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            {t("library.kitchen")}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={switching}
              onClick={() => void openKitchen("")}
              className={cn(
                "rounded-full border px-4 py-2 text-sm",
                !household
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card",
                switching && "opacity-60",
              )}
            >
              {t("library.personal")}
            </button>
            {kitchens.map((item) => (
              <button
                key={item.code}
                type="button"
                disabled={switching}
                onClick={() => void openKitchen(item.code)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm",
                  household === item.code
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card",
                  switching && "opacity-60",
                )}
              >
                {item.name}
              </button>
            ))}
          </div>
          {switching ? (
            <p className="text-muted-foreground text-xs">{t("library.switching")}</p>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", "library.title.all", counts.all],
            ["keepers", "library.title.keepers", counts.keepers],
            ["wishlist", "library.title.wishlist", counts.wishlist],
            ["hits", "library.title.hits", counts.hits],
          ] as [Shelf, MessageKey, number][]
        ).map(([id, labelKey, count]) => (
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
            {t(labelKey)}
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
            {t("library.filters")}
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
              {t("library.clearFilters")}
            </button>
          ) : null}
        </div>

        {filtersOpen ? (
          <div className="space-y-4">
            <FilterRow label={t("library.filter.difficulty")}>
              {DIFFICULTY_OPTIONS.map((option) => {
                const key = difficultyMessageKey(option.id);
                return (
                  <FilterChip
                    key={option.id}
                    active={difficulty === option.id}
                    onClick={() => setDifficulty(difficulty === option.id ? "" : option.id)}
                  >
                    {key ? t(key) : option.label}
                  </FilterChip>
                );
              })}
            </FilterRow>

            <FilterRow label={t("library.filter.time")}>
              {PACE_OPTIONS.map((option) => {
                const key = paceMessageKey(option.id);
                return (
                  <FilterChip
                    key={option.id}
                    active={pace === option.id}
                    onClick={() => setPace(pace === option.id ? "" : option.id)}
                  >
                    {key ? t(key) : option.label}
                  </FilterChip>
                );
              })}
            </FilterRow>

            <FilterRow label={t("library.filter.meal")}>
              {MEAL_FILTERS.map((option) => {
                const key = tagMessageKey(option.id);
                return (
                  <FilterChip
                    key={option.id}
                    active={meal === option.id}
                    onClick={() => setMeal(meal === option.id ? "" : option.id)}
                  >
                    {key ? t(key) : option.label}
                  </FilterChip>
                );
              })}
            </FilterRow>

            <FilterRow label={t("library.filter.ingredient")}>
              {INGREDIENT_FILTERS.map((option) => {
                const key = tagMessageKey(option.id);
                return (
                  <FilterChip
                    key={option.id}
                    active={ingredient === option.id}
                    onClick={() =>
                      setIngredient(ingredient === option.id ? "" : option.id)
                    }
                  >
                    {key ? t(key) : option.label}
                  </FilterChip>
                );
              })}
            </FilterRow>
          </div>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card/60 px-6 py-16 text-center">
          <h2 className="font-heading text-2xl">{t("library.empty.title")}</h2>
          <p className="text-muted-foreground mx-auto mt-2 max-w-md">
            {hasFilters
              ? t("library.empty.filters")
              : shelf === "hits"
                ? t("library.empty.hits")
                : shelf === "all"
                  ? t("library.empty.all")
                  : t("library.empty.list")}
          </p>
          <Button render={<Link href="/add" />} className="mt-5 h-11 rounded-full px-4 text-sm">
            {t("library.add")}
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
