"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LinkSimpleIcon, NotePencilIcon } from "@phosphor-icons/react";
import { useLocale } from "@/components/locale-provider";
import { RecipeForm } from "@/components/recipe-form";
import { useRecipes } from "@/components/recipe-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { draftFromExtracted, emptyDraft, recipeFromDraft, type RecipeDraft } from "@/lib/draft";
import type { ExtractedRecipe } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function AddRecipePage() {
  const { t } = useLocale();
  const router = useRouter();
  const { upsertRecipe, household, kitchens, switchHousehold } = useRecipes();
  const [url, setUrl] = useState("");
  const [html, setHtml] = useState("");
  const [showHtml, setShowHtml] = useState(false);
  const [draft, setDraft] = useState<RecipeDraft | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [targetKitchen, setTargetKitchen] = useState(household);

  useEffect(() => {
    setTargetKitchen(household);
  }, [household]);

  async function extract() {
    setError("");
    setLoading(true);
    try {
      const usedPaste = Boolean(html.trim());
      const response = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim() || undefined,
          html: html.trim() || undefined,
        }),
      });
      const data = (await response.json()) as {
        recipe?: ExtractedRecipe;
        error?: string;
        reason?: string;
      };
      if (!response.ok || !data.recipe) {
        if (!usedPaste && (data.reason === "fetch" || data.error === "fetch_failed")) {
          throw new Error(t("add.error.fetchFailed"));
        }
        throw new Error(data.error ?? t("add.error.extract"));
      }
      setDraft(draftFromExtracted(data.recipe));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("add.error.generic"));
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    if (!draft) return;
    const recipe = recipeFromDraft(draft);
    if (recipe.ingredients.length === 0) {
      setError(t("add.error.ingredient"));
      return;
    }
    setError("");
    setSaving(true);
    try {
      if (targetKitchen !== household) {
        await switchHousehold(targetKitchen);
      }
      upsertRecipe({ ...recipe, updatedAt: new Date().toISOString() });
      router.push(`/recipe/${recipe.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("add.error.generic"));
      setSaving(false);
    }
  }

  const canPull = Boolean(url.trim() || html.trim());
  const showKitchenPicker = kitchens.length > 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-primary text-sm font-medium">{t("add.eyebrow")}</p>
        <h1 className="font-heading text-4xl tracking-tight">{t("add.title")}</h1>
        <p className="text-muted-foreground mt-2 text-base">{t("add.blurb")}</p>
      </div>

      <form
        className="rounded-3xl border border-border bg-card p-4 sm:p-5"
        onSubmit={(event) => {
          event.preventDefault();
          void extract();
        }}
      >
        <label htmlFor="url" className="text-sm font-medium">
          {t("add.linkLabel")}
        </label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <Input
            id="url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://…"
            className="h-11 rounded-xl text-base"
          />
          <Button
            type="submit"
            disabled={loading || !canPull}
            className="h-11 rounded-xl px-4 text-sm"
          >
            <LinkSimpleIcon />
            {loading ? t("add.reading") : t("add.pull")}
          </Button>
        </div>

        {showHtml ? (
          <div className="mt-4 space-y-3">
            <div className="space-y-2 rounded-2xl border border-border bg-muted/40 px-4 py-3 text-sm">
              <p className="font-medium">{t("add.htmlHowTitle")}</p>
              <div>
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  {t("add.htmlDesktopTitle")}
                </p>
                <ol className="text-muted-foreground mt-1 list-decimal space-y-1 pl-4 text-sm">
                  <li>{t("add.htmlDesktop.1")}</li>
                  <li>{t("add.htmlDesktop.2")}</li>
                  <li>{t("add.htmlDesktop.3")}</li>
                </ol>
              </div>
              <div>
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  {t("add.htmlMobileTitle")}
                </p>
                <ol className="text-muted-foreground mt-1 list-decimal space-y-1 pl-4 text-sm">
                  <li>{t("add.htmlMobile.1")}</li>
                  <li>{t("add.htmlMobile.2")}</li>
                  <li>{t("add.htmlMobile.3")}</li>
                </ol>
              </div>
            </div>
            <label htmlFor="html" className="text-sm font-medium">
              {t("add.htmlLabel")}
            </label>
            <Textarea
              id="html"
              value={html}
              onChange={(event) => setHtml(event.target.value)}
              placeholder={t("add.htmlPlaceholder")}
              className="min-h-40 rounded-xl font-mono text-xs"
            />
          </div>
        ) : null}

        <div className="mt-2 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="ghost"
            className="rounded-xl"
            onClick={() => {
              setShowHtml((open) => {
                if (open) setHtml("");
                return !open;
              });
            }}
          >
            {showHtml ? t("add.hideHtml") : t("add.pasteHtml")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="rounded-xl"
            onClick={() => {
              setDraft(emptyDraft());
              setError("");
            }}
          >
            <NotePencilIcon />
            {t("add.byHand")}
          </Button>
        </div>
      </form>

      {error ? (
        <Alert variant="destructive" className="rounded-2xl">
          <AlertTitle>{t("add.pullErrorTitle")}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {draft ? (
        <div className="space-y-5">
          <RecipeForm draft={draft} onChange={setDraft} />

          {showKitchenPicker ? (
            <section className="space-y-3 rounded-3xl border border-border bg-card p-5">
              <p className="text-sm font-medium">{t("add.saveTo")}</p>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setTargetKitchen("")}
                  className={cn(
                    "flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left",
                    targetKitchen === ""
                      ? "border-primary bg-primary/8"
                      : "border-border hover:border-primary/40",
                  )}
                >
                  <span className="text-sm font-medium">{t("add.personal")}</span>
                </button>
                {kitchens.map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => setTargetKitchen(item.code)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left",
                      targetKitchen === item.code
                        ? "border-primary bg-primary/8"
                        : "border-border hover:border-primary/40",
                    )}
                  >
                    <span className="text-sm font-medium">{item.name}</span>
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => void save()}
              disabled={saving}
              className="h-11 rounded-full px-5 text-sm"
            >
              {saving ? t("add.saving") : t("add.save")}
            </Button>
            <Button
              variant="outline"
              className="h-11 rounded-full px-5 text-sm"
              disabled={saving}
              onClick={() => setDraft(null)}
            >
              {t("add.cancel")}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
