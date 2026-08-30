import { cn } from "@/lib/utils";

/**
 * Frying pan + hearts mark (no background).
 * Colour from `currentColor` — place on a themed `bg-primary text-primary-foreground` tile.
 */
export function PantryLogo({
  className,
  title = "Pantry",
}: {
  className?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={cn("size-5", className)}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      {/* Hearts */}
      <path
        fill="currentColor"
        d="M23.2 12.4c0-1.7 1.3-3.05 2.9-3.05 1 0 1.85.5 2.35 1.25.5-.75 1.35-1.25 2.35-1.25 1.6 0 2.9 1.35 2.9 3.05 0 3.35-5.25 6.7-5.25 6.7S23.2 15.75 23.2 12.4Z"
      />
      <path
        fill="currentColor"
        d="M15.4 19.2c0-1.35 1-2.4 2.25-2.4.75 0 1.4.4 1.8 1 .4-.6 1.05-1 1.8-1 1.25 0 2.25 1.05 2.25 2.4 0 2.55-4.05 5.1-4.05 5.1s-4.05-2.55-4.05-5.1Z"
      />
      {/* Pan bowl — solid, no rim halo */}
      <path
        fill="currentColor"
        d="M9 35c0-1 .7-1.85 1.7-2.05L40.2 28.2c1.35-.25 2.6.8 2.6 2.15V32c0 8.2-6.2 15.1-14.3 16.4C20.5 50 12 45.4 9.8 37.8 9.3 36.9 9 36 9 35Z"
      />
      {/* Handle */}
      <path
        fill="currentColor"
        d="M41.2 29.4c1.4-.45 9.6-2.5 13.8-1.2 1.2.35 1.95 1.55 1.65 2.75-.35 1.35-1.7 2.15-3.05 1.85-3.5-.75-9.15.55-10.9 1.05-.95.3-1.85-.4-1.65-1.35.15-.95.55-2.35 1.15-3.1Z"
      />
    </svg>
  );
}
