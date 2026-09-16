import { createFileRoute } from "@tanstack/react-router";
import { ClipboardList } from "lucide-react";
import { useState } from "react";

import { errorMessage } from "@/api/client";
import type { OrderStatus } from "@/api/order.api";
import { AdminOnly } from "@/components/Guards";
import { getOrderStatusMeta } from "@/lib/status";
import { EmptyState, ErrorState } from "@/components/StateViews";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAdminOrders } from "@/hooks/useOrder";

import en from "@/i18n/locales/en.json";
import ar from "@/i18n/locales/ar.json";
import { DEFAULT_LANG, type Lang } from "@/i18n/i18n";
import { useTranslation } from "react-i18next";
export const Route = createFileRoute("/admin/orders/")({
  ssr: false,
  head: ({ match }) => {
    const lang = (match.context as { lang?: Lang }).lang ?? DEFAULT_LANG;
    const meta = (lang === "ar" ? ar : en).pageMeta.adminOrdersIndex;
    return {
      meta: [
        { title: meta.title },
        { name: "description", content: meta.description },
        { name: "robots", content: "noindex" },
      ],
    };
  },
  component: () => (
    <AdminOnly>
      <AdminOrdersPage />
    </AdminOnly>
  ),
});

const LIMIT = 15;

function formatPrice(amountInPiastres: number) {
  return (amountInPiastres / 100).toFixed(2);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" });
}

function AdminOrdersPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<OrderStatus | "">("");

  const { data, isLoading, isError, error, refetch } = useAdminOrders({
    page,
    limit: LIMIT,
    status,
  });

  const orders = data?.items ?? [];
  const pagination = data?.pagination;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold md:text-3xl">
            <ClipboardList className="size-6 text-accent" />
            {t("adminOrders.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {pagination ? t("adminOrders.countLabel", { count: pagination.totalCount }) : t("adminOrders.loading")}
          </p>
        </div>

        <Select
          value={status || "all"}
          onValueChange={(value) => {
            setStatus(value === "all" ? "" : (value as OrderStatus));
            setPage(1);
          }}
        >
          <SelectTrigger className="w-52">
            <SelectValue placeholder={t("common.allStatuses")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.allStatuses")}</SelectItem>
            <SelectItem value="pending">{t("common.pendingPayment")}</SelectItem>
            <SelectItem value="paid">{t("common.paid")}</SelectItem>
            <SelectItem value="failed">{t("adminOrders.paymentFailed")}</SelectItem>
            <SelectItem value="cancelled">{t("common.cancelled")}</SelectItem>
            <SelectItem value="return_requested">{t("adminOrders.refundRequested")}</SelectItem>
            <SelectItem value="return_approved">{t("common.pendingBookReceipt")}</SelectItem>
            <SelectItem value="refunded">{t("common.refunded")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-16 w-full" />
            ))}
          </div>
        ) : isError ? (
          <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
        ) : !orders.length ? (
          <EmptyState
            variant={status ? "search" : "empty"}
            title={t("adminOrders.empty")}
            description={status ? t("adminOrders.noneWithStatus") : t("adminOrders.noOrdersYet")}
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">{t("common.order")}</TableHead>
                  <TableHead className="text-right">{t("common.customer")}</TableHead>
                  <TableHead className="text-right">{t("adminOrders.books")}</TableHead>
                  <TableHead className="text-right">{t("common.total")}</TableHead>
                  <TableHead className="text-right">{t("common.status")}</TableHead>
                  <TableHead className="text-right">{t("common.date")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => {
                  const meta = getOrderStatusMeta(t)[order.status];
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">#{order.id}</TableCell>
                      <TableCell>
                        {order.user ? (
                          <div>
                            <p className="font-medium">{order.user.name}</p>
                            <p className="text-xs text-muted-foreground">{order.user.email}</p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">{t("common.deletedUser")}</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-56 truncate text-muted-foreground">
                        {order.items.map((item) => `${item.title} ×${item.quantity}`).join(t("common.listSeparator"))}
                      </TableCell>
                      <TableCell dir="ltr" className="text-muted-foreground">
                        {formatPrice(order.total_amount)} {t("bookDetails.currency")}
                      </TableCell>
                      <TableCell>
                        <Badge className={meta.className}>{meta.label}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(order.created_at)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            disabled={!pagination.hasPreviousPage}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          >
            {t("adminOrders.prev")}
          </Button>
          <span className="text-sm text-muted-foreground">
            {t("adminOrders.pageOf", { current: pagination.currentPage, total: pagination.totalPages })}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={!pagination.hasNextPage}
            onClick={() => setPage((prev) => prev + 1)}
          >
            {t("adminOrders.next")}
          </Button>
        </div>
      )}
    </div>
  );
}