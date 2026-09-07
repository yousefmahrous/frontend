import i18next, { type i18n as I18nInstance } from "i18next";
import { initReactI18next } from "react-i18next";

import ar from "./locales/ar.json";
import en from "./locales/en.json";

export const SUPPORTED_LANGS = ["ar", "en"] as const;
export type Lang = (typeof SUPPORTED_LANGS)[number];

export const DEFAULT_LANG: Lang = "ar";

export const DIR_BY_LANG: Record<Lang, "rtl" | "ltr"> = {
  ar: "rtl",
  en: "ltr",
};

export const LANG_COOKIE_NAME = "lang";

const resources = {
  ar: { translation: ar },
  en: { translation: en },
};

export function isSupportedLang(value: string | undefined | null): value is Lang {
  return !!value && (SUPPORTED_LANGS as readonly string[]).includes(value);
}

export function createI18nInstance(lang: Lang): I18nInstance {
  const instance = i18next.createInstance();
  instance.use(initReactI18next).init({
    lng: lang,
    fallbackLng: DEFAULT_LANG,
    resources,
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });
  return instance;
}