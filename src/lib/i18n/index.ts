import { en, type MessageKey } from "./en";
import { hr } from "./hr";
import type { Locale } from "./types";

export type { MessageKey } from "./en";
export type { Locale } from "./types";
export { LOCALES, LOCALE_KEY, LOCALE_LABELS, isLocale } from "./types";

const dictionaries: Record<Locale, Record<MessageKey, string>> = {
  en: en as Record<MessageKey, string>,
  hr,
};

export type TranslateValues = Record<string, string | number>;

export function translate(
  locale: Locale,
  key: MessageKey,
  values?: TranslateValues,
): string {
  let message = dictionaries[locale][key] ?? dictionaries.en[key] ?? key;
  if (values) {
    for (const [name, value] of Object.entries(values)) {
      message = message.replaceAll(`{${name}}`, String(value));
    }
  }
  return message;
}

export function tagMessageKey(id: string): MessageKey | null {
  const key = `tag.${id}` as MessageKey;
  return key in en ? key : null;
}

export function difficultyMessageKey(
  id: string,
  kind: "label" | "hint" = "label",
): MessageKey | null {
  const key = (
    kind === "hint" ? `difficulty.${id}Hint` : `difficulty.${id}`
  ) as MessageKey;
  return key in en ? key : null;
}

export function paceMessageKey(
  id: string,
  kind: "label" | "hint" = "label",
): MessageKey | null {
  const key = (kind === "hint" ? `pace.${id}Hint` : `pace.${id}`) as MessageKey;
  return key in en ? key : null;
}
