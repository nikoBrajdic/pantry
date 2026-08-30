"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  ClockIcon,
  LinkSimpleIcon,
  PencilSimpleIcon,
  ShareNetworkIcon,
  TrashIcon,
  WarningIcon,
} from "@phosphor-icons/react";
import { RecipeScaler } from "@/components/recipe-scaler";
import { useRecipes } from "@/components/recipe-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DIFFICULTY_OPTIONS, PACE_OPTIONS, tagLabel } from "@/lib/tags";
import { shareUrlFor } from "@/lib/share";

export default function RecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { recipes, ready, removeRecipe } = useRecipes();
  const recipe = recipes.find((item) => item.id === id);
  const [copied, setCopied] = useState("");

  if (!ready) return <p className="text-muted-foreground">Učitavam recept…</p>;

  if (!recipe) {
    return (
      <div className="space-y-4">
        <h1 className="font-heading text-3xl">Recept nije u knjižnici</h1>
        <Button render={<Link href="/" />} className="rounded-full">
          Natrag na knjižnicu
        </Button>
      </div>
    );
  }

  const current = recipe;
  const difficulty = DIFFICULTY_OPTIONS.find((item) => item.id === current.difficulty);
  const pace = PACE_OPTIONS.find((item) => item.id === current.pace);

  async function copyShare() {
    const url = shareUrlFor(current, window.location.origin);
    await navigator.clipboard.writeText(url);
    setCopied("Link recepta je u međuspremniku. Partner ga otvori i spremi kod sebe.");
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-5">
        <Button variant="ghost" render={<Link href="/" />} className="rounded-full px-2">
          <ArrowLeftIcon />
          Knjižnica
        </Button>

        <div className="overflow-hidden rounded-3xl border border-border bg-card">
          {recipe.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={recipe.imageUrl} alt="" className="h-56 w-full object-cover sm:h-72" />
          ) : null}
          <div className="space-y-4 p-5 sm:p-6">
            <div>
              <h1 className="font-heading text-4xl tracking-tight">{recipe.title}</h1>
              <p className="text-muted-foreground mt-2 text-sm">
                Original za {recipe.servings} {recipe.servings === 1 ? "porciju" : "porcije"}
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Badge className="rounded-full">{difficulty?.label}</Badge>
              <Badge variant="secondary" className="rounded-full">
                <ClockIcon className="size-3" />
                {pace?.label}
              </Badge>
              {recipe.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="rounded-full">
                  {tagLabel(tag)}
                </Badge>
              ))}
            </div>
            {recipe.sourceUrl ? (
              <a
                href={recipe.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="text-primary inline-flex items-center gap-1.5 text-sm underline-offset-4 hover:underline"
              >
                <LinkSimpleIcon className="size-4" />
                Otvori izvorni recept
              </a>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="rounded-full"
                render={<Link href={`/recept/${recipe.id}/uredi`} />}
              >
                <PencilSimpleIcon />
                Uredi
              </Button>
              <Button variant="outline" className="rounded-full" onClick={() => void copyShare()}>
                <ShareNetworkIcon />
                Pošalji recept
              </Button>
              <Button
                variant="destructive"
                className="rounded-full"
                onClick={() => {
                  removeRecipe(recipe.id);
                  router.push("/");
                }}
              >
                <TrashIcon />
                Obriši
              </Button>
            </div>
            {copied ? <p className="text-sm text-primary">{copied}</p> : null}
          </div>
        </div>

        {recipe.nextDay ? (
          <Alert className="rounded-2xl border-[#e4c56d] bg-[#f8efd2]">
            <WarningIcon className="text-[#6b4a12]" />
            <AlertTitle className="text-[#6b4a12]">Najbolje sljedeći dan</AlertTitle>
            <AlertDescription className="text-[#6b4a12]/80">
              {recipe.nextDayNote ||
                "Ovaj recept treba hlađenje, odležavanje ili dugu pripremu — ne planiraj ga za večeras."}
            </AlertDescription>
          </Alert>
        ) : null}

        {recipe.notes ? (
          <div className="rounded-3xl border border-border bg-card p-5">
            <h2 className="font-heading text-xl">Bilješke</h2>
            <p className="mt-2 whitespace-pre-wrap text-base">{recipe.notes}</p>
          </div>
        ) : null}

        <section className="rounded-3xl border border-border bg-card p-5 sm:p-6">
          <h2 className="font-heading text-2xl">Upute</h2>
          {recipe.instructions.length === 0 ? (
            <p className="text-muted-foreground mt-3">Nema spremljenih koraka.</p>
          ) : (
            <ol className="mt-4 space-y-4">
              {recipe.instructions.map((step, index) => (
                <li key={index} className="flex gap-3">
                  <span className="bg-secondary text-secondary-foreground grid size-7 shrink-0 place-items-center rounded-full text-sm font-medium">
                    {index + 1}
                  </span>
                  <p className="pt-0.5 text-base leading-relaxed">{step}</p>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <RecipeScaler recipe={recipe} />
    </div>
  );
}
