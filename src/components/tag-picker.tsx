"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { MagnifyingGlassIcon, PlusIcon, XIcon } from "@phosphor-icons/react";
import { useLocale } from "@/components/locale-provider";
import { useRecipes } from "@/components/recipe-provider";
import { RECIPE_TAGS } from "@/lib/tags";
import {
  exactTagMatch,
  normalizeTagLabel,
  normalizeTagSlug,
  suggestTags,
  type ShelfTag,
} from "@/lib/tag-normalize";
import type { MessageKey } from "@/lib/i18n";
import { tagMessageKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

function displayLabel(
  tag: ShelfTag,
  t: (key: MessageKey, values?: Record<string, string | number>) => string,
) {
  const key = tagMessageKey(tag.id);
  return key ? t(key) : tag.label || tag.id;
}

export function TagPicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const { t } = useLocale();
  const { household } = useRecipes();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [catalog, setCatalog] = useState<ShelfTag[]>(
    RECIPE_TAGS.map((tag) => ({ id: tag.id, label: tag.label })),
  );
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/tags");
        const data = (await response.json()) as { tags?: ShelfTag[] };
        if (cancelled || !response.ok || !data.tags) return;
        setCatalog(data.tags);
      } catch {
        // keep builtins
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [household, value.join("|")]);

  const selected = useMemo(() => {
    const byId = new Map(catalog.map((tag) => [tag.id, tag]));
    return value.map((id) => byId.get(id) ?? { id, label: id.replace(/-/g, " ") });
  }, [catalog, value]);

  const suggestions = useMemo(() => {
    return suggestTags(query, catalog, { exclude: value, limit: 8 });
  }, [catalog, query, value]);

  const exact = exactTagMatch(query, catalog);
  const createSlug = normalizeTagSlug(query);
  const canCreate = Boolean(createSlug) && !exact && !value.includes(createSlug);

  const options: Array<{ kind: "tag"; tag: ShelfTag } | { kind: "create"; slug: string; label: string }> =
    [
      ...suggestions.map((tag) => ({ kind: "tag" as const, tag })),
      ...(canCreate
        ? [
            {
              kind: "create" as const,
              slug: createSlug,
              label: normalizeTagLabel(query),
            },
          ]
        : []),
    ];

  useEffect(() => {
    setActiveIndex(0);
  }, [query, open]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  function addTag(id: string, label?: string) {
    const slug = normalizeTagSlug(id);
    if (!slug || value.includes(slug)) return;
    if (label && !catalog.some((tag) => tag.id === slug)) {
      setCatalog((prev) =>
        [...prev, { id: slug, label: normalizeTagLabel(label) || slug }].sort((a, b) =>
          a.label.localeCompare(b.label),
        ),
      );
    }
    onChange([...value, slug]);
    setQuery("");
    setOpen(true);
  }

  function removeTag(id: string) {
    onChange(value.filter((item) => item !== id));
  }

  function toggleBuiltin(id: string) {
    if (value.includes(id)) removeTag(id);
    else addTag(id);
  }

  function chooseOption(index: number) {
    const option = options[index];
    if (!option) return;
    if (option.kind === "tag") addTag(option.tag.id, option.tag.label);
    else addTag(option.slug, option.label);
  }

  return (
    <div className="space-y-3" ref={rootRef}>
      {selected.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {selected.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => removeTag(tag.id)}
              className="border-primary bg-primary text-primary-foreground inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm"
            >
              {displayLabel(tag, t)}
              <XIcon className="size-3.5" />
            </button>
          ))}
        </div>
      ) : null}

      <div className="relative">
        <MagnifyingGlassIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          value={query}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          placeholder={t("tags.searchPlaceholder")}
          className="h-11 rounded-xl pl-9 text-base"
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setOpen(true);
              setActiveIndex((index) => Math.min(index + 1, Math.max(options.length - 1, 0)));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex((index) => Math.max(index - 1, 0));
            } else if (event.key === "Enter") {
              event.preventDefault();
              if (options[activeIndex]) chooseOption(activeIndex);
              else if (canCreate) addTag(createSlug, normalizeTagLabel(query));
            } else if (event.key === "Escape") {
              setOpen(false);
            } else if (event.key === "Backspace" && !query && value.length > 0) {
              removeTag(value[value.length - 1]!);
            }
          }}
        />

        {open ? (
          <ul
            id={listId}
            role="listbox"
            className="border-border bg-card absolute z-20 mt-2 max-h-56 w-full overflow-auto rounded-2xl border p-1 shadow-lg"
          >
            {options.length === 0 ? (
              <li className="text-muted-foreground px-3 py-2 text-sm">{t("tags.noMatches")}</li>
            ) : (
              options.map((option, index) => {
                const active = index === activeIndex;
                if (option.kind === "create") {
                  return (
                    <li key={`create-${option.slug}`} role="option" aria-selected={active}>
                      <button
                        type="button"
                        className={cn(
                          "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm",
                          active ? "bg-primary/10 text-foreground" : "hover:bg-muted/60",
                        )}
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => chooseOption(index)}
                      >
                        <PlusIcon className="size-4 shrink-0" />
                        <span>{t("tags.create", { label: option.label })}</span>
                      </button>
                    </li>
                  );
                }

                const querySlug = normalizeTagSlug(query);
                const near =
                  Boolean(querySlug) &&
                  option.tag.id !== querySlug &&
                  (querySlug.length >= 3 || option.tag.id.startsWith(querySlug));

                return (
                  <li key={option.tag.id} role="option" aria-selected={active}>
                    <button
                      type="button"
                      className={cn(
                        "flex w-full flex-col rounded-xl px-3 py-2 text-left text-sm",
                        active ? "bg-primary/10 text-foreground" : "hover:bg-muted/60",
                      )}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => chooseOption(index)}
                    >
                      <span>{displayLabel(option.tag, t)}</span>
                      {near ? (
                        <span className="text-muted-foreground text-xs">
                          {t("tags.didYouMean", { label: displayLabel(option.tag, t) })}
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {RECIPE_TAGS.map((tag) => {
          const selectedBuiltin = value.includes(tag.id);
          const key = tagMessageKey(tag.id);
          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggleBuiltin(tag.id)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm transition-colors",
                selectedBuiltin
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:border-primary/40",
              )}
            >
              {key ? t(key) : tag.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
