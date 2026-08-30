"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useRecipes } from "@/components/recipe-provider";
import { Button } from "@/components/ui/button";
import { decodeRecipeShare } from "@/lib/share";
import { newId } from "@/lib/storage";

function ImportInner() {
  const params = useSearchParams();
  const router = useRouter();
  const { upsertRecipe, recipes } = useRecipes();
  const encoded = params.get("r");
  const recipe = encoded ? decodeRecipeShare(encoded) : null;
  const error = !encoded
    ? "This link has no recipe on it."
    : recipe
      ? ""
      : "This recipe link is not valid.";

  if (error) {
    return (
      <div className="space-y-3">
        <h1 className="font-heading text-3xl">The link did not work</h1>
        <p className="text-muted-foreground">{error}</p>
        <Button render={<Link href="/" />} className="rounded-full">
          Go to the library
        </Button>
      </div>
    );
  }

  if (!recipe) return <p className="text-muted-foreground">Opening recipe…</p>;

  const already = recipes.some((item) => item.id === recipe.id);

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <p className="text-primary text-sm font-medium">Recipe invite</p>
      <h1 className="font-heading text-4xl tracking-tight">{recipe.title}</h1>
      <p className="text-muted-foreground">
        {recipe.servings} servings · {recipe.ingredients.length} ingredients ·{" "}
        {recipe.instructions.length} steps
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
          Save to my library
        </Button>
        <Button variant="outline" className="h-11 rounded-full px-4" render={<Link href="/" />}>
          Not now
        </Button>
      </div>
    </div>
  );
}

export default function ImportPage() {
  return (
    <Suspense fallback={<p className="text-muted-foreground">Opening recipe…</p>}>
      <ImportInner />
    </Suspense>
  );
}
