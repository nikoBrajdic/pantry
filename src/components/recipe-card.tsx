import Link from "next/link";
import { ClockIcon, WarningIcon } from "@phosphor-icons/react";
import { DIFFICULTY_OPTIONS, PACE_OPTIONS, tagLabel } from "@/lib/tags";
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
  const difficulty = DIFFICULTY_OPTIONS.find((item) => item.id === recipe.difficulty);
  const pace = PACE_OPTIONS.find((item) => item.id === recipe.pace);

  return (
    <Link href={`/recept/${recipe.id}`} className="block h-full">
      <Card className="h-full rounded-2xl bg-card ring-border transition-shadow hover:shadow-md">
        <div className="relative aspect-[16/10] overflow-hidden bg-[color-mix(in_oklch,var(--accent)_70%,var(--primary)_8%)]">
          {recipe.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={recipe.imageUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-end p-4">
              <span className="font-heading text-4xl text-primary/50">
                {recipe.title.slice(0, 1)}
              </span>
            </div>
          )}
          {recipe.nextDay ? (
            <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-[#f3e0b5] px-2 py-1 text-[11px] text-[#6b4a12]">
              <WarningIcon className="size-3.5" />
              Sljedeći dan
            </span>
          ) : null}
        </div>
        <CardContent className="flex flex-1 flex-col gap-3 pt-1">
          <div>
            <h2 className="font-heading text-xl leading-tight">{recipe.title}</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              {recipe.servings} {recipe.servings === 1 ? "porcija" : "porcije"}
              {recipe.sourceUrl ? " · s linka" : " · ručno"}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="secondary" className="rounded-full">
              {difficulty?.label}
            </Badge>
            <Badge variant="outline" className="rounded-full">
              <ClockIcon className="size-3" />
              {pace?.label}
            </Badge>
            {recipe.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="rounded-full">
                {tagLabel(tag)}
              </Badge>
            ))}
          </div>
          {extra}
        </CardContent>
      </Card>
    </Link>
  );
}
