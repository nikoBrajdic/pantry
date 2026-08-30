"use client";

import { useState } from "react";
import { MinusIcon, PlusIcon } from "@phosphor-icons/react";
import { formatAmount, scaleFromHave, scaleServings } from "@/lib/ingredients";
import type { Recipe } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function useRecipeScale(recipe: Recipe) {
  const [servings, setServings] = useState(recipe.servings);
  const [haveId, setHaveId] = useState("");
  const [haveAmount, setHaveAmount] = useState("");

  const scalable = recipe.ingredients.filter((item) => item.amount != null);
  const selected = scalable.find((item) => (item.raw || item.name) === haveId);
  const factorFromHave = selected
    ? scaleFromHave(selected, Number(haveAmount.replace(",", ".")))
    : null;
  const factor = factorFromHave ?? scaleServings(recipe.servings, servings);
  const shownServings = factorFromHave
    ? Math.max(1, Math.round(recipe.servings * factorFromHave * 10) / 10)
    : servings;

  return {
    servings,
    setServings,
    haveId,
    setHaveId,
    haveAmount,
    setHaveAmount,
    scalable,
    selected,
    factorFromHave,
    factor,
    shownServings,
  };
}

export function RecipeScaler({
  recipe,
  scale,
}: {
  recipe: Recipe;
  scale: ReturnType<typeof useRecipeScale>;
}) {
  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-border bg-card p-4 sm:p-5">
        <p className="text-sm font-medium">How many servings?</p>
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
            <p className="text-muted-foreground text-xs">servings</p>
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
          The original is for {recipe.servings}. Amounts update as you change this.
        </p>
      </section>

      <section className="rounded-3xl border border-border bg-card p-4 sm:p-5">
        <p className="text-sm font-medium">Or scale from what you have</p>
        <p className="text-muted-foreground mt-1 text-sm">
          If you only have 300 g flour, pick flour and type 300 — everything else follows.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_8rem]">
          <div className="space-y-1.5">
            <Label htmlFor="have-ing">Ingredient</Label>
            <select
              id="have-ing"
              value={scale.haveId}
              onChange={(event) => scale.setHaveId(event.target.value)}
              className="border-input bg-background text-foreground h-11 w-full rounded-xl border px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 dark:bg-input/30"
            >
              <option value="" className="bg-background text-foreground">
                Choose an ingredient
              </option>
              {scale.scalable.map((item) => (
                <option
                  key={item.raw || item.name}
                  value={item.raw || item.name}
                  className="bg-background text-foreground"
                >
                  {item.name} {item.unit ? `(${item.unit})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="have-amt">Amount</Label>
            <Input
              id="have-amt"
              value={scale.haveAmount}
              onChange={(event) => scale.setHaveAmount(event.target.value)}
              placeholder={scale.selected?.amount != null ? String(scale.selected.amount) : "0"}
              className="h-11 rounded-xl text-base"
            />
          </div>
        </div>
        {scale.factorFromHave ? (
          <p className="mt-3 text-sm text-primary">
            Scaled to {formatAmount(scale.shownServings)} servings (
            {formatAmount(scale.factorFromHave)}×).
          </p>
        ) : null}
      </section>
    </div>
  );
}
