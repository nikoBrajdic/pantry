"use client";

import { useState } from "react";
import { CookingPotIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function LoginForm({
  supabaseReady,
  callbackUrl,
  initialError = "",
}: {
  supabaseReady: boolean;
  callbackUrl: string;
  initialError?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(initialError);

  async function continueGoogle() {
    setBusy(true);
    setError("");
    try {
      const supabase = createClient();
      // Keep redirectTo exact (no query string) so it matches Supabase allow-list.
      // Otherwise Auth falls back to Site URL (often production).
      document.cookie = `pantry_auth_next=${encodeURIComponent(callbackUrl)}; Path=/; Max-Age=600; SameSite=Lax`;
      const redirectTo = `${window.location.origin}/auth/callback`;
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (signInError) {
        setError(signInError.message);
        setBusy(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start Google sign-in.");
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center px-4 py-16">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-border bg-card p-6 sm:p-8">
        <div className="space-y-3 text-center">
          <span className="bg-primary text-primary-foreground mx-auto grid size-12 place-items-center rounded-2xl">
            <CookingPotIcon weight="fill" className="size-6" />
          </span>
          <h1 className="font-heading text-4xl tracking-tight">Pantry</h1>
          <p className="text-muted-foreground">
            Sign in with Google so your library stays with you — and your sous chef can
            share a kitchen with you.
          </p>
        </div>

        {supabaseReady ? (
          <Button
            className="h-12 w-full rounded-full text-sm"
            disabled={busy}
            onClick={() => void continueGoogle()}
          >
            Continue with Google
          </Button>
        ) : (
          <p className="text-muted-foreground rounded-2xl bg-secondary/70 px-3 py-2 text-sm">
            Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to <code>.env.local</code>, then
            enable Google under Authentication → Providers in your Supabase project.
          </p>
        )}
        {error ? <p className="text-destructive text-center text-sm">{error}</p> : null}
      </div>
    </div>
  );
}
