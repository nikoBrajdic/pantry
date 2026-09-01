"use client";

import { use, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  ClockIcon,
  CookingPotIcon,
  FireIcon,
  LinkSimpleIcon,
  NotePencilIcon,
  PencilSimpleIcon,
  ShareNetworkIcon,
  TrashIcon,
  WarningIcon,
} from "@phosphor-icons/react";
import {
  CookProgress,
  IngredientsChecklist,
  MethodChecklist,
  useCookChecklist,
} from "@/components/cook-checklist";
import { CookingWakeLock } from "@/components/cooking-wake-lock";
import { useLocale } from "@/components/locale-provider";
import { NutritionPanel } from "@/components/nutrition-panel";
import { RecipeScaler, useRecipeScale } from "@/components/recipe-scaler";
import { useRecipes } from "@/components/recipe-provider";
import { ShelfLoading } from "@/components/shelf-loading";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { DIFFICULTY_OPTIONS, PACE_OPTIONS, formatTagDisplay } from "@/lib/tags";
import {
  difficultyMessageKey,
  paceMessageKey,
  tagMessageKey,
} from "@/lib/i18n";
import { shareUrlFor } from "@/lib/share";
import type { UnitSystem } from "@/lib/units";
import { cn } from "@/lib/utils";

const LG_QUERY = "(min-width: 1024px)";

