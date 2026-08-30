"use client";

import { useState } from "react";
import { PlusIcon, XIcon } from "@phosphor-icons/react";
import { RECIPE_TAGS, tagLabel } from "@/lib/tags";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function slugifyTag(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function TagPicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [custom, setCustom] = useState("");

  const knownIds = new Set(RECIPE_TAGS.map((tag) => tag.id));
  const customSelected = value.filter((id) => !knownIds.has(id as (typeof RECIPE_TAGS)[number]["id"]));

  function addCustom() {
    const id = slugifyTag(custom);
    if (!id) return;
    if (!value.includes(id)) onChange([...value, id]);
    setCustom("");
    setAdding(false);
  }

  return (
    <div className="space-y-3">
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
        {customSelected.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => onChange(value.filter((item) => item !== id))}
            className="border-primary bg-primary text-primary-foreground inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm"
          >
            {tagLabel(id)}
            <XIcon className="size-3.5" />
          </button>
        ))}
      </div>

      {adding ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={custom}
            onChange={(event) => setCustom(event.target.value)}
            placeholder="e.g. meal-prep"
            className="h-10 rounded-xl text-base"
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addCustom();
              }
            }}
          />
          <div className="flex gap-2">
            <Button type="button" className="rounded-full" onClick={addCustom}>
              Add tag
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="rounded-full"
              onClick={() => {
                setAdding(false);
                setCustom("");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="rounded-full"
          onClick={() => setAdding(true)}
        >
          <PlusIcon />
          Add a tag
        </Button>
      )}
    </div>
  );
}
