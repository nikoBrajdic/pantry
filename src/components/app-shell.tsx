"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  CookingPotIcon,
  HouseIcon,
  MagnifyingGlassIcon,
  PlusCircleIcon,
  SignOutIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const LINKS = [
  { href: "/", label: "Library", icon: HouseIcon },
  { href: "/add", label: "Add", icon: PlusCircleIcon },
  { href: "/kitchen", label: "What's in", icon: MagnifyingGlassIcon },
  { href: "/share", label: "Share", icon: UsersThreeIcon },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data } = useSession();

  if (pathname === "/login") {
    return <>{children}</>;
  }

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
                Paste a link. Keep the recipe. Cook it again.
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
          <div className="flex items-center gap-2">
            {data?.user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={data.user.image}
                alt=""
                className="size-8 rounded-full object-cover"
              />
            ) : null}
            <span className="text-muted-foreground hidden max-w-36 truncate text-xs lg:block">
              {data?.user?.name ?? data?.user?.email}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full"
              onClick={() => void signOut({ callbackUrl: "/login" })}
            >
              <SignOutIcon />
              Sign out
            </Button>
          </div>
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
