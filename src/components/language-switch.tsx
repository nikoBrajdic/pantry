"use client";

import { useLocale } from "@/components/locale-provider";
import { LOCALES, LOCALE_LABELS, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LanguageSwitch() {
  const { locale, setLocale, t } = useLocale();

  return (
    <div
      className="inline-flex items-center rounded-full border border-border bg-card p-0.5"
      role="group"
      aria-label={t("lang.label")}
    >
      {LOCALES.map((item: Locale) => (
        <button
          key={item}
          type="button"
          onClick={() => setLocale(item)}
          className={cn(
            "rounded-full px-2.5 py-1.5 text-xs font-medium transition-colors sm:px-3 sm:text-sm",
            locale === item
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
          aria-pressed={locale === item}
          title={t(item === "en" ? "lang.en" : "lang.hr")}
        >
          {LOCALE_LABELS[item]}
        </button>
      ))}
    </div>
  );
}
