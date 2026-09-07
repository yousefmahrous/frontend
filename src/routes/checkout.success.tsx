import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Clock, Loader2, XCircle } from "lucide-react";

import { Protected } from "@/components/Guards";
import { Button } from "@/components/ui/button";
import { useLatestOrder, useOrder } from "@/hooks/useOrder";

import en from "@/i18n/locales/en.json";
import ar from "@/i18n/locales/ar.json";
import { DEFAULT_LANG, type Lang } from "@/i18n/i18n";
import { useTranslation } from "react-i18next";
export const Route = createFileRoute("/checkout/success")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({
    order_id:
      typeof search["order_id"] === "string" ? Number(search["order_id"]) : undefined,
  }),
  head: ({ match }) => {
    const lang = (match.context as { lang?: Lang }).lang ?? DEFAULT_LANG;
    const meta = (lang === "ar" ? ar : en).pageMeta.checkoutSuccessPage;
    return {
      meta: [
        { title: meta.title },
      ],
    };
  },
  component: () => (
    <Protected>
      <SuccessPage />
    </Protected>
  ),
});

function SuccessPage() {
  const { t } = useTranslation();
  const { order_id } = Route.useSearch();

  const byId = useOrder(order_id);
  const useFallback = !order_id || byId.isError;
  const fallback = useLatestOrder(useFallback);

  const order = useFallback ? fallback.data : byId.data;
  const isLoading = useFallback ? fallback.isLoading : byId.isLoading;
  const isError = useFallback ? fallback.isError : byId.isError;

  if (isError) {
    return (
      <StatusView
        icon={<XCircle className="size-16 text-destructive" />}
        title={t("checkoutSuccess.orderNotFound")}
        description={t("checkoutSuccess.orderNotFoundDesc")}
      />
    );
  }

  if (isLoading || !order) {
    return (
      <StatusView
        icon={<Loader2 className="size-16 animate-spin text-muted-foreground" />}
        title={t("checkoutSuccess.confirmingBody")}
        description={t("checkoutSuccess.confirmingBodyDesc")}
      />
    );
  }

  if (order.status === "paid") {
    return (
      <StatusView
        icon={<CheckCircle2 className="size-16 text-green-600" />}
        title={t("checkoutSuccess.success")}
        description={t("checkoutSuccess.successDesc")}
      />
    );
  }

  if (order.status === "pending") {
    return (
      <StatusView
        icon={<Clock className="size-16 animate-pulse text-amber-500" />}
        title={t("checkoutSuccess.confirmingTitle")}
        description={t("checkoutSuccess.confirmingTitleDesc")}
      />
    );
  }

  return (
    <StatusView
      icon={<XCircle className="size-16 text-destructive" />}
      title={t("checkoutSuccess.incomplete")}
      description={t("checkoutSuccess.incompleteDesc")}
      showCartLink
    />
  );
}

function StatusView({
  icon,
  title,
  description,
  showCartLink,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  showCartLink?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-4 py-20 text-center">
      {icon}
      <h1 className="text-2xl font-extrabold">{title}</h1>
      <p className="text-muted-foreground">{description}</p>
      <Button asChild>
        <Link to={showCartLink ? "/cart" : "/books"}>
          {showCartLink ? t("checkoutSuccess.backToCart") : t("checkoutSuccess.browseMoreBooks")}
        </Link>
      </Button>
    </div>
  );
}