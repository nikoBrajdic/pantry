"use client";

import { useEffect, useState } from "react";
import { DownloadSimpleIcon, XIcon } from "@phosphor-icons/react";
import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";

const DISMISS_KEY = "pantry:pwa-install-dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    ("standalone" in navigator &&
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  );
}

export function PwaRegister() {
  const { t } = useLocale();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js").catch(() => {
        // Ignore registration failures (e.g. insecure origin outside localhost)
      });
    }

    if (isStandalone()) return;
    try {
      if (localStorage.getItem(DISMISS_KEY) === "1") return;
    } catch {
      // ignore
    }

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  async function install() {
    if (!deferred) return;
    setVisible(false);
    await deferred.prompt();
    try {
      await deferred.userChoice;
    } catch {
      // ignore
    }
    setDeferred(null);
  }

  function dismiss() {
    setVisible(false);
    setDeferred(null);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignore
    }
  }

  return visible && deferred ? (
    <div className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-50 px-3 md:bottom-4">
      <div className="mx-auto flex max-w-lg items-start gap-3 rounded-2xl border border-border bg-card p-3 shadow-lg">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
          <DownloadSimpleIcon className="size-5" weight="bold" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-heading text-sm tracking-tight">{t("pwa.title")}</p>
          <p className="text-muted-foreground mt-0.5 text-xs leading-snug">
            {t("pwa.blurb")}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button type="button" size="sm" className="rounded-full" onClick={() => void install()}>
              {t("pwa.install")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="rounded-full"
              onClick={dismiss}
            >
              {t("pwa.dismiss")}
            </Button>
          </div>
        </div>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="size-8 shrink-0 rounded-full"
          aria-label={t("pwa.dismiss")}
          onClick={dismiss}
        >
          <XIcon className="size-4" />
        </Button>
      </div>
    </div>
  ) : null;
}
