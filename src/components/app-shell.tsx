"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CookingPotIcon,
  HouseIcon,
  MagnifyingGlassIcon,
  PlusCircleIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useRecipes } from "./recipe-provider";

const LINKS = [
  { href: "/", label: "Knjižnica", icon: HouseIcon },
  { href: "/dodaj", label: "Dodaj", icon: PlusCircleIcon },
  { href: "/kuhinja", label: "Što imam", icon: MagnifyingGlassIcon },
  { href: "/dijeli", label: "Podijeli", icon: UsersThreeIcon },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { household } = useRecipes();

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-[color-mix(in_oklch,var(--background)_88%,white)] backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <CookingPotIcon weight="fill" className="size-5" />
            </span>
            <span className="leading-tight">
              <span className="font-heading block text-lg tracking-tight">Receptoteka</span>
              <span className="text-muted-foreground hidden text-xs sm:block">
                Zalijepi link. Dobiješ sastojke, porcije i upute.
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
                  {link.label}
                </Link>
              );
            })}
          </nav>
          {household ? (
            <p className="text-muted-foreground hidden text-xs lg:block">
              Kućanstvo <span className="font-medium text-foreground">{household}</span>
            </p>
          ) : null}
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-24 sm:px-6 sm:py-8 md:pb-10">
        {children}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-[color-mix(in_oklch,var(--background)_92%,white)] px-2 py-2 backdrop-blur-md md:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-4">
          {LINKS.map((link) => {
            const active = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[11px]",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon weight={active ? "fill" : "regular"} className="size-5" />
                {link.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
