"use client";

import Link from "next/link";
import { ClockIcon, FireIcon, WarningIcon } from "@phosphor-icons/react";
import { useLocale } from "@/components/locale-provider";
import { DIFFICULTY_OPTIONS, PACE_OPTIONS, formatTagDisplay } from "@/lib/tags";
import {
  difficultyMessageKey,
  paceMessageKey,
  tagMessageKey,
} from "@/lib/i18n";
import type { Recipe } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export function RecipeCard({
  recipe,
  extra,
}: {
  recipe: Recipe;
  extra?: React.ReactNode;
}) {
  const { t } = useLocale();
  const difficulty = DIFFICULTY_OPTIONS.find((item) => item.id === recipe.difficulty);
  const pace = PACE_OPTIONS.find((item) => item.id === recipe.pace);
  const difficultyKey = difficulty ? difficultyMessageKey(difficulty.id) : null;
  const paceKey = pace ? paceMessageKey(pace.id) : null;

  return (
    <Link href={`/recipe/${recipe.id}`} className="block h-full">
      <Card className="h-full gap-0 rounded-2xl bg-card pt-0 ring-border transition-shadow hover:shadow-md">
        <div className="relative aspect-[16/10] overflow-hidden rounded-t-2xl bg-[color-mix(in_oklch,var(--accent)_70%,var(--primary)_8%)]">
          {recipe.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={recipe.imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-end p-4">
              <span className="font-heading text-4xl text-primary/50">
                {recipe.title.slice(0, 1)}
              </span>
            </div>
          )}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-card/90 px-2 py-1 text-[11px] text-foreground ring-1 ring-border/60">
              {recipe.list === "keeper" ? t("card.keeper") : t("card.wishlist")}
            </span>
            {recipe.timesCooked > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-1 text-[11px] text-primary-foreground">
                <FireIcon className="size-3" />
                {recipe.timesCooked}×
              </span>
            ) : null}
          </div>
          {recipe.nextDay ? (
            <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-1 text-[11px] text-secondary-foreground ring-1 ring-border/50">
              <WarningIcon className="size-3.5" />
              {t("card.nextDay")}
            </span>
          ) : null}
        </div>
        <CardContent className="flex flex-1 flex-col gap-3 py-(--card-spacing)">
          <div>
            <h2 className="font-heading text-xl font-bold leading-tight">{recipe.title}</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              {recipe.servings}{" "}
              {recipe.servings === 1 ? t("card.serving") : t("card.servings")}
              {" · "}
              {recipe.sourceUrl ? t("card.fromLink") : t("card.byHand")}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="secondary" className="rounded-full">
              {difficultyKey ? t(difficultyKey) : difficulty?.label}
            </Badge>
            <Badge variant="outline" className="rounded-full">
              <ClockIcon className="size-3" />
              {paceKey ? t(paceKey) : pace?.label}
            </Badge>
            {recipe.tags.map((tag) => {
              const key = tagMessageKey(tag);
              return (
                <Badge
                  key={tag}
                  variant="outline"
                  className="rounded-full leading-none"
                >
                  {key ? t(key) : formatTagDisplay(tag)}
                </Badge>
              );
            })}
          </div>
          {extra}
        </CardContent>
      </Card>
    </Link>
  );
}
