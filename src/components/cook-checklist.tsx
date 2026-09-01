"use client";

import { useState } from "react";
import { CheckCircleIcon, FireIcon } from "@phosphor-icons/react";
import { useLocale } from "@/components/locale-provider";
import { formatIngredient, groupIngredients } from "@/lib/ingredients";
import type { UnitSystem } from "@/lib/units";
import type { Recipe } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function useCookChecklist(recipe: Recipe, onCooked: () => number) {
  const [checkedIngredients, setCheckedIngredients] = useState(() =>
    recipe.ingredients.map(() => false),
  );
  const [checkedSteps, setCheckedSteps] = useState(() =>
    recipe.instructions.map(() => false),
  );
  const [logged, setLogged] = useState<number | null>(null);

  function maybeFinish(nextIngredients: boolean[], nextSteps: boolean[]) {
    const hasWork = nextIngredients.length > 0 && nextSteps.length > 0;
    const done =
      hasWork && nextIngredients.every(Boolean) && nextSteps.every(Boolean);
    if (done && logged == null) {
      setLogged(onCooked());
    }
  }

  function toggleIngredient(index: number, checked: boolean) {
    const next = checkedIngredients.map((value, i) =>
      i === index ? checked : value,
    );
    setCheckedIngredients(next);
    maybeFinish(next, checkedSteps);
  }

  function toggleStep(index: number, checked: boolean) {
    const next = checkedSteps.map((value, i) => (i === index ? checked : value));
    setCheckedSteps(next);
    maybeFinish(checkedIngredients, next);
  }

  function reset() {
    setCheckedIngredients(recipe.ingredients.map(() => false));
    setCheckedSteps(recipe.instructions.map(() => false));
    setLogged(null);
  }

  return {
    checkedIngredients,
    checkedSteps,
    logged,
    toggleIngredient,
    toggleStep,
    reset,
  };
}

export type CookChecklistState = ReturnType<typeof useCookChecklist>;

export function IngredientsChecklist({
  recipe,
  factor,
  cook,
  unitSystem = "original",
  onUnitSystemChange,
}: {
  recipe: Recipe;
  factor: number;
  cook: CookChecklistState;
  unitSystem?: UnitSystem;
  onUnitSystemChange?: (system: UnitSystem) => void;
}) {
  const { t } = useLocale();
  const groups = groupIngredients(recipe.ingredients);

  return (
    <section>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-heading text-2xl">{t("cook.ingredients")}</h2>
          <p className="text-muted-foreground mt-1 text-sm">{t("cook.ingredientsHint")}</p>
        </div>
        {onUnitSystemChange ? (
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["original", "units.asWritten"],
                ["imperial", "units.imperial"],
              ] as const
            ).map(([system, key]) => {
              const active = unitSystem === system;
              return (
                <Button
                  key={system}
                  type="button"
                  size="sm"
                  variant={active ? "default" : "outline"}
                  className="rounded-full"
                  onClick={() => onUnitSystemChange(system)}
                >
                  {t(key)}
                </Button>
              );
            })}
          </div>
        ) : null}
      </div>
      <div className="mt-3 space-y-4">
        {groups.map((group) => (
          <div key={group.section ?? "__main__"}>
            {group.section ? (
              <h3 className="font-heading mb-2 text-lg tracking-tight">{group.section}</h3>
            ) : null}
            <ul className="divide-y divide-border rounded-3xl border border-border bg-card">
              {group.items.map(({ ingredient, index }) => (
                <li key={`${ingredient.raw}-${index}`}>
                  <label className="flex cursor-pointer items-start gap-3 px-4 py-3">
                    <Checkbox
                      checked={cook.checkedIngredients[index] ?? false}
                      onCheckedChange={(checked) =>
                        cook.toggleIngredient(index, Boolean(checked))
                      }
                      className="mt-0.5 rounded-md"
                    />
                    <span
                      className={cn(
                        cook.checkedIngredients[index] &&
                          "text-muted-foreground line-through",
                      )}
                    >
                      {formatIngredient(ingredient, factor, unitSystem)}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {onUnitSystemChange ? (
        <p className="text-muted-foreground mt-2 text-xs">{t("units.hint")}</p>
      ) : null}
    </section>
  );
}

export function MethodChecklist({
  recipe,
  cook,
}: {
  recipe: Recipe;
  cook: CookChecklistState;
}) {
  const { t } = useLocale();

  return (
    <section className="rounded-3xl border border-border bg-card p-5 sm:p-6">
      <h2 className="font-heading text-2xl">{t("cook.method")}</h2>
      {recipe.instructions.length === 0 ? (
        <p className="text-muted-foreground mt-3">{t("cook.noSteps")}</p>
      ) : (
        <ol className="mt-4 space-y-3">
          {recipe.instructions.map((step, index) => (
            <li key={index}>
              <label className="flex cursor-pointer items-start gap-3">
                <Checkbox
                  checked={cook.checkedSteps[index] ?? false}
                  onCheckedChange={(checked) =>
                    cook.toggleStep(index, Boolean(checked))
                  }
                  className="mt-1 rounded-md"
                />
                <span className="flex gap-3">
                  <span className="bg-secondary text-secondary-foreground grid size-7 shrink-0 place-items-center rounded-full text-sm font-medium">
                    {index + 1}
                  </span>
                  <span
                    className={`pt-0.5 text-base leading-relaxed ${
                      cook.checkedSteps[index]
                        ? "text-muted-foreground line-through"
                        : ""
                    }`}
                  >
                    {step}
                  </span>
                </span>
              </label>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export function CookProgress({ cook }: { cook: CookChecklistState }) {
  const { t } = useLocale();

  if (cook.logged != null) {
    return (
      <div className="rounded-3xl border border-primary/30 bg-primary/8 p-4">
        <p className="flex items-center gap-2 text-sm font-medium">
          <CheckCircleIcon className="size-4 text-primary" />
          {t("cook.done", { count: cook.logged })}
        </p>
        <p className="text-muted-foreground mt-1 text-sm">{t("cook.doneHint")}</p>
        <Button variant="outline" className="mt-3 rounded-full" onClick={cook.reset}>
          <FireIcon />
          {t("cook.again")}
        </Button>
      </div>
    );
  }

  return <p className="text-muted-foreground text-sm">{t("cook.hint")}</p>;
}
