"use client";

import { useState } from "react";
import { CopyIcon, UsersThreeIcon } from "@phosphor-icons/react";
import { useRecipes } from "@/components/recipe-provider";
import { ShelfLoading } from "@/components/shelf-loading";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function SharePage() {
  const {
    ready,
    household,
    households,
    recipes,
    syncState,
    createHousehold,
    joinHousehold,
    switchHousehold,
    leaveHousehold,
    refreshHousehold,
  } = useRecipes();
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  if (!ready) return <ShelfLoading />;

  async function create() {
    setBusy(true);
    setMessage("");
    try {
      const next = await createHousehold();
      setMessage(`Shared kitchen is open. The code is ${next}. Send it to your sous chef.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "That did not work.");
    } finally {
      setBusy(false);
    }
  }

  async function join() {
    setBusy(true);
    setMessage("");
    try {
      await joinHousehold(code);
      setMessage("You joined the shared kitchen. Recipes are merged for that kitchen.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "That code did not work.");
    } finally {
      setBusy(false);
    }
  }

  async function copyCode(value: string) {
    await navigator.clipboard.writeText(value);
    setMessage("Code copied.");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-primary text-sm font-medium">Shared kitchens</p>
        <h1 className="font-heading text-4xl tracking-tight">Cook with your sous chefs</h1>
        <p className="text-muted-foreground mt-2 text-base">
          Open as many kitchens as you like — one with person A, another with person B.
          Any number of sous chefs can share a kitchen with the same code.
        </p>
      </div>

      {households.length > 0 ? (
        <section className="space-y-3 rounded-3xl border border-border bg-card p-5">
          <h2 className="font-heading text-2xl">Your kitchens</h2>
          <p className="text-muted-foreground text-sm">
            Switch which kitchen&apos;s recipes you are browsing. Your personal shelf is
            separate.
          </p>
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
                <span className="block text-sm font-medium">Personal shelf</span>
                <span className="text-muted-foreground text-xs">Only you</span>
              </span>
              {!household ? (
                <span className="text-primary text-xs font-medium">Active</span>
              ) : null}
            </button>
            {households.map((item) => (
              <div
                key={item}
                className={cn(
                  "rounded-2xl border px-4 py-3",
                  household === item ? "border-primary bg-primary/8" : "border-border",
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    className="text-left"
                    onClick={() => void switchHousehold(item)}
                  >
                    <span className="font-numeric block text-2xl tracking-wide">{item}</span>
                    <span className="text-muted-foreground text-xs">
                      {household === item
                        ? `${recipes.length} recipes · ${
                            syncState === "saving"
                              ? "saving…"
                              : syncState === "error"
                                ? "sync failed"
                                : "connected"
                          }`
                        : "Tap to open"}
                    </span>
                  </button>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                      onClick={() => void copyCode(item)}
                    >
                      <CopyIcon />
                      Copy
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-full"
                      onClick={() => void leaveHousehold(item)}
                    >
                      Leave
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {household ? (
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => void refreshHousehold()}
            >
              Refresh from sous chefs
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
              <h2 className="font-heading text-2xl">Open a new kitchen</h2>
              <p className="text-muted-foreground mt-1 text-sm">
                You get a short code. Your current recipes become that kitchen&apos;s starting
                library. Existing kitchens stay.
              </p>
            </div>
          </div>
          <Button className="h-11 rounded-full px-4" disabled={busy} onClick={() => void create()}>
            Make a kitchen code
          </Button>
        </section>

        <section className="space-y-3 rounded-3xl border border-border bg-card p-5">
          <h2 className="font-heading text-2xl">I have a code</h2>
          <p className="text-muted-foreground text-sm">
            Enter the code a sous chef sent. You join that kitchen without leaving your others.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              placeholder="e.g. K7F3M2"
              className="h-11 rounded-xl text-base tracking-widest"
            />
            <Button
              className="h-11 rounded-xl px-4"
              disabled={busy || code.trim().length < 4}
              onClick={() => void join()}
            >
              Join
            </Button>
          </div>
        </section>
      </div>

      {message ? (
        <Alert className="rounded-2xl">
          <AlertTitle>Done</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
