import { createClientOnlyFn } from "@tanstack/react-start";

import { DEFAULT_LANG, DIR_BY_LANG, isSupportedLang, LANG_COOKIE_NAME, type Lang } from "./i18n";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export const readLangCookie = createClientOnlyFn((): Lang => {
  const match = document.cookie.match(new RegExp(`(?:^|; )${LANG_COOKIE_NAME}=([^;]+)`));
  const value = match ? decodeURIComponent(match[1] ?? "") : undefined;
  return isSupportedLang(value) ? value : DEFAULT_LANG;
});

export const writeLangCookie = createClientOnlyFn((lang: Lang) => {
  document.cookie = `${LANG_COOKIE_NAME}=${lang}; path=/; max-age=${ONE_YEAR_SECONDS}; SameSite=Lax`;
});

export const applyDocumentDirection = createClientOnlyFn((lang: Lang) => {
  document.documentElement.lang = lang;
  document.documentElement.dir = DIR_BY_LANG[lang];
});