"use client";

import { useState } from "react";
import { ImageIcon } from "@phosphor-icons/react";
import { DIFFICULTY_OPTIONS, PACE_OPTIONS } from "@/lib/tags";
import type { RecipeDraft } from "@/lib/draft";
import { readImageFile } from "@/lib/read-image";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TagPicker } from "./tag-picker";

export function RecipeForm({
  draft,
  onChange,
}: {
  draft: RecipeDraft;
  onChange: (next: RecipeDraft) => void;
}) {
  const [imageError, setImageError] = useState("");
  const set = <K extends keyof RecipeDraft>(key: K, value: RecipeDraft[K]) =>
    onChange({ ...draft, [key]: value });

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <Label htmlFor="title" className="text-sm">
          Recipe name
        </Label>
        <Input
          id="title"
          value={draft.title}
          onChange={(event) => set("title", event.target.value)}
          placeholder="e.g. Roast chicken"
          className="h-11 rounded-xl text-base"
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="servings">Servings in the original</Label>
            <Input
              id="servings"
              type="number"
              min={1}
              value={draft.servings}
              onChange={(event) => set("servings", Number(event.target.value))}
              className="h-11 rounded-xl text-base"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="source">Source link (optional)</Label>
            <Input
              id="source"
              value={draft.sourceUrl}
              onChange={(event) => set("sourceUrl", event.target.value)}
              placeholder="https://"
              className="h-11 rounded-xl text-base"
            />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-sm font-medium">Photo</p>
        <p className="text-muted-foreground text-sm">
          Pulled from the link when possible. You can replace it with your own.
        </p>
        <div className="overflow-hidden rounded-3xl border border-border bg-card">
          {draft.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={draft.imageUrl} alt="" className="h-52 w-full object-cover" />
          ) : (
            <div className="text-muted-foreground flex h-40 items-center justify-center gap-2">
              <ImageIcon className="size-5" />
              No photo yet
            </div>
          )}
          <div className="flex flex-wrap gap-2 p-3">
            <label className="inline-flex cursor-pointer items-center rounded-full border border-border px-3 py-1.5 text-sm">
              Upload a photo
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  void readImageFile(file)
                    .then((url) => {
                      setImageError("");
                      set("imageUrl", url);
                    })
                    .catch((error: unknown) => {
                      setImageError(error instanceof Error ? error.message : "Upload failed.");
                    });
                }}
              />
            </label>
            {draft.imageUrl ? (
              <button
                type="button"
                className="rounded-full px-3 py-1.5 text-sm text-destructive"
                onClick={() => set("imageUrl", "")}
              >
                Remove photo
              </button>
            ) : null}
          </div>
        </div>
        {imageError ? <p className="text-destructive text-sm">{imageError}</p> : null}
      </section>

      <section className="space-y-3">
        <p className="text-sm font-medium">Save to</p>
        <div className="grid grid-cols-2 gap-2">
          {(["keeper", "wishlist"] as const).map((list) => (
            <button
              key={list}
              type="button"
              onClick={() => set("list", list)}
              className={cn(
                "rounded-2xl border px-3 py-2.5 text-left",
                draft.list === list ? "border-primary bg-primary/8" : "border-border bg-card",
              )}
            >
              <span className="block text-sm font-medium">
                {list === "keeper" ? "Keepers" : "Wishlist"}
              </span>
              <span className="text-muted-foreground text-xs">
                {list === "keeper"
                  ? "We make this. It stays."
                  : "Want to try this later."}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <Label htmlFor="ingredients" className="text-sm">
            Ingredients
          </Label>
          <p className="text-muted-foreground mt-1 text-sm">
            One ingredient per line, with the amount. e.g. <em>200 g flour</em>
          </p>
        </div>
        <Textarea
          id="ingredients"
          value={draft.ingredientsText}
          onChange={(event) => set("ingredientsText", event.target.value)}
          rows={8}
          className="min-h-40 rounded-xl text-base"
        />
      </section>

      <section className="space-y-3">
        <Label htmlFor="instructions" className="text-sm">
          Method
        </Label>
        <Textarea
          id="instructions"
          value={draft.instructionsText}
          onChange={(event) => set("instructionsText", event.target.value)}
          rows={8}
          className="min-h-40 rounded-xl text-base"
          placeholder="One step per line."
        />
      </section>

      <section className="space-y-3">
        <div>
          <p className="text-sm font-medium">Tags</p>
          <p className="text-muted-foreground text-sm">
            Tap everything that fits — or add your own if none apply.
          </p>
        </div>
        <TagPicker value={draft.tags} onChange={(tags) => set("tags", tags)} />
      </section>

      {draft.nutrition &&
      Object.values(draft.nutrition).some((value) => value != null) ? (
        <section className="space-y-2 rounded-2xl border border-border bg-card p-4">
          <p className="text-sm font-medium">Macronutrients from the source</p>
          <p className="text-muted-foreground text-sm">
            Saved with the recipe and scaled when you change servings.
          </p>
          <ul className="text-muted-foreground grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
            {draft.nutrition.calories != null ? (
              <li>{draft.nutrition.calories} kcal</li>
            ) : null}
            {draft.nutrition.proteinG != null ? (
              <li>{draft.nutrition.proteinG} g protein</li>
            ) : null}
            {draft.nutrition.fatG != null ? <li>{draft.nutrition.fatG} g fat</li> : null}
            {draft.nutrition.carbsG != null ? (
              <li>{draft.nutrition.carbsG} g carbs</li>
            ) : null}
            {draft.nutrition.fiberG != null ? (
              <li>{draft.nutrition.fiberG} g fiber</li>
            ) : null}
            {draft.nutrition.sugarG != null ? (
              <li>{draft.nutrition.sugarG} g sugar</li>
            ) : null}
            {draft.nutrition.sodiumMg != null ? (
              <li>{draft.nutrition.sodiumMg} mg sodium</li>
            ) : null}
          </ul>
        </section>
      ) : null}

      <section className="grid gap-6 sm:grid-cols-2">
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Difficulty</legend>
          <div className="grid gap-2">
            {DIFFICULTY_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => set("difficulty", option.id)}
                className={cn(
                  "rounded-2xl border px-3 py-2.5 text-left",
                  draft.difficulty === option.id
                    ? "border-primary bg-primary/8"
                    : "border-border bg-card",
                )}
              >
                <span className="block text-sm font-medium">{option.label}</span>
                <span className="text-muted-foreground text-xs">{option.hint}</span>
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Pace</legend>
          <div className="grid gap-2">
            {PACE_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => set("pace", option.id)}
                className={cn(
                  "rounded-2xl border px-3 py-2.5 text-left",
                  draft.pace === option.id
                    ? "border-primary bg-primary/8"
                    : "border-border bg-card",
                )}
              >
                <span className="block text-sm font-medium">{option.label}</span>
                <span className="text-muted-foreground text-xs">{option.hint}</span>
              </button>
            ))}
          </div>
        </fieldset>
      </section>

      <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
        <label className="flex items-start gap-3">
          <Checkbox
            checked={draft.nextDay}
            onCheckedChange={(checked) => set("nextDay", Boolean(checked))}
            className="mt-0.5 rounded-md"
          />
          <span>
            <span className="block text-sm font-medium">Best the next day</span>
            <span className="text-muted-foreground text-sm">
              Mark this if it needs a long chill, a rest, or should not be eaten the same day.
            </span>
          </span>
        </label>
        {draft.nextDay ? (
          <Textarea
            value={draft.nextDayNote}
            onChange={(event) => set("nextDayNote", event.target.value)}
            placeholder="e.g. Must sit in the fridge overnight."
            className="rounded-xl text-base"
          />
        ) : null}
      </section>

      <section className="space-y-2">
        <Label htmlFor="notes">What I changed</Label>
        <p className="text-muted-foreground text-sm">
          The tweaks you made while cooking — swaps, extra lemon, less salt.
        </p>
        <Textarea
          id="notes"
          value={draft.notes}
          onChange={(event) => set("notes", event.target.value)}
          placeholder="I used oat milk. Added more garlic. Skipped the sugar."
          className="rounded-xl text-base"
        />
      </section>
    </div>
  );
}
