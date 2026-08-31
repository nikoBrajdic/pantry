"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { MagnifyingGlassIcon, PlusIcon } from "@phosphor-icons/react";
import { useLocale } from "@/components/locale-provider";
import { useRecipes } from "@/components/recipe-provider";
import { RECIPE_TAGS, formatTagDisplay } from "@/lib/tags";
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

const SUGGESTION_LIMIT = 7;

const BUILTIN_TAGS: ShelfTag[] = RECIPE_TAGS.map((tag) => ({
  id: tag.id,
  label: tag.label,
}));

function displayLabel(
  tag: ShelfTag,
  t: (key: MessageKey, values?: Record<string, string | number>) => string,
) {
  const key = tagMessageKey(tag.id);
  return key ? t(key) : formatTagDisplay(tag.label || tag.id);
}

function tagFromId(id: string, catalog: ShelfTag[]): ShelfTag {
  return (
    catalog.find((tag) => tag.id === id) ?? {
      id,
      label: formatTagDisplay(id),
    }
  );
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
  /** Shelf tags ordered by last_used (most recent first). */
  const [shelfTags, setShelfTags] = useState<ShelfTag[]>([]);
  /** Chips that should stay visible after unselect during this edit. */
  const [stickyIds, setStickyIds] = useState<string[]>([]);
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
        const tags = data.tags;
        setShelfTags(tags);
        setStickyIds((prev) => {
          const seen = new Set(prev);
          const next = [...prev];
          for (const id of value) {
            if (seen.has(id)) continue;
            seen.add(id);
            next.push(id);
          }
          let extraCount = next.filter((id) => !value.includes(id)).length;
          for (const tag of tags) {
            if (extraCount >= SUGGESTION_LIMIT) break;
            if (seen.has(tag.id)) continue;
            seen.add(tag.id);
            next.push(tag.id);
            if (!value.includes(tag.id)) extraCount += 1;
          }
          return next;
        });
      } catch {
        // keep local list
      }
    })();
    return () => {
      cancelled = true;
    };
    // Only reload when kitchen changes; value stickiness handled separately
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [household]);

  useEffect(() => {
    setStickyIds((prev) => {
      const seen = new Set(prev);
      const next = [...prev];
      for (const id of value) {
        if (seen.has(id)) continue;
        seen.add(id);
        next.push(id);
      }
      return next;
    });
  }, [value]);

  const catalog = useMemo(() => {
    const byId = new Map<string, ShelfTag>();
    for (const tag of BUILTIN_TAGS) byId.set(tag.id, tag);
    for (const tag of shelfTags) byId.set(tag.id, tag);
    for (const id of value) {
      if (!byId.has(id)) byId.set(id, { id, label: formatTagDisplay(id) });
    }
    return [...byId.values()];
  }, [shelfTags, value]);

  const cloudTags = useMemo(() => {
    const selectedSet = new Set(value);
    const selected = value.map((id) => tagFromId(id, catalog));

    const extras: ShelfTag[] = [];
    const extraIds = new Set<string>();

    // Keep chips the user has already seen (e.g. unselected after a change of mind).
    for (const id of stickyIds) {
      if (selectedSet.has(id) || extraIds.has(id)) continue;
      extras.push(tagFromId(id, catalog));
      extraIds.add(id);
    }

    for (const tag of shelfTags) {
      if (extras.length >= SUGGESTION_LIMIT) break;
      if (selectedSet.has(tag.id) || extraIds.has(tag.id)) continue;
      extras.push(tag);
      extraIds.add(tag.id);
    }

    return [...selected, ...extras.slice(0, SUGGESTION_LIMIT)];
  }, [catalog, shelfTags, stickyIds, value]);

  const suggestions = useMemo(() => {
    return suggestTags(query, catalog, { exclude: value, limit: 8 });
  }, [catalog, query, value]);

  const exact = exactTagMatch(query, catalog);
  const createSlug = normalizeTagSlug(query);
  const canCreate = Boolean(createSlug) && !exact;

  const options: Array<
    { kind: "tag"; tag: ShelfTag } | { kind: "create"; slug: string; label: string }
  > = [
    ...suggestions.map((tag) => ({ kind: "tag" as const, tag })),
    ...(canCreate && !value.includes(createSlug)
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

  function rememberTag(id: string, label?: string) {
    const slug = normalizeTagSlug(id);
    if (!slug) return slug;
    setShelfTags((prev) => {
      if (prev.some((tag) => tag.id === slug)) return prev;
      return [
        { id: slug, label: normalizeTagLabel(label || slug) || slug },
        ...prev,
      ];
    });
    setStickyIds((prev) => (prev.includes(slug) ? prev : [...prev, slug]));
    return slug;
  }

  function selectTag(id: string, label?: string) {
    const slug = rememberTag(id, label);
    if (!slug || value.includes(slug)) return;
    onChange([...value, slug]);
    setQuery("");
    setOpen(false);
  }

  function toggleTag(id: string) {
    if (value.includes(id)) {
      onChange(value.filter((item) => item !== id));
      setStickyIds((prev) => [id, ...prev.filter((item) => item !== id)]);
      return;
    }
    selectTag(id);
  }

  function chooseOption(index: number) {
    const option = options[index];
    if (!option) return;
    if (option.kind === "tag") selectTag(option.tag.id, option.tag.label);
    else selectTag(option.slug, option.label);
  }

  return (
    <div className="space-y-3" ref={rootRef}>
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
              else if (exact) selectTag(exact.id, exact.label);
              else if (canCreate) selectTag(createSlug, normalizeTagLabel(query));
            } else if (event.key === "Escape") {
              setOpen(false);
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

      {cloudTags.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {cloudTags.map((tag) => {
            const selected = value.includes(tag.id);
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
                className={cn(
                  "inline-flex items-center justify-center rounded-full border px-3 py-1.5 text-sm leading-none transition-colors",
                  selected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground hover:border-primary/40",
                )}
              >
                {displayLabel(tag, t)}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
