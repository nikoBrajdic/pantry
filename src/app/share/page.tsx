"use client";

import { useState } from "react";
import { CopyIcon, UsersThreeIcon } from "@phosphor-icons/react";
import { useRecipes } from "@/components/recipe-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SharePage() {
  const {
    household,
    recipes,
    syncState,
    createHousehold,
    joinHousehold,
    leaveHousehold,
    refreshHousehold,
  } = useRecipes();
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function create() {
    setBusy(true);
    setMessage("");
    try {
      const next = await createHousehold();
      setMessage(`Shared kitchen is open. The code is ${next}. Send it to your partner.`);
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
      setMessage("You joined the shared library. Recipes are merged.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "That code did not work.");
    } finally {
      setBusy(false);
    }
  }

  async function copyCode() {
    await navigator.clipboard.writeText(household);
    setMessage("Code copied.");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-primary text-sm font-medium">Shared kitchen</p>
        <h1 className="font-heading text-4xl tracking-tight">Share with your partner</h1>
        <p className="text-muted-foreground mt-2 text-base">
          Both of you sign in, then one person opens a kitchen and sends the code.
          You can also send a single recipe from its page with “Send recipe”.
        </p>
      </div>

      {household ? (
        <section className="space-y-4 rounded-3xl border border-border bg-card p-5">
          <div className="flex items-start gap-3">
            <span className="bg-secondary grid size-10 place-items-center rounded-2xl">
              <UsersThreeIcon className="size-5" />
            </span>
            <div>
              <p className="text-sm font-medium">Active kitchen</p>
              <p className="font-heading text-3xl tracking-wide">{household}</p>
              <p className="text-muted-foreground mt-1 text-sm">
                {recipes.length} recipes ·{" "}
                {syncState === "saving"
                  ? "saving…"
                  : syncState === "error"
                    ? "sync failed — recipes are still on your account"
                    : "connected"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button className="rounded-full" onClick={() => void copyCode()}>
              <CopyIcon />
              Copy code
            </Button>
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => void refreshHousehold()}
            >
              Refresh from partner
            </Button>
            <Button variant="ghost" className="rounded-full" onClick={leaveHousehold}>
              Stop sharing
            </Button>
          </div>
        </section>
      ) : (
        <div className="grid gap-4">
          <section className="space-y-3 rounded-3xl border border-border bg-card p-5">
            <h2 className="font-heading text-2xl">Open a new kitchen</h2>
            <p className="text-muted-foreground text-sm">
              You get a short code. Your current recipes become the shared starting library.
            </p>
            <Button className="h-11 rounded-full px-4" disabled={busy} onClick={() => void create()}>
              Make a code for two
            </Button>
          </section>

          <section className="space-y-3 rounded-3xl border border-border bg-card p-5">
            <h2 className="font-heading text-2xl">I have a code</h2>
            <p className="text-muted-foreground text-sm">
              Enter the code your partner sent. The libraries merge.
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
      )}

      {message ? (
        <Alert className="rounded-2xl">
          <AlertTitle>Done</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
