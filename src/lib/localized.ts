import type { Lang } from "@/i18n/i18n";

export interface LocalizedText {
  ar: string;
  en: string;
}

export function pickLocalized(
  value: LocalizedText | string | null | undefined,
  lang: Lang,
): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value[lang] || value.ar || value.en || "";
}