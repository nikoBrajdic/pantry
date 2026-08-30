"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { CookingPotIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm({
  googleReady,
  callbackUrl,
}: {
  googleReady: boolean;
  callbackUrl: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function continueGoogle() {
    setBusy(true);
    setError("");
    if (googleReady) {
      await signIn("google", { callbackUrl });
      return;
    }
    const result = await signIn("google-preview", {
      email,
      name,
      callbackUrl,
      redirect: false,
    });
    if (result?.error) {
      setError("Use a real-looking email, like you@gmail.com.");
      setBusy(false);
      return;
    }
    router.replace(callbackUrl);
    router.refresh();
  }

  return (
    <div className="flex min-h-full items-center justify-center px-4 py-16">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-border bg-card p-6 sm:p-8">
        <div className="space-y-3 text-center">
          <span className="bg-primary text-primary-foreground mx-auto grid size-12 place-items-center rounded-2xl">
            <CookingPotIcon weight="fill" className="size-6" />
          </span>
          <h1 className="font-heading text-4xl tracking-tight">Receptoteka</h1>
          <p className="text-muted-foreground">
            Sign in with Google so your library stays with you — and your partner can
            share the same kitchen.
          </p>
        </div>

        {googleReady ? (
          <Button
            className="h-12 w-full rounded-full text-sm"
            disabled={busy}
            onClick={() => void continueGoogle()}
          >
            Continue with Google
          </Button>
        ) : (
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              void continueGoogle();
            }}
          >
            <p className="text-muted-foreground rounded-2xl bg-secondary/70 px-3 py-2 text-sm">
              Real Google login needs <code>AUTH_GOOGLE_ID</code> and{" "}
              <code>AUTH_GOOGLE_SECRET</code> from Google Cloud. Until those are set,
              continue with the Google email you use at home.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="email">Google email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@gmail.com"
                className="h-11 rounded-xl text-base"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Your name"
                className="h-11 rounded-xl text-base"
              />
            </div>
            <Button type="submit" className="h-12 w-full rounded-full text-sm" disabled={busy}>
              Continue with Google
            </Button>
          </form>
        )}
        {error ? <p className="text-destructive text-center text-sm">{error}</p> : null}
      </div>
    </div>
  );
}
