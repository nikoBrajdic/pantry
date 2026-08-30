"use client";

import { useState } from "react";
import { CopyIcon, UsersThreeIcon } from "@phosphor-icons/react";
import { useLocale } from "@/components/locale-provider";
import { useRecipes } from "@/components/recipe-provider";
import { ShelfLoading } from "@/components/shelf-loading";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function SharePage() {
  const { t } = useLocale();
  const {
    ready,
    household,
    kitchens,
    recipes,
    syncState,
    createHousehold,
    joinHousehold,
    switchHousehold,
    leaveHousehold,
    renameKitchen,
    refreshHousehold,
  } = useRecipes();
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  if (!ready) return <ShelfLoading />;

  async function create() {
    setBusy(true);
    setMessage("");
    try {
      const next = await createHousehold();
      setMessage(t("share.created", { code: next }));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("share.errorGeneric"));
    } finally {
      setBusy(false);
    }
  }

  async function join() {
    setBusy(true);
    setMessage("");
    try {
      await joinHousehold(code);
      setMessage(t("share.joined"));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("share.errorCode"));
    } finally {
      setBusy(false);
    }
  }

  async function copyCode(value: string) {
    await navigator.clipboard.writeText(value);
    setMessage(t("share.copied"));
  }

  function startRename(kitchenCode: string, currentName: string) {
    setRenaming(kitchenCode);
    setRenameValue(currentName === kitchenCode ? "" : currentName);
  }

  async function saveRename(kitchenCode: string) {
    setBusy(true);
    setMessage("");
    try {
      await renameKitchen(kitchenCode, renameValue);
      setRenaming(null);
      setMessage(t("share.renamed"));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("share.errorRename"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-primary text-sm font-medium">{t("share.eyebrow")}</p>
        <h1 className="font-heading text-4xl tracking-tight">{t("share.title")}</h1>
        <p className="text-muted-foreground mt-2 text-base">{t("share.blurb")}</p>
      </div>

      {kitchens.length > 0 ? (
        <section className="space-y-3 rounded-3xl border border-border bg-card p-5">
          <h2 className="font-heading text-2xl">{t("share.yourKitchens")}</h2>
          <p className="text-muted-foreground text-sm">{t("share.yourKitchensBlurb")}</p>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => void switchHousehold("")}
              className={cn(
                "flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left",
                !household ? "border-primary bg-primary/8" : "border-border",
              )}
            >
              <span>
                <span className="block text-sm font-medium">{t("share.personal")}</span>
                <span className="text-muted-foreground text-xs">{t("share.onlyYou")}</span>
              </span>
              {!household ? (
                <span className="text-primary text-xs font-medium">{t("share.active")}</span>
              ) : null}
            </button>
            {kitchens.map((item) => (
              <div
                key={item.code}
                className={cn(
                  "rounded-2xl border px-4 py-3",
                  household === item.code ? "border-primary bg-primary/8" : "border-border",
                )}
              >
                {renaming === item.code ? (
                  <div className="space-y-2">
                    <Input
                      value={renameValue}
                      onChange={(event) => setRenameValue(event.target.value)}
                      placeholder={t("share.namePlaceholder")}
                      className="h-10 rounded-xl"
                      autoFocus
                      maxLength={48}
                    />
                    <p className="text-muted-foreground font-numeric text-xs tracking-wide">
                      {t("share.codeLabel", { code: item.code })}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        className="rounded-full"
                        disabled={busy || !renameValue.trim()}
                        onClick={() => void saveRename(item.code)}
                      >
                        {t("share.saveName")}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-full"
                        disabled={busy}
                        onClick={() => setRenaming(null)}
                      >
                        {t("share.cancelRename")}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left"
                      onClick={() => void switchHousehold(item.code)}
                    >
                      <span className="block text-base font-medium">{item.name}</span>
                      <span className="text-muted-foreground font-numeric block text-xs tracking-wide">
                        {t("share.codeLabel", { code: item.code })}
                      </span>
                      <span className="text-muted-foreground mt-0.5 block text-xs">
                        {household === item.code
                          ? t("share.recipesCount", {
                              count: recipes.length,
                              status:
                                syncState === "saving"
                                  ? t("share.saving")
                                  : syncState === "error"
                                    ? t("share.syncFailed")
                                    : t("share.connected"),
                            })
                          : t("share.tapToOpen")}
                      </span>
                    </button>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                        onClick={() => startRename(item.code, item.name)}
                      >
                        {t("share.rename")}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                        onClick={() => void copyCode(item.code)}
                      >
                        <CopyIcon />
                        {t("share.copy")}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-full"
                        onClick={() => void leaveHousehold(item.code)}
                      >
                        {t("share.leave")}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          {household ? (
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => void refreshHousehold()}
            >
              {t("share.refresh")}
            </Button>
          ) : null}
        </section>
      ) : null}

      <div className="grid gap-4">
        <section className="space-y-3 rounded-3xl border border-border bg-card p-5">
          <div className="flex items-start gap-3">
            <span className="bg-secondary grid size-10 place-items-center rounded-2xl">
              <UsersThreeIcon className="size-5" />
            </span>
            <div>
              <h2 className="font-heading text-2xl">{t("share.openNew")}</h2>
              <p className="text-muted-foreground mt-1 text-sm">{t("share.openNewBlurb")}</p>
            </div>
          </div>
          <Button className="h-11 rounded-full px-4" disabled={busy} onClick={() => void create()}>
            {t("share.makeCode")}
          </Button>
        </section>

        <section className="space-y-3 rounded-3xl border border-border bg-card p-5">
          <h2 className="font-heading text-2xl">{t("share.haveCode")}</h2>
          <p className="text-muted-foreground text-sm">{t("share.haveCodeBlurb")}</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              placeholder={t("share.codePlaceholder")}
              className="h-11 rounded-xl text-base tracking-widest"
            />
            <Button
              className="h-11 rounded-xl px-4"
              disabled={busy || code.trim().length < 4}
              onClick={() => void join()}
            >
              {t("share.join")}
            </Button>
          </div>
        </section>
      </div>

      {message ? (
        <Alert className="rounded-2xl">
          <AlertTitle>{t("share.done")}</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
