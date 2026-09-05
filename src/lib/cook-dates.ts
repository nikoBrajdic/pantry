import type { Locale } from "@/lib/i18n";
import type { CookLog } from "@/lib/types";

export function localeTag(locale: Locale) {
  return locale === "hr" ? "hr-HR" : "en-GB";
}

export function localDayKeyFromDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function localDayKey(iso: string) {
  return localDayKeyFromDate(new Date(iso));
}

export function formatCookTime(iso: string, locale: Locale) {
  return new Intl.DateTimeFormat(localeTag(locale), {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatCookDay(iso: string, locale: Locale) {
  return new Intl.DateTimeFormat(localeTag(locale), {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

export function formatCookShortDate(iso: string, locale: Locale) {
  return new Intl.DateTimeFormat(localeTag(locale), {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export function groupCookLogsByDay(logs: CookLog[]) {
  const groups: { key: string; date: Date; logs: CookLog[] }[] = [];
  const byKey = new Map<string, { key: string; date: Date; logs: CookLog[] }>();
  for (const log of logs) {
    const key = localDayKey(log.cookedAt);
    const existing = byKey.get(key);
    if (existing) {
      existing.logs.push(log);
      continue;
    }
    const group = { key, date: new Date(log.cookedAt), logs: [log] };
    byKey.set(key, group);
    groups.push(group);
  }
  return groups;
}
