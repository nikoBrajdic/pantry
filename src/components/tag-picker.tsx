"use client";

import { RECIPE_TAGS } from "@/lib/tags";
import { cn } from "@/lib/utils";

export function TagPicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {RECIPE_TAGS.map((tag) => {
        const selected = value.includes(tag.id);
        return (
          <button
            key={tag.id}
            type="button"
            onClick={() =>
              onChange(
                selected ? value.filter((id) => id !== tag.id) : [...value, tag.id],
              )
            }
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm transition-colors",
              selected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground hover:border-primary/40",
            )}
          >
            {tag.label}
          </button>
        );
      })}
    </div>
  );
}
