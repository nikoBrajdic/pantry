"use client";

import { useState } from "react";
import { LanguageSwitch } from "@/components/language-switch";
import { useLocale } from "@/components/locale-provider";
import { PantryLogo } from "@/components/pantry-logo";
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
  const { t } = useLocale();
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
      setError(err instanceof Error ? err.message : t("login.googleError"));
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center px-4 py-16">
      <div className="relative w-full max-w-md space-y-6 rounded-3xl border border-border bg-card p-6 sm:p-8">
        <div className="absolute top-4 right-4 sm:top-5 sm:right-5">
          <LanguageSwitch />
        </div>
        <div className="space-y-3 text-center">
          <span className="bg-primary text-primary-foreground mx-auto grid size-12 place-items-center rounded-2xl">
            <PantryLogo className="size-8" />
          </span>
          <h1 className="font-heading text-4xl tracking-tight">{t("login.title")}</h1>
          <p className="text-muted-foreground">{t("login.blurb")}</p>
        </div>

        {supabaseReady ? (
          <Button
            className="h-12 w-full rounded-full text-sm"
            disabled={busy}
            onClick={() => void continueGoogle()}
          >
            {t("login.continueGoogle")}
          </Button>
        ) : (
          <p className="text-muted-foreground rounded-2xl bg-secondary/70 px-3 py-2 text-sm">
            {t("login.envHint")}
          </p>
        )}
        {error ? <p className="text-destructive text-center text-sm">{error}</p> : null}
      </div>
    </div>
  );
}
