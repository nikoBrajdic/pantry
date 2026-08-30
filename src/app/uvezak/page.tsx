"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useRecipes } from "@/components/recipe-provider";
import { Button } from "@/components/ui/button";
import { decodeRecipeShare } from "@/lib/share";
import { newId } from "@/lib/storage";
import { Suspense } from "react";

function ImportInner() {
  const params = useSearchParams();
  const router = useRouter();
  const { upsertRecipe, recipes } = useRecipes();
  const encoded = params.get("r");
  const recipe = encoded ? decodeRecipeShare(encoded) : null;
  const error = !encoded
    ? "U linku nema recepta."
    : recipe
      ? ""
      : "Ovaj link recepta nije valjan.";

  if (error) {
    return (
      <div className="space-y-3">
        <h1 className="font-heading text-3xl">Link ne radi</h1>
        <p className="text-muted-foreground">{error}</p>
        <Button render={<Link href="/" />} className="rounded-full">
          Idi u knjižnicu
        </Button>
      </div>
    );
  }

  if (!recipe) return <p className="text-muted-foreground">Otvaram recept…</p>;

  const already = recipes.some((item) => item.id === recipe.id);

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <p className="text-primary text-sm font-medium">Pozivnica za recept</p>
      <h1 className="font-heading text-4xl tracking-tight">{recipe.title}</h1>
      <p className="text-muted-foreground">
        {recipe.servings} porcija · {recipe.ingredients.length} sastojaka ·{" "}
        {recipe.instructions.length} koraka
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          className="h-11 rounded-full px-4"
          onClick={() => {
            const next = already ? { ...recipe, id: newId(), createdAt: new Date().toISOString() } : recipe;
            upsertRecipe({ ...next, updatedAt: new Date().toISOString() });
            router.push(`/recept/${next.id}`);
          }}
        >
          Spremi u moju knjižnicu
        </Button>
        <Button variant="outline" className="h-11 rounded-full px-4" render={<Link href="/" />}>
          Ne sada
        </Button>
      </div>
    </div>
  );
}

export default function ImportPage() {
  return (
    <Suspense fallback={<p className="text-muted-foreground">Otvaram recept…</p>}>
      <ImportInner />
    </Suspense>
  );
}
