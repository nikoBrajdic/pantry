"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  ClockIcon,
  FireIcon,
  LinkSimpleIcon,
  PencilSimpleIcon,
  ShareNetworkIcon,
  TrashIcon,
  WarningIcon,
} from "@phosphor-icons/react";
import { CookChecklist } from "@/components/cook-checklist";
import { RecipeScaler, useRecipeScale } from "@/components/recipe-scaler";
import { useRecipes } from "@/components/recipe-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DIFFICULTY_OPTIONS, PACE_OPTIONS, tagLabel } from "@/lib/tags";
import { shareUrlFor } from "@/lib/share";

export default function RecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { recipes, ready, removeRecipe, markCooked, moveToList, upsertRecipe } = useRecipes();
  const recipe = recipes.find((item) => item.id === id);
  const [copied, setCopied] = useState("");
  const [noteDraft, setNoteDraft] = useState<string | null>(null);

  if (!ready) return <p className="text-muted-foreground">Loading recipe…</p>;

  if (!recipe) {
    return (
      <div className="space-y-4">
        <h1 className="font-heading text-3xl">This recipe is not in your library</h1>
        <Button render={<Link href="/" />} className="rounded-full">
          Back to the library
        </Button>
      </div>
    );
  }

  return <RecipeBody
    recipe={recipe}
    copied={copied}
    setCopied={setCopied}
    noteDraft={noteDraft}
    setNoteDraft={setNoteDraft}
    onDelete={() => {
      removeRecipe(recipe.id);
      router.push("/");
    }}
    onCooked={() => markCooked(recipe.id)}
    onMove={(list) => moveToList(recipe.id, list)}
    onSaveNote={(notes) => {
      upsertRecipe({ ...recipe, notes, updatedAt: new Date().toISOString() });
      setNoteDraft(null);
    }}
  />;
}

function RecipeBody({
  recipe,
  copied,
  setCopied,
  noteDraft,
  setNoteDraft,
  onDelete,
  onCooked,
  onMove,
  onSaveNote,
}: {
  recipe: NonNullable<ReturnType<typeof useRecipes>["recipes"][number]>;
  copied: string;
  setCopied: (value: string) => void;
  noteDraft: string | null;
  setNoteDraft: (value: string | null) => void;
  onDelete: () => void;
  onCooked: () => number;
  onMove: (list: "keeper" | "wishlist") => void;
  onSaveNote: (notes: string) => void;
}) {
  const scale = useRecipeScale(recipe);
  const difficulty = DIFFICULTY_OPTIONS.find((item) => item.id === recipe.difficulty);
  const pace = PACE_OPTIONS.find((item) => item.id === recipe.pace);
  const notesValue = noteDraft ?? recipe.notes ?? "";

  async function copyShare() {
    const url = shareUrlFor(recipe, window.location.origin);
    await navigator.clipboard.writeText(url);
    setCopied("Recipe link copied. Your partner can open it and save it.");
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1.05fr_0.95fr]">
      <div className="space-y-5">
        <Button variant="ghost" render={<Link href="/" />} className="rounded-full px-2">
          <ArrowLeftIcon />
          Library
        </Button>

        <div className="overflow-hidden rounded-3xl border border-border bg-card">
          {recipe.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={recipe.imageUrl} alt="" className="h-56 w-full object-cover sm:h-72" />
          ) : null}
          <div className="space-y-4 p-5 sm:p-6">
            <div>
              <div className="mb-2 flex flex-wrap gap-2">
                <Badge className="rounded-full">
                  {recipe.list === "keeper" ? "Keeper" : "Wishlist"}
                </Badge>
                {recipe.timesCooked > 0 ? (
                  <Badge variant="secondary" className="rounded-full">
                    <FireIcon className="size-3" />
                    Cooked {recipe.timesCooked} {recipe.timesCooked === 1 ? "time" : "times"}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="rounded-full">
                    Not cooked yet
                  </Badge>
                )}
              </div>
              <h1 className="font-heading text-4xl tracking-tight">{recipe.title}</h1>
              <p className="text-muted-foreground mt-2 text-sm">
                Written for {recipe.servings} {recipe.servings === 1 ? "serving" : "servings"}
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
                Open the original
              </a>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="rounded-full"
                render={<Link href={`/recipe/${recipe.id}/edit`} />}
              >
                <PencilSimpleIcon />
                Edit
              </Button>
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => onMove(recipe.list === "keeper" ? "wishlist" : "keeper")}
              >
                Move to {recipe.list === "keeper" ? "wishlist" : "keepers"}
              </Button>
              <Button variant="outline" className="rounded-full" onClick={() => void copyShare()}>
                <ShareNetworkIcon />
                Send recipe
              </Button>
              <Button variant="destructive" className="rounded-full" onClick={onDelete}>
                <TrashIcon />
                Delete
              </Button>
            </div>
            {copied ? <p className="text-sm text-primary">{copied}</p> : null}
          </div>
        </div>

        {recipe.nextDay ? (
          <Alert className="rounded-2xl border-[#e4c56d] bg-[#f8efd2]">
            <WarningIcon className="text-[#6b4a12]" />
            <AlertTitle className="text-[#6b4a12]">Best the next day</AlertTitle>
            <AlertDescription className="text-[#6b4a12]/80">
              {recipe.nextDayNote ||
                "This one needs chilling, resting, or a long prep — do not plan it for tonight."}
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="rounded-3xl border border-border bg-card p-5">
          <h2 className="font-heading text-xl">What I changed</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            The differences from the original — so next time you remember.
          </p>
          <Textarea
            value={notesValue}
            onChange={(event) => setNoteDraft(event.target.value)}
            placeholder="Used oat milk. Extra lemon. Skipped the sugar."
            className="mt-3 rounded-xl text-base"
          />
          <Button
            className="mt-3 rounded-full"
            disabled={noteDraft == null || noteDraft === (recipe.notes ?? "")}
            onClick={() => onSaveNote(notesValue)}
          >
            Save note
          </Button>
        </div>
      </div>

      <div className="space-y-5">
        <RecipeScaler recipe={recipe} scale={scale} />
        <CookChecklist recipe={recipe} factor={scale.factor} onCooked={onCooked} />
      </div>
    </div>
  );
}
