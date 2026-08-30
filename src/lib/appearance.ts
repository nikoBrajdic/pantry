export const APPEARANCE_MODE_KEY = "pantry:appearance-mode";
export const PALETTE_KEY = "pantry:palette";
export const PROFILE_ICON_KEY = "pantry:profile-icon";

export type AppearanceMode = "light" | "dark" | "system";
export type PaletteId =
  | "sage"
  | "green"
  | "red"
  | "yellow"
  | "blue"
  | "pink"
  | "orange"
  | "purple"
  | "turquoise"
  | "mint"
  | "lilac"
  | "sky"
  | "peach"
  | "blush"
  | "butter"
  | "mist"
  | "lavender";

export type ProfileIconId =
  | "male-spoon"
  | "male-whisk"
  | "female-spatula"
  | "female-ladle"
  | "cat"
  | "dog";

export const APPEARANCE_MODES: { id: AppearanceMode; label: string; hint: string }[] = [
  { id: "light", label: "Light", hint: "Always light" },
  { id: "dark", label: "Dark", hint: "Always dark" },
  { id: "system", label: "System", hint: "Match device setting" },
];

export const PROFILE_ICONS: {
  id: ProfileIconId;
  label: string;
  src: string;
}[] = [
  {
    id: "male-spoon",
    label: "Chef with spoon",
    src: "/profile-icons/avatar-chef-male-spoon.png?v=4",
  },
  {
    id: "male-whisk",
    label: "Chef with whisk",
    src: "/profile-icons/avatar-chef-male-whisk.png?v=4",
  },
  {
    id: "female-spatula",
    label: "Chef with spatula",
    src: "/profile-icons/avatar-chef-female-spatula.png?v=4",
  },
  {
    id: "female-ladle",
    label: "Chef with ladle",
    src: "/profile-icons/avatar-chef-female-ladle.png?v=4",
  },
  {
    id: "cat",
    label: "Cat chef",
    src: "/profile-icons/avatar-chef-cat.png?v=4",
  },
  {
    id: "dog",
    label: "Dog chef",
    src: "/profile-icons/avatar-chef-dog.png?v=4",
  },
];

export const PALETTES: { id: PaletteId; label: string; swatch: string }[] = [
  { id: "sage", label: "Sage", swatch: "oklch(0.42 0.07 155)" },
  { id: "green", label: "Matcha", swatch: "oklch(0.45 0.12 142)" },
  { id: "mint", label: "Mint", swatch: "oklch(0.82 0.06 165)" },
  { id: "turquoise", label: "Sea salt", swatch: "oklch(0.55 0.1 195)" },
  { id: "sky", label: "Cotton candy", swatch: "oklch(0.82 0.06 230)" },
  { id: "blue", label: "Blueberry", swatch: "oklch(0.48 0.12 250)" },
  { id: "lilac", label: "Lilac", swatch: "oklch(0.82 0.06 300)" },
  { id: "lavender", label: "Lavender", swatch: "oklch(0.78 0.07 290)" },
  { id: "purple", label: "Plum", swatch: "oklch(0.48 0.14 300)" },
  { id: "blush", label: "Rose", swatch: "oklch(0.86 0.05 10)" },
  { id: "pink", label: "Dragonfruit", swatch: "oklch(0.62 0.14 350)" },
  { id: "peach", label: "Peach", swatch: "oklch(0.86 0.06 50)" },
  { id: "orange", label: "Orange", swatch: "oklch(0.62 0.14 55)" },
  { id: "butter", label: "Butter", swatch: "oklch(0.9 0.07 95)" },
  { id: "yellow", label: "Lemon", swatch: "oklch(0.72 0.12 95)" },
  { id: "red", label: "Tomato", swatch: "oklch(0.48 0.14 25)" },
  { id: "mist", label: "Mochi", swatch: "oklch(0.88 0.02 240)" },
];

export function isAppearanceMode(value: string | null): value is AppearanceMode {
  return value === "light" || value === "dark" || value === "system";
}

export function isPaletteId(value: string | null): value is PaletteId {
  return PALETTES.some((palette) => palette.id === value);
}

export function isProfileIconId(value: string | null): value is ProfileIconId {
  return PROFILE_ICONS.some((icon) => icon.id === value);
}

export function profileIconSrc(id: ProfileIconId | null | undefined) {
  if (!id) return null;
  return PROFILE_ICONS.find((icon) => icon.id === id)?.src ?? null;
}

export function resolveDark(mode: AppearanceMode) {
  if (mode === "dark") return true;
  if (mode === "light") return false;
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function applyAppearance(mode: AppearanceMode, palette: PaletteId) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("dark", resolveDark(mode));
  root.dataset.palette = palette;
}
