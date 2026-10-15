import { createFileRoute } from "@tanstack/react-router";
import { RotateCcw } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { errorMessage } from "@/api/client";
import { VendorOnly } from "@/components/Guards";
import { EmptyState, ErrorState } from "@/components/StateViews";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyVendorReturns } from "@/hooks/useVendor";
import { getRefundStatusMeta } from "@/lib/status";

export const Route = createFileRoute("/vendor/returns/")({
  ssr: false,
  component: () => (
    <VendorOnly>
      <VendorReturnsPage />
    </VendorOnly>
  ),
});

const formatPrice = (amountInPiastres: number) => (amountInPiastres / 100).toFixed(2);

function VendorReturnsPage() {
  const { t, i18n } = useTranslation();
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error, refetch } = useMyVendorReturns({ page, limit: 10 });
  const statusMeta = getRefundStatusMeta(t);
  const locale = i18n.language === "ar" ? "ar-EG" : "en-US";
  const pagination = data?.pagination;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-2 flex items-center gap-3">
        <RotateCcw className="size-6 text-accent" />
        <h1 className="text-2xl font-extrabold">{t("vendorReturns.title")}</h1>
      </div>
      <p className="mb-6 text-sm text-muted-foreground">{t("vendorReturns.frozenNote")}</p>

      {isLoading ? (
        <Skeleton className="h-40 w-full rounded-xl" />
      ) : isError ? (
        <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
      ) : data?.items.length === 0 ? (
        <EmptyState title={t("vendorReturns.empty")} description={t("vendorReturns.emptyDesc")} />
      ) : (
        <div className="space-y-4">
          {data?.items.map((request) => {
            const meta = statusMeta[request.status];
            return (
              <div key={request.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                  <div>
                    <p className="font-bold">{t("vendorReturns.order", { id: request.order_id })}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(request.created_at).toLocaleDateString(locale, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <Badge className={meta.className}>{meta.label}</Badge>
                </div>

                <ul className="my-3 space-y-1 text-sm">
                  {request.items.map((item) => (
                    <li key={item.product_id}>
                      {item.title} <span className="text-muted-foreground">× {item.quantity}</span>
                    </li>
                  ))}
                </ul>

                <p className="text-sm">
                  <span className="text-muted-foreground">{t("vendorReturns.reason")}: </span>
                  {request.reason}
                </p>
                {request.refund_amount !== null && (
                  <p className="mt-1 text-sm">
                    <span className="text-muted-foreground">{t("vendorReturns.amount")}: </span>
                    <span className="font-bold">
                      {formatPrice(request.refund_amount)} {t("productDetails.currency")}
                    </span>
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            disabled={!pagination.hasPreviousPage}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            {t("adminProductsIndex.prev")}
          </Button>
          <span className="text-sm text-muted-foreground">
            {t("adminProductsIndex.pageOf", { current: pagination.currentPage, total: pagination.totalPages })}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={!pagination.hasNextPage}
            onClick={() => setPage((p) => p + 1)}
          >
            {t("adminProductsIndex.next")}
          </Button>
        </div>
      )}
    </div>
  );
}