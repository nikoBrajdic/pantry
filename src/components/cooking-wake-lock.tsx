"use client";

import { useEffect, useState } from "react";
import { FireIcon } from "@phosphor-icons/react";
import { useLocale } from "@/components/locale-provider";
import { useWakeLock } from "@/hooks/use-wake-lock";
import { cn } from "@/lib/utils";

export function CookingWakeLock({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (next: boolean) => void;
}) {
  const { t } = useLocale();
  const { supported, secure, active, error } = useWakeLock(enabled);
  const [hint, setHint] = useState<"denied" | "insecure" | null>(null);

  useEffect(() => {
    if (!error) return;
    setHint(error);
    if (enabled) onChange(false);
  }, [error, enabled, onChange]);

  useEffect(() => {
    if (enabled) setHint(null);
  }, [enabled]);

  const unavailable = !supported || !secure;
  const statusText = unavailable
    ? !secure
      ? t("cooking.insecure")
      : t("cooking.unsupported")
    : hint === "denied"
      ? t("cooking.denied")
      : enabled && active
        ? t("cooking.on")
        : enabled && !active
          ? t("cooking.paused")
          : t("cooking.off");

  return (
    <div className="space-y-1.5 md:hidden">
      <label
        className={cn(
          "flex items-center justify-between gap-3 rounded-2xl border px-3.5 py-3",
          unavailable
            ? "border-border bg-card/70 opacity-80"
            : enabled
              ? "border-primary/40 bg-primary/10"
              : "border-border bg-card",
        )}
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <FireIcon
            weight={enabled && active ? "fill" : "regular"}
            className={cn(
              "size-5 shrink-0",
              enabled && active ? "text-primary" : "text-muted-foreground",
            )}
          />
          <span className="min-w-0">
            <span className="block text-sm font-medium">{t("cooking.title")}</span>
            <span className="text-muted-foreground block text-xs leading-snug">
              {statusText}
            </span>
          </span>
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={enabled && !unavailable}
          aria-label={t("cooking.aria")}
          disabled={unavailable}
          onClick={() => onChange(!enabled)}
          className={cn(
            "relative h-8 w-14 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50",
            enabled && !unavailable ? "bg-primary" : "bg-muted",
          )}
        >
          <span
            className={cn(
              "absolute top-1 left-1 size-6 rounded-full bg-card shadow-sm transition-transform",
              enabled && !unavailable && "translate-x-6",
            )}
          />
        </button>
      </label>
    </div>
  );
}
