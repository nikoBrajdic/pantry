import { cn } from "@/lib/utils";

/**
 * Frying pan + hearts mark (no background).
 * Colour comes from `currentColor` — place on a themed `bg-primary text-primary-foreground` tile.
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
      <path
        fill="currentColor"
        d="M21.5 11.8c0-1.55 1.2-2.8 2.65-2.8.9 0 1.7.45 2.15 1.15.45-.7 1.25-1.15 2.15-1.15 1.45 0 2.65 1.25 2.65 2.8 0 2.9-4.8 5.85-4.8 5.85s-4.8-2.95-4.8-5.85z"
      />
      <path
        fill="currentColor"
        d="M14.2 18.2c0-1.2.9-2.15 2-2.15.7 0 1.3.35 1.65.9.35-.55 1-.9 1.65-.9 1.1 0 2 .95 2 2.15 0 2.2-3.65 4.4-3.65 4.4s-3.65-2.2-3.65-4.4z"
      />
      <path
        fill="currentColor"
        d="M10.5 36.5c0-9.4 7.85-17 17.5-17s17.5 7.6 17.5 17c0 1.65-1.35 2.85-3 2.85H13.5c-1.65 0-3-1.2-3-2.85z"
      />
      <ellipse
        cx="28"
        cy="20.2"
        rx="17.2"
        ry="4.2"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.4}
        opacity={0.7}
      />
      <ellipse
        cx="28"
        cy="20.2"
        rx="15.4"
        ry="2.8"
        fill="currentColor"
        opacity={0.28}
      />
      <path
        fill="currentColor"
        d="M43.8 22.4c2.4-.55 10.2-1.9 14.1-.35 1.15.45 1.7 1.7 1.25 2.85-.4 1.05-1.5 1.65-2.6 1.4-3.55-.8-9.4.55-11.6 1.15-1 .3-1.9-.45-1.7-1.45.25-1.15.55-2.85.55-3.6z"
      />
    </svg>
  );
}
