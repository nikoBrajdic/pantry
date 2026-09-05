/** CSS object-position helpers for recipe photos. */

export const DEFAULT_IMAGE_POSITION = "50% 50%";

export function parseImagePosition(value?: string | null): { x: number; y: number } {
  if (!value?.trim()) return { x: 50, y: 50 };
  const match = value.trim().match(/^(-?\d+(?:\.\d+)?)%\s+(-?\d+(?:\.\d+)?)%$/);
  if (!match) return { x: 50, y: 50 };
  return {
    x: clampPercent(Number(match[1])),
    y: clampPercent(Number(match[2])),
  };
}

export function formatImagePosition(x: number, y: number): string {
  return `${Math.round(clampPercent(x))}% ${Math.round(clampPercent(y))}%`;
}

export function normalizeImagePosition(value?: string | null): string | undefined {
  if (!value?.trim()) return undefined;
  const { x, y } = parseImagePosition(value);
  const formatted = formatImagePosition(x, y);
  return formatted === DEFAULT_IMAGE_POSITION ? undefined : formatted;
}

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 50;
  return Math.min(100, Math.max(0, value));
}
