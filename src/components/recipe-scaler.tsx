"use client";

import { useState } from "react";
import { MinusIcon, PlusIcon } from "@phosphor-icons/react";
import {
  formatAmount,
  formatIngredient,
  scaleFromHave,
  scaleServings,
} from "@/lib/ingredients";
import type { Recipe } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RecipeScaler({ recipe }: { recipe: Recipe }) {
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

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border bg-card p-4 sm:p-5">
        <p className="text-sm font-medium">Koliko porcija želiš?</p>
        <div className="mt-3 flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            className="rounded-full"
            onClick={() => {
              setHaveAmount("");
              setServings((value) => Math.max(1, value - 1));
            }}
          >
            <MinusIcon />
          </Button>
          <div className="min-w-16 text-center">
            <p className="font-heading text-3xl">{formatAmount(shownServings)}</p>
            <p className="text-muted-foreground text-xs">porcija</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            className="rounded-full"
            onClick={() => {
              setHaveAmount("");
              setServings((value) => value + 1);
            }}
          >
            <PlusIcon />
          </Button>
        </div>
        <p className="text-muted-foreground mt-3 text-sm">
          Original je za {recipe.servings}. Sastojci se preračunaju odmah.
        </p>
      </section>

      <section className="rounded-3xl border border-border bg-card p-4 sm:p-5">
        <p className="text-sm font-medium">Ili reci koliko sastojka imaš</p>
        <p className="text-muted-foreground mt-1 text-sm">
          Ako imaš samo 300 g brašna, odaberi brašno i upiši 300 — ostalo se
          prilagodi.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_8rem]">
          <div className="space-y-1.5">
            <Label htmlFor="have-ing">Sastojak</Label>
            <select
              id="have-ing"
              value={haveId}
              onChange={(event) => setHaveId(event.target.value)}
              className="border-input h-11 w-full rounded-xl border bg-transparent px-3 text-sm"
            >
              <option value="">Odaberi sastojak</option>
              {scalable.map((item) => (
                <option key={item.raw || item.name} value={item.raw || item.name}>
                  {item.name} {item.unit ? `(${item.unit})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="have-amt">Količina</Label>
            <Input
              id="have-amt"
              value={haveAmount}
              onChange={(event) => setHaveAmount(event.target.value)}
              placeholder={selected?.amount != null ? String(selected.amount) : "0"}
              className="h-11 rounded-xl text-base"
            />
          </div>
        </div>
        {factorFromHave ? (
          <p className="mt-3 text-sm text-primary">
            Preračunato na {formatAmount(shownServings)} porcija (faktor{" "}
            {formatAmount(factorFromHave)}×).
          </p>
        ) : null}
      </section>

      <section>
        <h2 className="font-heading text-2xl">Sastojci</h2>
        <ul className="mt-3 divide-y divide-border rounded-3xl border border-border bg-card">
          {recipe.ingredients.map((ingredient, index) => (
            <li key={`${ingredient.raw}-${index}`} className="px-4 py-3 text-base">
              {formatIngredient(ingredient, factor)}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
