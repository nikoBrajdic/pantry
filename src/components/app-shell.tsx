"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HouseIcon,
  MagnifyingGlassIcon,
  PlusCircleIcon,
  SignOutIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/session-provider";
import { AppearanceSettings } from "@/components/appearance-settings";
import { LanguageSwitch } from "@/components/language-switch";
import { useAppearance } from "@/components/appearance-provider";
import { useLocale } from "@/components/locale-provider";
import { PantryLogo } from "@/components/pantry-logo";
import { profileIconSrc } from "@/lib/appearance";
import type { MessageKey } from "@/lib/i18n";

const LINKS: {
  href: string;
  labelKey: MessageKey;
  shortKey: MessageKey;
  icon: typeof HouseIcon;
}[] = [
  { href: "/", labelKey: "nav.library", shortKey: "nav.library", icon: HouseIcon },
  { href: "/add", labelKey: "nav.add", shortKey: "nav.add", icon: PlusCircleIcon },
  {
    href: "/kitchen",
    labelKey: "nav.pantryLong",
    shortKey: "nav.pantry",
    icon: MagnifyingGlassIcon,
  },
  { href: "/share", labelKey: "nav.share", shortKey: "nav.share", icon: UsersThreeIcon },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { profileIcon } = useAppearance();
  const { t } = useLocale();
  const accountAvatar = user?.user_metadata?.avatar_url as string | undefined;
  const avatar = profileIconSrc(profileIcon) ?? accountAvatar;
  const fullName =
    (user?.user_metadata?.full_name as string | undefined) ??
    (user?.user_metadata?.name as string | undefined) ??
    "";
  const displayName =
    (user?.user_metadata?.given_name as string | undefined)?.trim() ||
    fullName.trim().split(/\s+/)[0] ||
    user?.email?.split("@")[0] ||
    "";

  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-[color-mix(in_oklch,var(--background)_88%,var(--card))] backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6">
          <Link href="/" className="flex min-w-0 items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <PantryLogo className="size-9" />
            </span>
            <span className="min-w-0 leading-tight">
              <span className="font-heading block text-lg tracking-tight">Pantry</span>
              <span className="text-muted-foreground hidden text-xs sm:block">
                {t("nav.tagline")}
              </span>
            </span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {LINKS.map((link) => {
              const active = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground/80 hover:bg-accent",
                  )}
                >
                  <Icon className="size-4" />
                  {t(link.labelKey)}
                </Link>
              );
            })}
          </nav>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <LanguageSwitch />
            <AppearanceSettings />
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatar}
                alt=""
                className="size-11 shrink-0 rounded-full border border-border/60 bg-card object-contain p-0.5 sm:size-12"
              />
            ) : null}
            <span className="text-muted-foreground hidden max-w-28 truncate text-xs lg:block">
              {displayName}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="hidden rounded-full sm:inline-flex"
              onClick={() => void signOut()}
            >
              <SignOutIcon />
              {t("nav.signOut")}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full sm:hidden"
              aria-label={t("nav.signOut")}
              onClick={() => void signOut()}
            >
              <SignOutIcon className="size-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-28 sm:px-6 sm:py-8 md:pb-10">
        {children}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-[color-mix(in_oklch,var(--background)_90%,var(--card))] px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-md md:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-4">
          {LINKS.map((link) => {
            const active = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-center text-xs font-medium leading-tight",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon weight={active ? "fill" : "regular"} className="size-6" />
                {t(link.shortKey)}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
