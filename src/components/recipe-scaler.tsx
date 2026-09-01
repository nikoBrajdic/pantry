"use client";

import { useState } from "react";
import { MinusIcon, PlusIcon } from "@phosphor-icons/react";
import { useLocale } from "@/components/locale-provider";
import {
  convertIngredient,
  displayUnit,
  formatAmount,
  parseIngredient,
  scaleFromHave,
  scaleServings,
} from "@/lib/ingredients";
import type { Recipe } from "@/lib/types";
import type { UnitSystem } from "@/lib/units";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function displayIngredientForScale(ingredient: Recipe["ingredients"][number], system: UnitSystem) {
  const parsed =
    ingredient.raw && ingredient.raw.trim()
      ? parseIngredient(ingredient.raw)
      : ingredient;
  return convertIngredient(
    {
      ...parsed,
      section: ingredient.section,
    },
    system,
  );
}

export function useRecipeScale(recipe: Recipe, unitSystem: UnitSystem = "original") {
  const [servings, setServings] = useState(recipe.servings);
  const [haveIndex, setHaveIndex] = useState<number | null>(null);
  const [haveAmount, setHaveAmount] = useState("");

  const scalable = recipe.ingredients
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => {
      const parsed =
        item.raw && item.raw.trim() ? parseIngredient(item.raw) : item;
      return parsed.amount != null;
    });
  const selectedEntry =
    haveIndex == null ? null : scalable.find((entry) => entry.index === haveIndex) ?? null;
  const selected = selectedEntry?.item ?? null;
  const selectedDisplay = selected
    ? displayIngredientForScale(selected, unitSystem)
    : null;
  const factorFromHave = selected
    ? scaleFromHave(selected, Number(haveAmount.replace(",", ".")), unitSystem)
    : null;
  const factor = factorFromHave ?? scaleServings(recipe.servings, servings);
  const shownServings = factorFromHave
    ? Math.max(1, Math.round(recipe.servings * factorFromHave * 10) / 10)
    : servings;

  return {
    servings,
    setServings,
    haveIndex,
    setHaveIndex,
    haveAmount,
    setHaveAmount,
    scalable,
    selected,
    selectedDisplay,
    factorFromHave,
    factor,
    shownServings,
    unitSystem,
  };
}

export function RecipeScaler({
  recipe,
  scale,
}: {
  recipe: Recipe;
  scale: ReturnType<typeof useRecipeScale>;
}) {
  const { t } = useLocale();
  const unitLabel = displayUnit(scale.selectedDisplay?.unit ?? null);

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-border bg-card p-4 sm:p-5">
        <p className="text-sm font-medium">{t("scaler.servingsQuestion")}</p>
        <div className="mt-3 flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            className="rounded-full"
            onClick={() => {
              scale.setHaveAmount("");
              scale.setServings((value) => Math.max(1, value - 1));
            }}
          >
            <MinusIcon />
          </Button>
          <div className="min-w-16 text-center">
            <p className="font-numeric text-3xl">{formatAmount(scale.shownServings)}</p>
            <p className="text-muted-foreground text-xs">{t("scaler.servings")}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            className="rounded-full"
            onClick={() => {
              scale.setHaveAmount("");
              scale.setServings((value) => value + 1);
            }}
          >
            <PlusIcon />
          </Button>
        </div>
        <p className="text-muted-foreground mt-3 text-sm">
          {t("scaler.originalBlurb", { count: recipe.servings })}
        </p>
      </section>

      <section className="rounded-3xl border border-border bg-card p-4 sm:p-5">
        <p className="text-sm font-medium">{t("scaler.haveQuestion")}</p>
        <p className="text-muted-foreground mt-1 text-sm">{t("scaler.haveHint")}</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_8rem]">
          <div className="space-y-1.5">
            <Label htmlFor="have-ing">{t("scaler.ingredient")}</Label>
            <select
              id="have-ing"
              value={scale.haveIndex == null ? "" : String(scale.haveIndex)}
              onChange={(event) => {
                const value = event.target.value;
                scale.setHaveIndex(value ? Number(value) : null);
              }}
              className="border-input bg-background text-foreground h-11 w-full rounded-xl border px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 dark:bg-input/30"
            >
              <option value="" className="bg-background text-foreground">
                {t("scaler.choose")}
              </option>
              {scale.scalable.map(({ item, index }) => {
                const displayed = displayIngredientForScale(item, scale.unitSystem);
                const optionUnit = displayUnit(displayed.unit);
                return (
                  <option
                    key={index}
                    value={String(index)}
                    className="bg-background text-foreground"
                  >
                    {item.section ? `${item.section}: ` : ""}
                    {displayed.name}
                    {optionUnit ? ` (${optionUnit})` : ""}
                  </option>
                );
              })}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="have-amt">
              {t("scaler.amount")}
              {unitLabel ? ` (${unitLabel})` : ""}
            </Label>
            <Input
              id="have-amt"
              value={scale.haveAmount}
              onChange={(event) => scale.setHaveAmount(event.target.value)}
              placeholder={
                scale.selectedDisplay?.amount != null
                  ? String(scale.selectedDisplay.amount)
                  : "0"
              }
              className="h-11 rounded-xl text-base"
            />
          </div>
        </div>
        {scale.factorFromHave ? (
          <p className="mt-3 text-sm text-primary">
            {t("scaler.scaledTo", {
              servings: formatAmount(scale.shownServings),
              factor: formatAmount(scale.factorFromHave),
            })}
          </p>
        ) : null}
      </section>
    </div>
  );
}
