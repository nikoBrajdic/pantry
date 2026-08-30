"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useLocale } from "@/components/locale-provider";
import { useRecipes } from "@/components/recipe-provider";
import { Button } from "@/components/ui/button";
import { decodeRecipeShare } from "@/lib/share";
import { newId } from "@/lib/storage";

function ImportInner() {
  const { t } = useLocale();
  const params = useSearchParams();
  const router = useRouter();
  const { upsertRecipe, recipes } = useRecipes();
  const encoded = params.get("r");
  const recipe = encoded ? decodeRecipeShare(encoded) : null;
  const error = !encoded
    ? t("import.noRecipe")
    : recipe
      ? ""
      : t("import.invalid");

  if (error) {
    return (
      <div className="space-y-3">
        <h1 className="font-heading text-3xl">{t("import.badLink")}</h1>
        <p className="text-muted-foreground">{error}</p>
        <Button render={<Link href="/" />} className="rounded-full">
          {t("import.goLibrary")}
        </Button>
      </div>
    );
  }

  if (!recipe) return <p className="text-muted-foreground">{t("import.opening")}</p>;

  const already = recipes.some((item) => item.id === recipe.id);

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <p className="text-primary text-sm font-medium">{t("import.eyebrow")}</p>
      <h1 className="font-heading text-4xl tracking-tight">{recipe.title}</h1>
      <p className="text-muted-foreground">
        {t("import.meta", {
          servings: recipe.servings,
          ingredients: recipe.ingredients.length,
          steps: recipe.instructions.length,
        })}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          className="h-11 rounded-full px-4"
          onClick={() => {
            const next = already
              ? { ...recipe, id: newId(), createdAt: new Date().toISOString() }
              : recipe;
            upsertRecipe({ ...next, updatedAt: new Date().toISOString() });
            router.push(`/recipe/${next.id}`);
          }}
        >
          {t("import.save")}
        </Button>
        <Button variant="outline" className="h-11 rounded-full px-4" render={<Link href="/" />}>
          {t("import.skip")}
        </Button>
      </div>
    </div>
  );
}

export default function ImportPage() {
  const { t } = useLocale();
  return (
    <Suspense fallback={<p className="text-muted-foreground">{t("import.opening")}</p>}>
      <ImportInner />
    </Suspense>
  );
}
