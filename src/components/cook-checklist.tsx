"use client";

import { useState } from "react";
import { CheckCircleIcon, FireIcon } from "@phosphor-icons/react";
import { formatIngredient } from "@/lib/ingredients";
import type { Recipe } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

export function CookChecklist({
  recipe,
  factor,
  onCooked,
}: {
  recipe: Recipe;
  factor: number;
  onCooked: () => number;
}) {
  const [ingredients, setIngredients] = useState(() => recipe.ingredients.map(() => false));
  const [steps, setSteps] = useState(() => recipe.instructions.map(() => false));
  const [logged, setLogged] = useState<number | null>(null);

  function maybeFinish(nextIngredients: boolean[], nextSteps: boolean[]) {
    const hasWork = nextIngredients.length > 0 && nextSteps.length > 0;
    const done =
      hasWork && nextIngredients.every(Boolean) && nextSteps.every(Boolean);
    if (done && logged == null) {
      setLogged(onCooked());
    }
  }

  function reset() {
    setIngredients(recipe.ingredients.map(() => false));
    setSteps(recipe.instructions.map(() => false));
    setLogged(null);
  }

  return (
    <div className="space-y-6">
      <section>
        <h2 className="font-heading text-2xl">Ingredients</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Check each one off as you go.
        </p>
        <ul className="mt-3 divide-y divide-border rounded-3xl border border-border bg-card">
          {recipe.ingredients.map((ingredient, index) => (
            <li key={`${ingredient.raw}-${index}`}>
              <label className="flex cursor-pointer items-start gap-3 px-4 py-3">
                <Checkbox
                  checked={ingredients[index] ?? false}
                  onCheckedChange={(checked) => {
                    const next = ingredients.map((value, i) =>
                      i === index ? Boolean(checked) : value,
                    );
                    setIngredients(next);
                    maybeFinish(next, steps);
                  }}
                  className="mt-0.5 rounded-md"
                />
                <span className={ingredients[index] ? "text-muted-foreground line-through" : ""}>
                  {formatIngredient(ingredient, factor)}
                </span>
              </label>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-3xl border border-border bg-card p-5 sm:p-6">
        <h2 className="font-heading text-2xl">Method</h2>
        {recipe.instructions.length === 0 ? (
          <p className="text-muted-foreground mt-3">No steps saved yet.</p>
        ) : (
          <ol className="mt-4 space-y-3">
            {recipe.instructions.map((step, index) => (
              <li key={index}>
                <label className="flex cursor-pointer items-start gap-3">
                  <Checkbox
                    checked={steps[index] ?? false}
                    onCheckedChange={(checked) => {
                      const next = steps.map((value, i) =>
                        i === index ? Boolean(checked) : value,
                      );
                      setSteps(next);
                      maybeFinish(ingredients, next);
                    }}
                    className="mt-1 rounded-md"
                  />
                  <span className="flex gap-3">
                    <span className="bg-secondary text-secondary-foreground grid size-7 shrink-0 place-items-center rounded-full text-sm font-medium">
                      {index + 1}
                    </span>
                    <span
                      className={`pt-0.5 text-base leading-relaxed ${steps[index] ? "text-muted-foreground line-through" : ""}`}
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

      {logged != null ? (
        <div className="rounded-3xl border border-primary/30 bg-primary/8 p-4">
          <p className="flex items-center gap-2 text-sm font-medium">
            <CheckCircleIcon className="size-4 text-primary" />
            Cooked. That was time #{logged}.
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            It now shows up in Kitchen hits. Reset the lists when you make it again.
          </p>
          <Button variant="outline" className="mt-3 rounded-full" onClick={reset}>
            <FireIcon />
            Cook again
          </Button>
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">
          Check every ingredient and every step to log a cook.
        </p>
      )}
    </div>
  );
}
