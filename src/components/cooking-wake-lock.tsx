"use client";

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
  const { supported, active } = useWakeLock(enabled);

  if (!supported) return null;

  return (
    <label
      className={cn(
        "flex items-center justify-between gap-3 rounded-2xl border px-3.5 py-3 md:hidden",
        enabled
          ? "border-primary/40 bg-primary/10"
          : "border-border bg-card",
      )}
    >
      <span className="flex min-w-0 items-center gap-2.5">
        <FireIcon
          weight={enabled ? "fill" : "regular"}
          className={cn("size-5 shrink-0", enabled ? "text-primary" : "text-muted-foreground")}
        />
        <span className="min-w-0">
          <span className="block text-sm font-medium">{t("cooking.title")}</span>
          <span className="text-muted-foreground block text-xs leading-snug">
            {enabled && active ? t("cooking.on") : t("cooking.off")}
          </span>
        </span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={t("cooking.aria")}
        onClick={() => onChange(!enabled)}
        className={cn(
          "relative h-8 w-14 shrink-0 rounded-full transition-colors",
          enabled ? "bg-primary" : "bg-muted",
        )}
      >
        <span
          className={cn(
            "absolute top-1 left-1 size-6 rounded-full bg-card shadow-sm transition-transform",
            enabled && "translate-x-6",
          )}
        />
      </button>
    </label>
  );
}
