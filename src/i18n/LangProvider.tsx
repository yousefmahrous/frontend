import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { I18nextProvider } from "react-i18next";

import { createI18nInstance, type Lang } from "./i18n";
import { applyDocumentDirection, writeLangCookie } from "./langCookie";

type LangContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
};

const LangContext = createContext<LangContextValue | null>(null);

export function LangProvider({
  initialLang,
  children,
}: {
  initialLang: Lang;
  children: ReactNode;
}) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  const i18n = useMemo(() => createI18nInstance(initialLang), [initialLang]);

  const setLang = (next: Lang) => {
    if (next === lang) return;
    setLangState(next);
    void i18n.changeLanguage(next);
    writeLangCookie(next);
    applyDocumentDirection(next);
  };

  return (
    <I18nextProvider i18n={i18n}>
      <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>
    </I18nextProvider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used within a LangProvider");
  return ctx;
}