"use client";

import { DIFFICULTY_OPTIONS, PACE_OPTIONS } from "@/lib/tags";
import type { RecipeDraft } from "@/lib/draft";
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
  const set = <K extends keyof RecipeDraft>(key: K, value: RecipeDraft[K]) =>
    onChange({ ...draft, [key]: value });

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <Label htmlFor="title" className="text-sm">
          Naziv recepta
        </Label>
        <Input
          id="title"
          value={draft.title}
          onChange={(event) => set("title", event.target.value)}
          placeholder="npr. Piletina iz pećnice"
          className="h-11 rounded-xl text-base"
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="servings">Za koliko porcija je recept</Label>
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
            <Label htmlFor="source">Izvorni link (nije obavezno)</Label>
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
        <div>
          <Label htmlFor="ingredients" className="text-sm">
            Sastojci
          </Label>
          <p className="text-muted-foreground mt-1 text-sm">
            Jedan sastojak po retku, s količinom. Npr. <em>200 g brašna</em>
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
          Upute
        </Label>
        <Textarea
          id="instructions"
          value={draft.instructionsText}
          onChange={(event) => set("instructionsText", event.target.value)}
          rows={8}
          className="min-h-40 rounded-xl text-base"
          placeholder="Svaki korak u novi red."
        />
      </section>

      <section className="space-y-3">
        <div>
          <p className="text-sm font-medium">Tagovi</p>
          <p className="text-muted-foreground text-sm">
            Poklikaj sve što odgovara — meso, obrok, slastice…
          </p>
        </div>
        <TagPicker value={draft.tags} onChange={(tags) => set("tags", tags)} />
      </section>

      <section className="grid gap-6 sm:grid-cols-2">
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Težina</legend>
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
          <legend className="text-sm font-medium">Trajanje</legend>
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
            <span className="block text-sm font-medium">
              Najbolje sljedeći dan
            </span>
            <span className="text-muted-foreground text-sm">
              Označi ako se mora dugo hladiti, odležati ili nije za jelo isti dan.
            </span>
          </span>
        </label>
        {draft.nextDay ? (
          <Textarea
            value={draft.nextDayNote}
            onChange={(event) => set("nextDayNote", event.target.value)}
            placeholder="npr. Mora stajati u hladnjaku preko noći."
            className="rounded-xl text-base"
          />
        ) : null}
      </section>

      <section className="space-y-2">
        <Label htmlFor="notes">Tvoje bilješke</Label>
        <Textarea
          id="notes"
          value={draft.notes}
          onChange={(event) => set("notes", event.target.value)}
          placeholder="Što si promijenila, što partner voli, zamjene…"
          className="rounded-xl text-base"
        />
      </section>
    </div>
  );
}
