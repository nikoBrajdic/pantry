"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClockCounterClockwiseIcon, TrashIcon } from "@phosphor-icons/react";
import { useLocale } from "@/components/locale-provider";
import { useRecipes } from "@/components/recipe-provider";
import { ShelfLoading } from "@/components/shelf-loading";
import { Button } from "@/components/ui/button";
import {
  formatCookDay,
  formatCookTime,
  groupCookLogsByDay,
  localDayKeyFromDate,
} from "@/lib/cook-dates";
import type { CookLog } from "@/lib/types";

export default function HistoryPage() {
  const { t, locale } = useLocale();
  const { ready, recipes, cookLogs, kitchens, household, switchHousehold, removeCookLog } =
    useRecipes();
  const router = useRouter();
  const [opening, setOpening] = useState<string | null>(null);

  const groups = useMemo(() => groupCookLogsByDay(cookLogs), [cookLogs]);
  const todayKey = localDayKeyFromDate(new Date());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = localDayKeyFromDate(yesterday);

  if (!ready) return <ShelfLoading label={t("loading.history")} />;

  function kitchenName(code: string) {
    if (!code) return t("history.personalKitchen");
    return kitchens.find((item) => item.code === code)?.name ?? t("share.codeLabel", { code });
  }

  function imageFor(log: CookLog) {
    const recipe = recipes.find((item) => item.id === log.recipeId);
    return {
      src: log.recipeImageUrl || recipe?.imageUrl,
      position: recipe?.imagePosition,
    };
  }

  async function openLog(log: CookLog) {
    if (opening) return;
    setOpening(log.id);
    try {
      if (log.householdCode !== household) {
        await switchHousehold(log.householdCode);
      }
      router.push(`/recipe/${log.recipeId}`);
    } catch {
      setOpening(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="max-w-2xl">
        <p className="text-primary text-sm font-medium">{t("history.eyebrow")}</p>
        <h1 className="font-heading text-4xl tracking-tight">{t("history.title")}</h1>
        <p className="text-muted-foreground mt-2 text-base">{t("history.blurb")}</p>
      </div>

      {cookLogs.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card/60 px-6 py-16 text-center">
          <ClockCounterClockwiseIcon className="text-muted-foreground mx-auto size-8" />
          <h2 className="font-heading mt-4 text-2xl">{t("history.empty.title")}</h2>
          <p className="text-muted-foreground mx-auto mt-2 max-w-md">
            {t("history.empty.blurb")}
          </p>
          <Button render={<Link href="/" />} className="mt-5 h-11 rounded-full px-4 text-sm">
            {t("history.empty.cta")}
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map((group) => {
            const heading =
              group.key === todayKey
                ? t("history.today")
                : group.key === yesterdayKey
                  ? t("history.yesterday")
                  : formatCookDay(group.logs[0].cookedAt, locale);
            return (
              <section key={group.key} className="space-y-3">
                <h2 className="font-heading text-xl tracking-tight">{heading}</h2>
                <ul className="divide-y divide-border overflow-hidden rounded-3xl border border-border bg-card">
                  {group.logs.map((log) => {
                    const image = imageFor(log);
                    const busy = opening === log.id;
                    return (
                      <li key={log.id} className="flex items-stretch gap-3 p-3 sm:p-4">
                        <button
                          type="button"
                          disabled={Boolean(opening)}
                          onClick={() => void openLog(log)}
                          className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl text-left disabled:opacity-60"
                        >
                          <span className="bg-accent size-16 shrink-0 overflow-hidden rounded-2xl">
                            {image.src ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={image.src}
                                alt=""
                                className="size-16 object-cover"
                                style={{
                                  objectPosition: image.position ?? "50% 50%",
                                }}
                              />
                            ) : (
                              <span className="text-primary/50 grid size-16 place-items-center font-heading text-2xl">
                                {log.recipeTitle.slice(0, 1)}
                              </span>
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="font-heading block truncate text-lg leading-tight">
                              {log.recipeTitle}
                            </span>
                            <span className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
                              <span>{formatCookTime(log.cookedAt, locale)}</span>
                              <span aria-hidden>·</span>
                              <span>{kitchenName(log.householdCode)}</span>
                              {busy ? <span>{t("history.opening")}</span> : null}
                            </span>
                          </span>
                        </button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-full self-center"
                          aria-label={t("history.remove")}
                          disabled={log.id.startsWith("temp-")}
                          onClick={() => removeCookLog(log.id)}
                        >
                          <TrashIcon className="size-4" />
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
