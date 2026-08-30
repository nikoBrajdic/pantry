export const LOCALES = ["en", "hr"] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_KEY = "pantry:locale";

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "EN",
  hr: "HR",
};

export function isLocale(value: string | null): value is Locale {
  return value === "en" || value === "hr";
}
