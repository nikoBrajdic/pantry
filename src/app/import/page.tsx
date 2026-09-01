"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ClockIcon, WarningIcon } from "@phosphor-icons/react";
import { useLocale } from "@/components/locale-provider";
import { useRecipes } from "@/components/recipe-provider";
import { ShelfLoading } from "@/components/shelf-loading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  difficultyMessageKey,
  paceMessageKey,
  tagMessageKey,
} from "@/lib/i18n";
import { formatIngredient, groupIngredients } from "@/lib/ingredients";
import { decodeRecipeShare } from "@/lib/share";
import { newId } from "@/lib/storage";
import { DIFFICULTY_OPTIONS, PACE_OPTIONS, formatTagDisplay } from "@/lib/tags";
import type { Recipe } from "@/lib/types";
import { cn } from "@/lib/utils";

function ImportInner() {
  const { t } = useLocale();
  const params = useSearchParams();
  const router = useRouter();
  const { upsertRecipe, recipes, household, kitchens, switchHousehold, ready } =
    useRecipes();
  const code = params.get("c");
  const encoded = params.get("r");

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [targetKitchen, setTargetKitchen] = useState(household);

  useEffect(() => {
    setTargetKitchen(household);
  }, [household]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError("");
      try {
        if (code) {
          const response = await fetch(`/api/share/${encodeURIComponent(code)}`);
          const data = (await response.json()) as { recipe?: Recipe; error?: string };
          if (!response.ok || !data.recipe) {
            throw new Error(data.error ?? t("import.invalid"));
          }
          if (!cancelled) setRecipe(data.recipe);
        } else if (encoded) {
          const decoded = await decodeRecipeShare(encoded);
          if (!decoded) throw new Error(t("import.invalid"));
          if (!cancelled) setRecipe(decoded);
        } else if (!cancelled) {
          setError(t("import.noRecipe"));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t("import.invalid"));
          setRecipe(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, encoded, t]);

  if (!ready || loading) {
    return <ShelfLoading label={t("import.opening")} />;
  }

  if (error || !recipe) {
    return (
      <div className="space-y-3">
        <h1 className="font-heading text-3xl">{t("import.badLink")}</h1>
        <p className="text-muted-foreground">{error || t("import.invalid")}</p>
        <Button render={<Link href="/" />} className="rounded-full">
          {t("import.goLibrary")}
        </Button>
      </div>
    );
  }

  const difficulty = DIFFICULTY_OPTIONS.find((item) => item.id === recipe.difficulty);
  const pace = PACE_OPTIONS.find((item) => item.id === recipe.pace);
  const difficultyKey = difficulty ? difficultyMessageKey(difficulty.id) : null;
  const paceKey = pace ? paceMessageKey(pace.id) : null;
  const already = recipes.some((item) => item.id === recipe.id);

  async function save() {
    if (!recipe) return;
    setSaving(true);
    try {
      if (targetKitchen !== household) {
        await switchHousehold(targetKitchen);
      }
      const next: Recipe = already
        ? { ...recipe, id: newId(), createdAt: new Date().toISOString() }
        : recipe;
      upsertRecipe({ ...next, updatedAt: new Date().toISOString() });
      router.push(`/recipe/${next.id}`);
    } catch {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-primary text-sm font-medium">{t("import.eyebrow")}</p>
        <h1 className="font-heading text-4xl tracking-tight">{recipe.title}</h1>
        <p className="text-muted-foreground mt-2">
          {t("import.meta", {
            servings: recipe.servings,
            ingredients: recipe.ingredients.length,
            steps: recipe.instructions.length,
          })}
        </p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-border bg-card">
        {recipe.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={recipe.imageUrl} alt="" className="h-56 w-full object-cover sm:h-72" />
        ) : null}
        <div className="space-y-4 p-5 sm:p-6">
          <div className="flex flex-wrap gap-1.5">
            <Badge className="rounded-full">
              {difficultyKey ? t(difficultyKey) : difficulty?.label}
            </Badge>
            <Badge variant="secondary" className="rounded-full">
              <ClockIcon className="size-3" />
              {paceKey ? t(paceKey) : pace?.label}
            </Badge>
            {recipe.tags.map((tag) => {
              const key = tagMessageKey(tag);
              return (
                <Badge
                  key={tag}
                  variant="outline"
                  className="rounded-full leading-none"
                >
                  {key ? t(key) : formatTagDisplay(tag)}
                </Badge>
              );
            })}
          </div>

          {recipe.nextDay ? (
            <div className="rounded-2xl border border-primary/25 bg-primary/8 px-3 py-2.5 text-sm">
              <p className="flex items-center gap-2 font-medium">
                <WarningIcon className="size-4 text-primary" />
                {t("import.nextDay")}
              </p>
              {recipe.nextDayNote ? (
                <p className="text-muted-foreground mt-1">{recipe.nextDayNote}</p>
              ) : null}
            </div>
          ) : null}

          <section>
            <h2 className="font-heading text-2xl">{t("import.ingredients")}</h2>
            <div className="mt-3 space-y-4">
              {groupIngredients(recipe.ingredients).map((group) => (
                <div key={group.section ?? "__main__"}>
                  {group.section ? (
                    <h3 className="font-heading mb-2 text-lg tracking-tight">
                      {group.section}
                    </h3>
                  ) : null}
                  <ul className="divide-y divide-border rounded-2xl border border-border">
                    {group.items.map(({ ingredient, index }) => (
                      <li
                        key={`${ingredient.raw}-${index}`}
                        className="px-4 py-2.5 text-sm"
                      >
                        {formatIngredient(ingredient, 1)}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-heading text-2xl">{t("import.method")}</h2>
            {recipe.instructions.length === 0 ? (
              <p className="text-muted-foreground mt-2 text-sm">—</p>
            ) : (
              <ol className="mt-3 space-y-3">
                {recipe.instructions.map((step, index) => (
                  <li key={index} className="flex gap-3 text-sm leading-relaxed">
                    <span className="bg-secondary text-secondary-foreground grid size-7 shrink-0 place-items-center rounded-full text-xs font-medium">
                      {index + 1}
                    </span>
                    <span className="pt-1">{step}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>

          {recipe.notes?.trim() ? (
            <section>
              <h2 className="font-heading text-2xl">{t("import.notes")}</h2>
              <p className="text-muted-foreground mt-2 whitespace-pre-wrap text-sm">
                {recipe.notes}
              </p>
            </section>
          ) : null}
        </div>
      </div>

      <section className="space-y-3 rounded-3xl border border-border bg-card p-5">
        <p className="text-sm font-medium">{t("import.saveTo")}</p>
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setTargetKitchen("")}
            className={cn(
              "flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left",
              targetKitchen === ""
                ? "border-primary bg-primary/8"
                : "border-border hover:border-primary/40",
            )}
          >
            <span className="text-sm font-medium">{t("import.personal")}</span>
          </button>
          {kitchens.map((item) => (
            <button
              key={item.code}
              type="button"
              onClick={() => setTargetKitchen(item.code)}
              className={cn(
                "flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left",
                targetKitchen === item.code
                  ? "border-primary bg-primary/8"
                  : "border-border hover:border-primary/40",
              )}
            >
              <span className="text-sm font-medium">
                {t("import.kitchen", { name: item.name, code: item.code })}
              </span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            className="h-11 rounded-full px-4"
            disabled={saving}
            onClick={() => void save()}
          >
            {saving ? t("import.saving") : t("import.save")}
          </Button>
          <Button
            variant="outline"
            className="h-11 rounded-full px-4"
            render={<Link href="/" />}
          >
            {t("import.skip")}
          </Button>
        </div>
      </section>
    </div>
  );
}

export default function ImportPage() {
  const { t } = useLocale();
  return (
    <Suspense fallback={<ShelfLoading label={t("import.opening")} />}>
      <ImportInner />
    </Suspense>
  );
}
