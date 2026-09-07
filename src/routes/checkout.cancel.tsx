import { createFileRoute, Link } from "@tanstack/react-router";
import { XCircle } from "lucide-react";

import { Protected } from "@/components/Guards";
import { Button } from "@/components/ui/button";

import en from "@/i18n/locales/en.json";
import ar from "@/i18n/locales/ar.json";
import { DEFAULT_LANG, type Lang } from "@/i18n/i18n";
import { useTranslation } from "react-i18next";
export const Route = createFileRoute("/checkout/cancel")({
  ssr: false,
  head: ({ match }) => {
    const lang = (match.context as { lang?: Lang }).lang ?? DEFAULT_LANG;
    const meta = (lang === "ar" ? ar : en).pageMeta.checkoutCancelPage;
    return {
      meta: [
        { title: meta.title },
      ],
    };
  },
  component: () => (
    <Protected>
      <CancelPage />
    </Protected>
  ),
});

function CancelPage() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-4 py-20 text-center">
      <XCircle className="size-16 text-destructive" />
      <h1 className="text-2xl font-extrabold">{t("checkoutCancel.title")}</h1>
      <p className="text-muted-foreground">{t("checkoutCancel.body")}</p>
      <Button asChild>
        <Link to="/cart">{t("checkoutCancel.backToCart")}</Link>
      </Button>
    </div>
  );
}