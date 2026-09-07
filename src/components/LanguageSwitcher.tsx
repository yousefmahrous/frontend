import { Languages } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useLang } from "@/i18n/LangProvider";
import { Button } from "@/components/ui/button";

export function LanguageSwitcher() {
  const { t } = useTranslation();
  const { lang, setLang } = useLang();

  return (
    <Button
      variant="ghost"
      size="sm"
      className="gap-1.5"
      onClick={() => setLang(lang === "ar" ? "en" : "ar")}
      aria-label={t("language.switchTo")}
    >
      <Languages className="size-4" />
      {t("language.switchTo")}
    </Button>
  );
}
