import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { DEFAULT_LANG, isSupportedLang, LANG_COOKIE_NAME, type Lang } from "./i18n";

export const getServerLang = createServerFn({ method: "GET" }).handler((): Lang => {
  const cookieValue = getCookie(LANG_COOKIE_NAME);
  return isSupportedLang(cookieValue) ? cookieValue : DEFAULT_LANG;
});