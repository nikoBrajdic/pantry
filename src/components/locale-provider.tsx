"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  LOCALE_KEY,
  isLocale,
  translate,
  type Locale,
  type MessageKey,
  type TranslateValues,
} from "@/lib/i18n";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey, values?: TranslateValues) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function readStoredLocale(): Locale {
  if (typeof window === "undefined") return "en";
  const value = window.localStorage.getItem(LOCALE_KEY);
  return isLocale(value) ? value : "en";
}

function applyDocumentLang(locale: Locale) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = locale === "hr" ? "hr" : "en";
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const next = readStoredLocale();
    setLocaleState(next);
    applyDocumentLang(next);
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    window.localStorage.setItem(LOCALE_KEY, next);
    applyDocumentLang(next);
  }, []);

  const t = useCallback(
    (key: MessageKey, values?: TranslateValues) => translate(locale, key, values),
    [locale],
  );

  const value = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used inside LocaleProvider.");
  }
  return context;
}
