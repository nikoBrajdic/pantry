"use client";

import { useState } from "react";
import { ImageIcon } from "@phosphor-icons/react";
import { useLocale } from "@/components/locale-provider";
import { DIFFICULTY_OPTIONS, PACE_OPTIONS } from "@/lib/tags";
import type { RecipeDraft } from "@/lib/draft";
import { difficultyMessageKey, paceMessageKey } from "@/lib/i18n";
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
  const { t } = useLocale();
  const [imageError, setImageError] = useState("");
  const set = <K extends keyof RecipeDraft>(key: K, value: RecipeDraft[K]) =>
    onChange({ ...draft, [key]: value });

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <Label htmlFor="title" className="text-sm">
          {t("form.name")}
        </Label>
        <Input
          id="title"
          value={draft.title}
          onChange={(event) => set("title", event.target.value)}
          placeholder={t("form.namePlaceholder")}
          className="h-11 rounded-xl text-base"
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="servings">{t("form.servings")}</Label>
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
            <Label htmlFor="source">{t("form.source")}</Label>
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
        <p className="text-sm font-medium">{t("form.photo")}</p>
        <p className="text-muted-foreground text-sm">{t("form.photoHint")}</p>
        <div className="overflow-hidden rounded-3xl border border-border bg-card">
          {draft.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={draft.imageUrl} alt="" className="h-52 w-full object-cover" />
          ) : (
            <div className="text-muted-foreground flex h-40 items-center justify-center gap-2">
              <ImageIcon className="size-5" />
              {t("form.noPhoto")}
            </div>
          )}
          <div className="flex flex-wrap gap-2 p-3">
            <label className="inline-flex cursor-pointer items-center rounded-full border border-border px-3 py-1.5 text-sm">
              {t("form.upload")}
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
                {t("form.removePhoto")}
              </button>
            ) : null}
          </div>
        </div>
        {imageError ? <p className="text-destructive text-sm">{imageError}</p> : null}
      </section>

      <section className="space-y-3">
        <p className="text-sm font-medium">{t("form.saveTo")}</p>
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
                {list === "keeper" ? t("form.keeper") : t("form.wishlist")}
              </span>
              <span className="text-muted-foreground text-xs">
                {list === "keeper" ? t("form.keeperHint") : t("form.wishlistHint")}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <Label htmlFor="ingredients" className="text-sm">
            {t("form.ingredients")}
          </Label>
          <p className="text-muted-foreground mt-1 text-sm">{t("form.ingredientsHint")}</p>
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
          {t("form.method")}
        </Label>
        <Textarea
          id="instructions"
          value={draft.instructionsText}
          onChange={(event) => set("instructionsText", event.target.value)}
          rows={8}
          className="min-h-40 rounded-xl text-base"
          placeholder={t("form.methodHint")}
        />
      </section>

      <section className="space-y-3">
        <div>
          <p className="text-sm font-medium">{t("form.tags")}</p>
          <p className="text-muted-foreground text-sm">{t("form.tagsHint")}</p>
        </div>
        <TagPicker value={draft.tags} onChange={(tags) => set("tags", tags)} />
      </section>

      {draft.nutrition &&
      Object.values(draft.nutrition).some((value) => value != null) ? (
        <section className="space-y-2 rounded-2xl border border-border bg-card p-4">
          <p className="text-sm font-medium">{t("form.nutritionFromSource")}</p>
          <p className="text-muted-foreground text-sm">{t("form.nutritionScaleHint")}</p>
          <ul className="text-muted-foreground grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
            {draft.nutrition.calories != null ? (
              <li>
                {draft.nutrition.calories} kcal · {t("nutrition.calories")}
              </li>
            ) : null}
            {draft.nutrition.proteinG != null ? (
              <li>
                {draft.nutrition.proteinG} g · {t("nutrition.protein")}
              </li>
            ) : null}
            {draft.nutrition.fatG != null ? (
              <li>
                {draft.nutrition.fatG} g · {t("nutrition.fat")}
              </li>
            ) : null}
            {draft.nutrition.carbsG != null ? (
              <li>
                {draft.nutrition.carbsG} g · {t("nutrition.carbs")}
              </li>
            ) : null}
            {draft.nutrition.fiberG != null ? (
              <li>
                {draft.nutrition.fiberG} g · {t("nutrition.fiber")}
              </li>
            ) : null}
            {draft.nutrition.sugarG != null ? (
              <li>
                {draft.nutrition.sugarG} g · {t("nutrition.sugar")}
              </li>
            ) : null}
            {draft.nutrition.sodiumMg != null ? (
              <li>
                {draft.nutrition.sodiumMg} mg · {t("nutrition.sodium")}
              </li>
            ) : null}
          </ul>
        </section>
      ) : null}

      <section className="grid gap-6 sm:grid-cols-2">
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">{t("form.difficulty")}</legend>
          <div className="grid gap-2">
            {DIFFICULTY_OPTIONS.map((option) => {
              const labelKey = difficultyMessageKey(option.id);
              const hintKey = difficultyMessageKey(option.id, "hint");
              return (
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
                  <span className="block text-sm font-medium">
                    {labelKey ? t(labelKey) : option.label}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {hintKey ? t(hintKey) : option.hint}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">{t("form.pace")}</legend>
          <div className="grid gap-2">
            {PACE_OPTIONS.map((option) => {
              const labelKey = paceMessageKey(option.id);
              const hintKey = paceMessageKey(option.id, "hint");
              return (
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
                  <span className="block text-sm font-medium">
                    {labelKey ? t(labelKey) : option.label}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {hintKey ? t(hintKey) : option.hint}
                  </span>
                </button>
              );
            })}
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
            <span className="block text-sm font-medium">{t("form.nextDay")}</span>
            <span className="text-muted-foreground text-sm">{t("form.nextDayHint")}</span>
          </span>
        </label>
        {draft.nextDay ? (
          <Textarea
            value={draft.nextDayNote}
            onChange={(event) => set("nextDayNote", event.target.value)}
            placeholder={t("form.nextDayPlaceholder")}
            className="rounded-xl text-base"
          />
        ) : null}
      </section>

      <section className="space-y-2">
        <Label htmlFor="notes">{t("form.notes")}</Label>
        <p className="text-muted-foreground text-sm">{t("form.notesHint")}</p>
        <Textarea
          id="notes"
          value={draft.notes}
          onChange={(event) => set("notes", event.target.value)}
          placeholder={t("form.notesPlaceholder")}
          className="rounded-xl text-base"
        />
      </section>
    </div>
  );
}
