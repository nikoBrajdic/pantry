import { formatAmount } from "@/lib/ingredients";
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
  const scaled = scaleNutrition(nutrition, factor);
  if (!scaled) return null;

  const rows: { label: string; value?: number; unit: string }[] = [
    { label: "Calories", value: scaled.calories, unit: "kcal" },
    { label: "Protein", value: scaled.proteinG, unit: "g" },
    { label: "Fat", value: scaled.fatG, unit: "g" },
    { label: "Carbs", value: scaled.carbsG, unit: "g" },
    { label: "Fiber", value: scaled.fiberG, unit: "g" },
    { label: "Sugar", value: scaled.sugarG, unit: "g" },
    { label: "Sodium", value: scaled.sodiumMg, unit: "mg" },
  ].filter((row) => row.value != null);

  if (rows.length === 0) return null;

  return (
    <section className="rounded-3xl border border-border bg-card p-4 sm:p-5">
      <p className="text-sm font-medium">Macronutrients</p>
      <p className="text-muted-foreground mt-1 text-sm">
        For {formatAmount(shownServings)} servings (recipe written for {baseServings}).
      </p>
      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {rows.map((row) => (
          <div key={row.label} className="rounded-2xl border border-border/80 px-3 py-2.5">
            <dt className="text-muted-foreground text-xs">{row.label}</dt>
            <dd className="font-numeric text-xl tracking-tight">
              {formatAmount(row.value!)}
              <span className="text-muted-foreground ml-1 text-xs font-sans">{row.unit}</span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
