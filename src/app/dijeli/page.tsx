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
      setMessage(`Kućanstvo je otvoreno. Kod je ${next}. Pošalji ga partneru.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Nije uspjelo.");
    } finally {
      setBusy(false);
    }
  }

  async function join() {
    setBusy(true);
    setMessage("");
    try {
      await joinHousehold(code);
      setMessage("Ušla si u zajedničku knjižnicu. Recepti su spojeni.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Kod nije prošao.");
    } finally {
      setBusy(false);
    }
  }

  async function copyCode() {
    await navigator.clipboard.writeText(household);
    setMessage("Kod je kopiran.");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-primary text-sm font-medium">Zajednička knjižnica</p>
        <h1 className="font-heading text-4xl tracking-tight">Podijeli s partnerom</h1>
        <p className="text-muted-foreground mt-2 text-base">
          Napravi kućanstvo i pošalji kod. Partner ga upiše na ovom istom mjestu
          i od tada vidite iste recepte. Možeš i poslati jedan recept s njegove
          stranice gumbom „Pošalji recept“.
        </p>
      </div>

      {household ? (
        <section className="space-y-4 rounded-3xl border border-border bg-card p-5">
          <div className="flex items-start gap-3">
            <span className="bg-secondary grid size-10 place-items-center rounded-2xl">
              <UsersThreeIcon className="size-5" />
            </span>
            <div>
              <p className="text-sm font-medium">Aktivno kućanstvo</p>
              <p className="font-heading text-3xl tracking-wide">{household}</p>
              <p className="text-muted-foreground mt-1 text-sm">
                {recipes.length} recepata ·{" "}
                {syncState === "saving"
                  ? "sprema se…"
                  : syncState === "error"
                    ? "sinkronizacija nije uspjela, recepti su i dalje kod tebe"
                    : "povezano"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button className="rounded-full" onClick={() => void copyCode()}>
              <CopyIcon />
              Kopiraj kod
            </Button>
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => void refreshHousehold()}
            >
              Osvježi od partnera
            </Button>
            <Button variant="ghost" className="rounded-full" onClick={leaveHousehold}>
              Prestani dijeliti
            </Button>
          </div>
        </section>
      ) : (
        <div className="grid gap-4">
          <section className="space-y-3 rounded-3xl border border-border bg-card p-5">
            <h2 className="font-heading text-2xl">Otvori novo kućanstvo</h2>
            <p className="text-muted-foreground text-sm">
              Dobiješ kratki kod. Tvoji trenutni recepti postaju početna
              zajednička knjižnica.
            </p>
            <Button className="h-11 rounded-full px-4" disabled={busy} onClick={() => void create()}>
              Napravi kod za dvoje
            </Button>
          </section>

          <section className="space-y-3 rounded-3xl border border-border bg-card p-5">
            <h2 className="font-heading text-2xl">Imam kod</h2>
            <p className="text-muted-foreground text-sm">
              Upiši kod koji ti je partner poslao. Knjižnice se spoje.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                placeholder="npr. K7F3M2"
                className="h-11 rounded-xl text-base tracking-widest"
              />
              <Button
                className="h-11 rounded-xl px-4"
                disabled={busy || code.trim().length < 4}
                onClick={() => void join()}
              >
                Pridruži se
              </Button>
            </div>
          </section>
        </div>
      )}

      {message ? (
        <Alert className="rounded-2xl">
          <AlertTitle>Gotovo</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}

      <p className="text-muted-foreground text-sm">
        Recepti se čuvaju na ovom uređaju. Zajednički kod radi dok aplikacija
        radi na istom poslužitelju. Jedan recept uvijek možeš poslati linkom,
        bez koda.
      </p>
    </div>
  );
}
