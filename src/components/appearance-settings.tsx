"use client";

import { PaletteIcon } from "@phosphor-icons/react";
import { useAppearance } from "@/components/appearance-provider";
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
import { cn } from "@/lib/utils";

export function AppearanceSettings() {
  const { mode, palette, profileIcon, setMode, setPalette, setProfileIcon } =
    useAppearance();

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full"
            aria-label="Theme settings"
          />
        }
      >
        <PaletteIcon className="size-4" />
        <span className="hidden sm:inline">Theme</span>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto rounded-3xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl tracking-tight">Appearance</DialogTitle>
          <DialogDescription>
            Choose light, dark, or follow your system setting, then pick a colour palette and
            profile icon.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <section className="space-y-2">
            <p className="text-sm font-medium">Colour theme</p>
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
                  <span className="block text-sm font-medium">{item.label}</span>
                  <span className="text-muted-foreground text-xs">{item.hint}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-2">
            <p className="text-sm font-medium">Palette</p>
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
                    className="size-4 shrink-0 rounded-full border border-black/10"
                    style={{ background: item.swatch }}
                    aria-hidden
                  />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              ))}
            </div>
            <p className="text-muted-foreground text-xs">
              Sage is the default. Mint, sky, lilac, blush, peach, butter, mist, and lavender are
              softer pastels.
            </p>
          </section>

          <section className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">Profile icon</p>
              {profileIcon ? (
                <button
                  type="button"
                  onClick={() => setProfileIcon(null)}
                  className="text-muted-foreground hover:text-foreground text-xs underline-offset-2 hover:underline"
                >
                  Use account photo
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
                    "aspect-square min-h-16 overflow-hidden rounded-2xl border bg-white p-2 transition-colors sm:min-h-20",
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
            <p className="text-muted-foreground text-xs">
              Pick a chef character for the header. Clear to fall back to your account photo.
            </p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
