"use client";

import { useLocale } from "@/components/locale-provider";
import { formatAmount } from "@/lib/ingredients";
import type { MessageKey } from "@/lib/i18n";
import { scaleNutrition } from "@/lib/normalize";
import type { Nutrition } from "@/lib/types";

export function NutritionPanel({
  nutrition,
  factor,
  baseServings,
  shownServings,
}: {
  nutrition?: Nutrition;
  factor: number;
  baseServings: number;
  shownServings: number;
}) {
  const { t } = useLocale();
  const scaled = scaleNutrition(nutrition, factor);
  if (!scaled) return null;

  const allRows: { key: MessageKey; value?: number; unit: string }[] = [
    { key: "nutrition.calories", value: scaled.calories, unit: "kcal" },
    { key: "nutrition.protein", value: scaled.proteinG, unit: "g" },
    { key: "nutrition.fat", value: scaled.fatG, unit: "g" },
    { key: "nutrition.carbs", value: scaled.carbsG, unit: "g" },
    { key: "nutrition.fiber", value: scaled.fiberG, unit: "g" },
    { key: "nutrition.sugar", value: scaled.sugarG, unit: "g" },
    { key: "nutrition.sodium", value: scaled.sodiumMg, unit: "mg" },
  ];
  const rows = allRows.filter(
    (row): row is { key: MessageKey; value: number; unit: string } => row.value != null,
  );

  if (rows.length === 0) return null;

  return (
    <section className="rounded-3xl border border-border bg-card p-4 sm:p-5">
      <p className="text-sm font-medium">{t("nutrition.title")}</p>
      <p className="text-muted-foreground mt-1 text-sm">
        {t("nutrition.blurb", {
          shown: formatAmount(shownServings),
          base: baseServings,
        })}
      </p>
      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {rows.map((row) => (
          <div key={row.key} className="rounded-2xl border border-border/80 px-3 py-2.5">
            <dt className="text-muted-foreground text-xs">{t(row.key)}</dt>
            <dd className="font-numeric text-xl tracking-tight">
              {formatAmount(row.value)}
              <span className="text-muted-foreground ml-1 text-xs font-sans">{row.unit}</span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
