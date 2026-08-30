"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { RecipeCard } from "@/components/recipe-card";
import { useRecipes } from "@/components/recipe-provider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { matchRecipes, parsePantry } from "@/lib/match";

export default function KitchenPage() {
  const { recipes, ready } = useRecipes();
  const [pantry, setPantry] = useState("");
  const [submitted, setSubmitted] = useState("");

  const matches = useMemo(
    () => matchRecipes(recipes, parsePantry(submitted)),
    [recipes, submitted],
  );

  if (!ready) return <p className="text-muted-foreground">Loading your library…</p>;

  return (
    <div className="space-y-6">
      <div className="max-w-2xl">
        <p className="text-primary text-sm font-medium">Fridge and cupboard</p>
        <h1 className="font-heading text-4xl tracking-tight">What do I have?</h1>
        <p className="text-muted-foreground mt-2 text-base">
          Type what is in the house — chicken, eggs, flour, tomatoes… The app ranks
          saved recipes by how well they fit.
        </p>
      </div>

      <form
        className="max-w-2xl space-y-3 rounded-3xl border border-border bg-card p-4 sm:p-5"
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(pantry);
        }}
      >
        <label htmlFor="pantry" className="text-sm font-medium">
          Ingredients you have
        </label>
        <Textarea
          id="pantry"
          value={pantry}
          onChange={(event) => setPantry(event.target.value)}
          placeholder="chicken, peppers, eggs, flour, milk"
          className="min-h-28 rounded-xl text-base"
        />
        <Button type="submit" className="h-11 rounded-full px-4 text-sm">
          Find recipes
        </Button>
      </form>

      {!submitted ? (
        <p className="text-muted-foreground max-w-xl text-sm">
          Example: <em>chicken, peppers, onion, eggs, flour</em>
        </p>
      ) : matches.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card/70 px-6 py-12 text-center">
          <h2 className="font-heading text-2xl">No saved recipe quite fits</h2>
          <p className="text-muted-foreground mx-auto mt-2 max-w-md">
            Add more recipes or widen the list. This only searches what is already
            in your library.
          </p>
          <Button render={<Link href="/add" />} className="mt-4 rounded-full">
            Add a recipe
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {matches.map((match) => (
            <RecipeCard
              key={match.recipe.id}
              recipe={match.recipe}
              extra={
                <div className="space-y-1 text-sm">
                  <p className="font-medium text-primary">
                    {Math.round(match.score * 100)}% match · you have {match.matched.length} of{" "}
                    {match.recipe.ingredients.length}
                  </p>
                  {match.missing.length > 0 ? (
                    <p className="text-muted-foreground">
                      Missing: {match.missing.slice(0, 4).join(", ")}
                      {match.missing.length > 4 ? "…" : ""}
                    </p>
                  ) : (
                    <p className="text-muted-foreground">You have everything.</p>
                  )}
                </div>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
