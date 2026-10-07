import { createFileRoute } from "@tanstack/react-router";
import { Truck } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { errorMessage } from "@/api/client";
import type { FulfillmentStatus } from "@/api/order.api";
import { VendorOnly } from "@/components/Guards";
import { EmptyState, ErrorState } from "@/components/StateViews";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { VendorOrderCard } from "@/components/vendor/VendorOrderCard";
import { useMyVendorOrders } from "@/hooks/useVendor";
import { getFulfillmentStatusMeta } from "@/lib/status";

export const Route = createFileRoute("/vendor/orders/")({
  ssr: false,
  component: () => (
    <VendorOnly>
      <VendorOrdersPage />
    </VendorOnly>
  ),
});

const LIMIT = 10;
const FILTERS: FulfillmentStatus[] = ["pending", "processing", "shipped", "delivered"];

function VendorOrdersPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<FulfillmentStatus | undefined>();
  const { data, isLoading, isError, error, refetch } = useMyVendorOrders({ page, limit: LIMIT, status });
  const statusMeta = getFulfillmentStatusMeta(t);

  const orders = data?.items ?? [];
  const pagination = data?.pagination;

  function changeFilter(next: FulfillmentStatus | undefined) {
    setStatus(next);
    setPage(1);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex items-center gap-3">
        <Truck className="size-6 text-accent" />
        <h1 className="text-2xl font-extrabold">{t("vendorOrders.title")}</h1>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <Button size="sm" variant={status ? "outline" : "default"} onClick={() => changeFilter(undefined)}>
          {t("vendorOrders.allStatuses")}
        </Button>
        {FILTERS.map((value) => (
          <Button
            key={value}
            size="sm"
            variant={status === value ? "default" : "outline"}
            onClick={() => changeFilter(value)}
          >
            {statusMeta[value].label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
      ) : orders.length === 0 ? (
        <EmptyState title={t("vendorOrders.empty")} description={t("vendorOrders.emptyDesc")} />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <VendorOrderCard key={order.id} order={order} />
          ))}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            disabled={!pagination.hasPreviousPage}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          >
            {t("adminBooksIndex.prev")}
          </Button>
          <span className="text-sm text-muted-foreground">
            {t("adminBooksIndex.pageOf", { current: pagination.currentPage, total: pagination.totalPages })}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={!pagination.hasNextPage}
            onClick={() => setPage((prev) => prev + 1)}
          >
            {t("adminBooksIndex.next")}
          </Button>
        </div>
      )}
    </div>
  );
}