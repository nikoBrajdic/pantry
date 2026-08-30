"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LinkSimpleIcon, NotePencilIcon } from "@phosphor-icons/react";
import { RecipeForm } from "@/components/recipe-form";
import { useRecipes } from "@/components/recipe-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { draftFromExtracted, emptyDraft, recipeFromDraft, type RecipeDraft } from "@/lib/draft";
import type { ExtractedRecipe } from "@/lib/types";

export default function AddRecipePage() {
  const router = useRouter();
  const { upsertRecipe } = useRecipes();
  const [url, setUrl] = useState("");
  const [draft, setDraft] = useState<RecipeDraft | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function extract() {
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = (await response.json()) as {
        recipe?: ExtractedRecipe;
        error?: string;
      };
      if (!response.ok || !data.recipe) {
        throw new Error(data.error ?? "Recept se nije mogao izvući.");
      }
      setDraft(draftFromExtracted(data.recipe));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nešto je pošlo po zlu.");
    } finally {
      setLoading(false);
    }
  }

  function save() {
    if (!draft) return;
    const recipe = recipeFromDraft(draft);
    if (recipe.ingredients.length === 0) {
      setError("Dodaj barem jedan sastojak.");
      return;
    }
    upsertRecipe(recipe);
    router.push(`/recept/${recipe.id}`);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-primary text-sm font-medium">Novi recept</p>
        <h1 className="font-heading text-4xl tracking-tight">Zalijepi link</h1>
        <p className="text-muted-foreground mt-2 text-base">
          Aplikacija pokušava sama izvući sastojke, broj porcija i upute. Ako
          stranica ne da podatke, unesi recept ručno — traje minutu.
        </p>
      </div>

      <form
        className="rounded-3xl border border-border bg-card p-4 sm:p-5"
        onSubmit={(event) => {
          event.preventDefault();
          void extract();
        }}
      >
        <label htmlFor="url" className="text-sm font-medium">
          Link recepta
        </label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <Input
            id="url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://…"
            className="h-11 rounded-xl text-base"
          />
          <Button type="submit" disabled={loading || !url.trim()} className="h-11 rounded-xl px-4 text-sm">
            <LinkSimpleIcon />
            {loading ? "Čitam stranicu…" : "Izvuci recept"}
          </Button>
        </div>
        <Button
          type="button"
          variant="ghost"
          className="mt-2 rounded-xl"
          onClick={() => {
            setDraft(emptyDraft());
            setError("");
          }}
        >
          <NotePencilIcon />
          Unesi ručno
        </Button>
      </form>

      {error ? (
        <Alert variant="destructive" className="rounded-2xl">
          <AlertTitle>Nisam uspjela izvući recept</AlertTitle>
          <AlertDescription>
            {error} Možeš ispraviti link ili nastaviti ručno.
          </AlertDescription>
        </Alert>
      ) : null}

      {draft ? (
        <div className="space-y-5">
          <RecipeForm draft={draft} onChange={setDraft} />
          <div className="flex flex-wrap gap-2">
            <Button onClick={save} className="h-11 rounded-full px-5 text-sm">
              Spremi u knjižnicu
            </Button>
            <Button
              variant="outline"
              className="h-11 rounded-full px-5 text-sm"
              onClick={() => setDraft(null)}
            >
              Odustani
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