function subscribeLg(onChange: () => void) {
  const media = window.matchMedia(LG_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function getLgSnapshot() {
  return window.matchMedia(LG_QUERY).matches;
}

function getLgServerSnapshot() {
  return false;
}

export default function RecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { t } = useLocale();
  const { recipes, ready, removeRecipe, markCooked, moveToList, upsertRecipe } = useRecipes();
  const recipe = recipes.find((item) => item.id === id);
  const [copied, setCopied] = useState(false);
  const [noteDraft, setNoteDraft] = useState<string | null>(null);

  if (!ready) return <ShelfLoading label={t("loading.recipe")} />;

  if (!recipe) {
    return (
      <div className="space-y-4">
        <h1 className="font-heading text-3xl">{t("recipe.missingTitle")}</h1>
        <Button render={<Link href="/" />} className="rounded-full">
          {t("recipe.backLibrary")}
        </Button>
      </div>
    );
  }

  return (
    <RecipeBody
      recipe={recipe}
      copied={copied}
      setCopied={setCopied}
      noteDraft={noteDraft}
      setNoteDraft={setNoteDraft}
      onDelete={() => {
        removeRecipe(recipe.id);
        router.push("/");
      }}
      onCooked={() => markCooked(recipe.id)}
      onMove={(list) => moveToList(recipe.id, list)}
      onSaveNote={(notes) => {
        upsertRecipe({ ...recipe, notes, updatedAt: new Date().toISOString() });
        setNoteDraft(null);
      }}
    />
  );
}

function RecipeBody({
  recipe,
  copied,
  setCopied,
  noteDraft,
  setNoteDraft,
  onDelete,
  onCooked,
  onMove,
  onSaveNote,
}: {
  recipe: NonNullable<ReturnType<typeof useRecipes>["recipes"][number]>;
  copied: boolean;
  setCopied: (value: boolean) => void;
  noteDraft: string | null;
  setNoteDraft: (value: string | null) => void;
  onDelete: () => void;
  onCooked: () => number;
  onMove: (list: "keeper" | "wishlist") => void;
  onSaveNote: (notes: string) => void;
}) {
  const { t } = useLocale();
  const { household, kitchens, copyRecipeToKitchen } = useRecipes();
  const [unitSystem, setUnitSystem] = useState<UnitSystem>("original");
  const scale = useRecipeScale(recipe, unitSystem);
  const cook = useCookChecklist(recipe, onCooked);
  const difficulty = DIFFICULTY_OPTIONS.find((item) => item.id === recipe.difficulty);
  const pace = PACE_OPTIONS.find((item) => item.id === recipe.pace);
  const difficultyKey = difficulty ? difficultyMessageKey(difficulty.id) : null;
  const paceKey = pace ? paceMessageKey(pace.id) : null;
  const notesValue = noteDraft ?? recipe.notes ?? "";
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [kitchenOpen, setKitchenOpen] = useState(false);
  const [kitchenBusy, setKitchenBusy] = useState(false);
  const [kitchenMessage, setKitchenMessage] = useState("");
  const [cooking, setCooking] = useState(false);
  const isDesktop = useSyncExternalStore(subscribeLg, getLgSnapshot, getLgServerSnapshot);

  const kitchenTargets = [
    ...(household
      ? [{ code: "", name: t("recipe.personalKitchen") }]
      : []),
    ...kitchens
      .filter((item) => item.code !== household)
      .map((item) => ({ code: item.code, name: item.name })),
  ];

  async function copyShare() {
    const url = await shareUrlFor(recipe, window.location.origin);
    await navigator.clipboard.writeText(url);
    setCopied(true);
  }

  async function addToKitchen(targetCode: string, targetName: string) {
    setKitchenBusy(true);
    setKitchenMessage("");
    try {
      await copyRecipeToKitchen(recipe.id, targetCode);
      setKitchenMessage(t("recipe.addedToKitchen", { name: targetName }));
      setKitchenOpen(false);
    } catch (error) {
      setKitchenMessage(
        error instanceof Error ? error.message : t("recipe.addToKitchenError"),
      );
    } finally {
      setKitchenBusy(false);
    }
  }

  function renderOverview() {
    return (
      <div className="overflow-hidden rounded-3xl border border-border bg-card">
        {recipe.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={recipe.imageUrl} alt="" className="h-56 w-full object-cover sm:h-72" />
        ) : null}
        <div className="space-y-4 p-5 sm:p-6">
          <div>
            <div className="mb-2 flex flex-wrap gap-2">
              <Badge className="rounded-full">
                {recipe.list === "keeper" ? t("recipe.keeper") : t("recipe.wishlist")}
              </Badge>
              {recipe.timesCooked > 0 ? (
                <Badge variant="secondary" className="rounded-full">
                  <FireIcon className="size-3" />
                  {recipe.timesCooked === 1
                    ? t("recipe.cookedOnce", { count: recipe.timesCooked })
                    : t("recipe.cookedMany", { count: recipe.timesCooked })}
                </Badge>
              ) : (
                <Badge variant="outline" className="rounded-full">
                  {t("recipe.notCooked")}
                </Badge>
              )}
              {recipe.notes?.trim() ? (
                <a
                  href="#what-i-changed"
                  className="inline-flex rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Badge className="rounded-full bg-primary text-primary-foreground hover:opacity-90">
                    <NotePencilIcon className="size-3.5" weight="fill" />
                    {t("recipe.tweaked")}
                  </Badge>
                </a>
              ) : null}
            </div>
            <h1 className="font-heading text-4xl font-bold tracking-tight">{recipe.title}</h1>
            {recipe.notes?.trim() ? (
              <a
                href="#what-i-changed"
                className="text-primary mt-3 flex items-start gap-2 text-sm font-medium underline-offset-4 hover:underline"
              >
                <NotePencilIcon className="mt-0.5 size-4 shrink-0" weight="fill" />
                <span>{t("recipe.tweakedHint")}</span>
              </a>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Badge className="rounded-full">
              {difficultyKey ? t(difficultyKey) : difficulty?.label}
            </Badge>
            <Badge variant="secondary" className="rounded-full">
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
          {recipe.sourceUrl ? (
            <a
              href={recipe.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="text-primary inline-flex items-center gap-1.5 text-sm underline-offset-4 hover:underline"
            >
              <LinkSimpleIcon className="size-4" />
              {t("recipe.openOriginal")}
            </a>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="rounded-full"
              render={<Link href={`/recipe/${recipe.id}/edit`} />}
            >
              <PencilSimpleIcon />
              {t("recipe.edit")}
            </Button>
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => onMove(recipe.list === "keeper" ? "wishlist" : "keeper")}
            >
              {recipe.list === "keeper"
                ? t("recipe.moveToWishlist")
                : t("recipe.moveToKeepers")}
            </Button>
            {kitchenTargets.length > 0 ? (
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => {
                  setKitchenMessage("");
                  setKitchenOpen(true);
                }}
              >
                <CookingPotIcon />
                {t("recipe.addToKitchen")}
              </Button>
            ) : null}
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => void copyShare()}
            >
              <ShareNetworkIcon />
              {t("recipe.send")}
            </Button>
            <Button
              variant="destructive"
              className="rounded-full"
              onClick={() => setDeleteOpen(true)}
            >
              <TrashIcon />
              {t("recipe.delete")}
            </Button>
          </div>
          {copied ? <p className="text-sm text-primary">{t("recipe.copied")}</p> : null}
          {kitchenMessage ? (
            <p className="text-sm text-primary">{kitchenMessage}</p>
          ) : null}
        </div>
      </div>
    );
  }

  function renderNextDay() {
    if (!recipe.nextDay) return null;
    return (
      <Alert className="rounded-2xl border-primary/25 bg-primary/8">
        <WarningIcon className="text-primary" />
        <AlertTitle className="text-foreground">{t("recipe.nextDayTitle")}</AlertTitle>
        <AlertDescription className="text-muted-foreground">
          {recipe.nextDayNote || t("recipe.nextDayDefault")}
        </AlertDescription>
      </Alert>
    );
  }

  function renderScaler() {
    return <RecipeScaler recipe={recipe} scale={scale} />;
  }

  function renderNutrition() {
    return (
      <NutritionPanel
        nutrition={recipe.nutrition}
        factor={scale.factor}
        baseServings={recipe.servings}
        shownServings={scale.shownServings}
      />
    );
  }

  function renderIngredients() {
    return (
      <IngredientsChecklist
        recipe={recipe}
        factor={scale.factor}
        cook={cook}
        unitSystem={unitSystem}
        onUnitSystemChange={(system) => {
          setUnitSystem(system);
          scale.setHaveAmount("");
        }}
      />
    );
  }

  function renderMethod() {
    return (
      <div className="space-y-5">
        <MethodChecklist recipe={recipe} cook={cook} />
        <CookProgress cook={cook} />
      </div>
    );
  }

  function renderNotes() {
    return (
      <div
        id="what-i-changed"
        className="scroll-mt-24 rounded-3xl border border-border bg-card p-5"
      >
        <h2 className="font-heading text-xl">{t("recipe.whatChanged")}</h2>
        <p className="text-muted-foreground mt-1 text-sm">{t("recipe.whatChangedBlurb")}</p>
        <Textarea
          value={notesValue}
          onChange={(event) => setNoteDraft(event.target.value)}
          placeholder={t("recipe.notesPlaceholder")}
          className="mt-3 rounded-xl text-base"
        />
        <Button
          className="mt-3 rounded-full"
          disabled={noteDraft == null || noteDraft === (recipe.notes ?? "")}
          onClick={() => onSaveNote(notesValue)}
        >
          {t("recipe.saveNote")}
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <Button variant="ghost" render={<Link href="/" />} className="rounded-full px-2">
        <ArrowLeftIcon />
        {t("recipe.library")}
      </Button>

      <CookingWakeLock enabled={cooking} onChange={setCooking} />

      {isDesktop ? (
        <div className="grid grid-cols-[1.05fr_0.95fr] gap-x-8">
          <div className="space-y-5">
            {renderOverview()}
            {renderNutrition()}
            {renderMethod()}
          </div>
          <div className="space-y-5">
            {renderNextDay()}
            {renderScaler()}
            {renderIngredients()}
            {renderNotes()}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {renderOverview()}
          {renderNextDay()}
          {renderScaler()}
          {renderNutrition()}
          {renderIngredients()}
          {renderMethod()}
          {renderNotes()}
        </div>
      )}

      <Dialog open={kitchenOpen} onOpenChange={setKitchenOpen}>
        <DialogContent className="rounded-3xl sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="font-heading text-xl tracking-tight">
              {t("recipe.addToKitchenTitle")}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {t("recipe.addToKitchenBlurb")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {kitchenTargets.map((item) => (
              <button
                key={item.code || "personal"}
                type="button"
                disabled={kitchenBusy}
                onClick={() => void addToKitchen(item.code, item.name)}
                className={cn(
                  "flex w-full items-center rounded-2xl border border-border px-4 py-3 text-left text-sm font-medium",
                  "hover:border-primary/40 hover:bg-primary/5 disabled:opacity-60",
                )}
              >
                {item.name}
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-full"
              disabled={kitchenBusy}
              onClick={() => setKitchenOpen(false)}
            >
              {t("recipe.cancel")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="rounded-3xl sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="font-heading text-xl tracking-tight">
              {t("recipe.deleteTitle")}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {t("recipe.deleteBlurb", { title: recipe.title })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => setDeleteOpen(false)}
            >
              {t("recipe.cancel")}
            </Button>
            <Button
              variant="destructive"
              className="rounded-full"
              onClick={() => {
                setDeleteOpen(false);
                onDelete();
              }}
            >
              <TrashIcon />
              {t("recipe.deleteConfirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
