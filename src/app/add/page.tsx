"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircleIcon,
  CircleNotchIcon,
  LinkSimpleIcon,
  NotePencilIcon,
  XCircleIcon,
} from "@phosphor-icons/react";
import { useLocale } from "@/components/locale-provider";
import { RecipeForm } from "@/components/recipe-form";
import { useRecipes } from "@/components/recipe-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { draftFromExtracted, emptyDraft, recipeFromDraft, type RecipeDraft } from "@/lib/draft";
import type { ExtractedRecipe } from "@/lib/types";
import { cn } from "@/lib/utils";

type HtmlHelpKind = "fetch" | "extract";
type StepStatus = "pending" | "active" | "ok" | "fail";
type PullStep = { id: string; label: string; status: StepStatus };

type AttemptResult = {
  ok?: boolean;
  recipe?: ExtractedRecipe;
  gotHtml?: boolean;
  reason?: string;
  error?: string;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
  const [htmlHelpOpen, setHtmlHelpOpen] = useState(false);
  const [htmlHelpKind, setHtmlHelpKind] = useState<HtmlHelpKind>("fetch");
  const [pullSteps, setPullSteps] = useState<PullStep[]>([]);
  const [targetKitchen, setTargetKitchen] = useState(household);
  const htmlPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTargetKitchen(household);
  }, [household]);

  useEffect(() => {
    if (!showHtml) return;
    htmlPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [showHtml]);

  function openHtmlPaste() {
    setHtmlHelpOpen(false);
    setShowHtml(true);
    setError("");
  }

  function openHtmlHelp(kind: HtmlHelpKind) {
    setHtmlHelpKind(kind);
    setHtmlHelpOpen(true);
    setError("");
  }

  function setStepStatus(id: string, status: StepStatus) {
    setPullSteps((prev) =>
      prev.map((step) => (step.id === id ? { ...step, status } : step)),
    );
  }

  function startStep(id: string, label: string) {
    setPullSteps((prev) => [...prev, { id, label, status: "active" }]);
  }

  async function markOkThenContinue(id: string) {
    setStepStatus(id, "ok");
    await sleep(1500);
  }

  async function runAttempt(body: Record<string, unknown>): Promise<AttemptResult> {
    const response = await fetch("/api/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return (await response.json()) as AttemptResult;
  }

  async function extract() {
    setError("");
    setLoading(true);
    setPullSteps([]);

    try {
      const usedPaste = Boolean(html.trim());

      if (usedPaste) {
        startStep("paste", t("add.pullStep.html"));
        const data = await runAttempt({
          attempt: "paste",
          url: url.trim() || undefined,
          html: html.trim(),
        });
        if (data.ok && data.recipe) {
          await markOkThenContinue("paste");
          setDraft(draftFromExtracted(data.recipe));
          setShowHtml(false);
          return;
        }
        setStepStatus("paste", "fail");
        throw new Error(t("add.error.exhausted"));
      }

      const providersRes = await fetch("/api/extract");
      const providersData = (await providersRes.json()) as {
        providers?: { id: string; label: string }[];
        error?: string;
      };
      if (!providersRes.ok) {
        throw new Error(providersData.error ?? t("add.error.generic"));
      }
      const providers = providersData.providers ?? [];

      let sawHtml = false;

      startStep("direct", t("add.pullStep.direct"));
      const direct = await runAttempt({
        attempt: "direct",
        url: url.trim(),
      });
      if (direct.ok && direct.recipe) {
        await markOkThenContinue("direct");
        setDraft(draftFromExtracted(direct.recipe));
        return;
      }
      if (direct.gotHtml) sawHtml = true;
      setStepStatus("direct", "fail");

      for (const provider of providers) {
        startStep(provider.id, provider.label);
        const result = await runAttempt({
          attempt: "proxy",
          url: url.trim(),
          provider: provider.id,
        });
        if (result.ok && result.recipe) {
          await markOkThenContinue(provider.id);
          setDraft(draftFromExtracted(result.recipe));
          return;
        }
        if (result.gotHtml) sawHtml = true;
        setStepStatus(provider.id, "fail");
      }

      openHtmlHelp(sawHtml ? "extract" : "fetch");
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
  const helpTitle =
    htmlHelpKind === "fetch" ? t("add.htmlHelp.fetchTitle") : t("add.htmlHelp.extractTitle");
  const helpBody =
    htmlHelpKind === "fetch" ? t("add.htmlHelp.fetchBody") : t("add.htmlHelp.extractBody");

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
            disabled={loading}
          />
          <Button
            type="submit"
            disabled={loading || !canPull}
            className="h-11 rounded-xl px-4 text-sm"
          >
            <LinkSimpleIcon />
            {loading
              ? showHtml
                ? t("add.readingHtml")
                : t("add.readingLong")
              : showHtml
                ? t("add.pullFromHtml")
                : t("add.pull")}
          </Button>
        </div>

        {showHtml ? (
          <div ref={htmlPanelRef} className="mt-4 space-y-3 scroll-mt-24">
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
              className="field-sizing-fixed h-40 min-h-40 max-h-40 resize-none overflow-y-auto rounded-xl font-mono text-xs"
              disabled={loading}
            />
          </div>
        ) : null}

        <div className="mt-2 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="ghost"
            className="rounded-xl"
            disabled={loading}
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
            disabled={loading}
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

      <Dialog open={loading} onOpenChange={() => undefined}>
        <DialogContent className="rounded-3xl sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="font-heading text-xl tracking-tight">
              {showHtml ? t("add.pullProgress.htmlTitle") : t("add.pullProgress.title")}
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">
              {showHtml ? t("add.pullProgress.htmlBody") : t("add.pullProgress.body")}
            </DialogDescription>
          </DialogHeader>
          <ul className="space-y-2">
            {pullSteps.map((step) => (
              <li
                key={step.id}
                className="flex items-center gap-3 rounded-2xl border border-border px-3 py-2.5 text-sm"
              >
                {step.status === "active" ? (
                  <CircleNotchIcon className="size-5 shrink-0 animate-spin text-primary" />
                ) : step.status === "ok" ? (
                  <CheckCircleIcon className="size-5 shrink-0 text-emerald-600" weight="fill" />
                ) : step.status === "fail" ? (
                  <XCircleIcon className="size-5 shrink-0 text-destructive" weight="fill" />
                ) : (
                  <span className="border-muted-foreground/40 size-5 shrink-0 rounded-full border" />
                )}
                <span
                  className={cn(
                    "min-w-0 flex-1",
                    step.status === "pending" && "text-muted-foreground",
                    step.status === "fail" && "text-muted-foreground",
                  )}
                >
                  {step.label}
                </span>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>

      <Dialog open={htmlHelpOpen} onOpenChange={setHtmlHelpOpen}>
        <DialogContent className="rounded-3xl sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="font-heading text-xl tracking-tight">
              {helpTitle}
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">
              {helpBody}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-stretch">
            <Button className="h-11 w-full rounded-full" onClick={openHtmlPaste}>
              {t("add.pasteHtml")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
