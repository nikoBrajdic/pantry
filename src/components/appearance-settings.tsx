"use client";

import { PaletteIcon } from "@phosphor-icons/react";
import { useAppearance } from "@/components/appearance-provider";
import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { APPEARANCE_MODES, PALETTES, PROFILE_ICONS } from "@/lib/appearance";
import type { MessageKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const MODE_KEYS: Record<
  (typeof APPEARANCE_MODES)[number]["id"],
  { label: MessageKey; hint: MessageKey }
> = {
  light: { label: "theme.mode.light", hint: "theme.mode.lightHint" },
  dark: { label: "theme.mode.dark", hint: "theme.mode.darkHint" },
  system: { label: "theme.mode.system", hint: "theme.mode.systemHint" },
};

export function AppearanceSettings() {
  const { mode, palette, profileIcon, setMode, setPalette, setProfileIcon } =
    useAppearance();
  const { t } = useLocale();

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            className="size-11 rounded-full sm:h-9 sm:w-auto sm:gap-1.5 sm:px-3"
            aria-label={t("theme.trigger")}
          />
        }
      >
        <PaletteIcon className="size-6 sm:size-4" />
        <span className="hidden sm:inline">{t("theme.trigger")}</span>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto rounded-3xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl tracking-tight">
            {t("theme.title")}
          </DialogTitle>
          <DialogDescription>{t("theme.description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <section className="space-y-2">
            <p className="text-sm font-medium">{t("theme.colourTheme")}</p>
            <div className="grid grid-cols-3 gap-2">
              {APPEARANCE_MODES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setMode(item.id)}
                  className={cn(
                    "rounded-2xl border px-3 py-2.5 text-left transition-colors",
                    mode === item.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/40",
                  )}
                >
                  <span className="block text-sm font-medium">
                    {t(MODE_KEYS[item.id].label)}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {t(MODE_KEYS[item.id].hint)}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-2">
            <p className="text-sm font-medium">{t("theme.palette")}</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {PALETTES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPalette(item.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-2xl border px-3 py-2.5 text-left transition-colors",
                    palette === item.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/40",
                  )}
                >
                  <span
                    className="size-4 shrink-0 rounded-full border border-border"
                    style={{ background: item.swatch }}
                    aria-hidden
                  />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              ))}
            </div>
            <p className="text-muted-foreground text-xs">{t("theme.paletteHint")}</p>
          </section>

          <section className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">{t("theme.profileIcon")}</p>
              {profileIcon ? (
                <button
                  type="button"
                  onClick={() => setProfileIcon(null)}
                  className="text-muted-foreground hover:text-foreground text-xs underline-offset-2 hover:underline"
                >
                  {t("theme.useAccountPhoto")}
                </button>
              ) : null}
            </div>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
              {PROFILE_ICONS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setProfileIcon(item.id)}
                  aria-label={item.label}
                  title={item.label}
                  className={cn(
                    "aspect-square min-h-20 overflow-hidden rounded-2xl border bg-card p-2 transition-colors sm:min-h-20",
                    profileIcon === item.id
                      ? "border-primary ring-primary/30 ring-2"
                      : "border-border hover:border-primary/40",
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.src}
                    alt=""
                    className="size-full object-contain"
                  />
                </button>
              ))}
            </div>
            <p className="text-muted-foreground text-xs">{t("theme.profileHint")}</p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
