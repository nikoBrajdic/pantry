"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/locale-provider";
import { RecipeForm } from "@/components/recipe-form";
import { useRecipes } from "@/components/recipe-provider";
import { ShelfLoading } from "@/components/shelf-loading";
import { Button } from "@/components/ui/button";
import { draftFromRecipe, recipeFromDraft, type RecipeDraft } from "@/lib/draft";

export default function EditRecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { t } = useLocale();
  const { id } = use(params);
  const router = useRouter();
  const { recipes, ready, upsertRecipe } = useRecipes();
  const recipe = recipes.find((item) => item.id === id);
  const [edited, setEdited] = useState<RecipeDraft | null>(null);
  const draft =
    recipe && edited?.id === recipe.id ? edited : recipe ? draftFromRecipe(recipe) : null;

  if (!ready) return <ShelfLoading label={t("loading.recipe")} />;
  if (!recipe || !draft) {
    return (
      <div>
        <p>{t("edit.notFound")}</p>
        <Button render={<Link href="/" />} className="mt-3 rounded-full">
          {t("edit.back")}
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-heading text-4xl tracking-tight">{t("edit.title")}</h1>
        <p className="text-muted-foreground mt-2">{t("edit.blurb")}</p>
      </div>
      <RecipeForm draft={draft} onChange={setEdited} />
      <div className="flex flex-wrap gap-2">
        <Button
          className="h-11 rounded-full px-5 text-sm"
          onClick={() => {
            upsertRecipe(recipeFromDraft(draft, recipe));
            router.push(`/recipe/${recipe.id}`);
          }}
        >
          {t("edit.save")}
        </Button>
        <Button
          variant="outline"
          className="h-11 rounded-full px-5 text-sm"
          render={<Link href={`/recipe/${recipe.id}`} />}
        >
          {t("edit.cancel")}
        </Button>
      </div>
    </div>
  );
}
