import { createFileRoute } from "@tanstack/react-router";
import { Wallet } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { errorMessage } from "@/api/client";
import type { VendorBalance } from "@/api/payout.api";
import { RecordPayoutDialog } from "@/components/admin/RecordPayoutDialog";
import { AdminOnly } from "@/components/Guards";
import { EmptyState, ErrorState } from "@/components/StateViews";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAdminPayouts, useVendorBalances } from "@/hooks/usePayout";

export const Route = createFileRoute("/admin/payouts/")({
  ssr: false,
  component: () => (
    <AdminOnly>
      <AdminPayoutsPage />
    </AdminOnly>
  ),
});

const formatPrice = (amountInPiastres: number) => (amountInPiastres / 100).toFixed(2);

function AdminPayoutsPage() {
  const { t, i18n } = useTranslation();
  const balances = useVendorBalances();
  const [page, setPage] = useState(1);
  const history = useAdminPayouts({ page, limit: 10 });
  const [selected, setSelected] = useState<VendorBalance | null>(null);
  const currency = t("productDetails.currency");
  const locale = i18n.language === "ar" ? "ar-EG" : "en-US";

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 flex items-center gap-3">
        <Wallet className="size-6 text-accent" />
        <h1 className="text-2xl font-extrabold">{t("adminPayouts.title")}</h1>
      </div>

      <h2 className="mb-1 text-lg font-bold">{t("adminPayouts.balances")}</h2>
      {balances.data && (
        <p className="mb-3 text-sm text-muted-foreground">
          {t("adminPayouts.holdNote", { days: balances.data.hold_days })}
        </p>
      )}

      {balances.isLoading ? (
        <Skeleton className="h-40 w-full rounded-xl" />
      ) : balances.isError ? (
        <ErrorState message={errorMessage(balances.error)} onRetry={() => void balances.refetch()} />
      ) : balances.data?.items.length === 0 ? (
        <EmptyState title={t("adminPayouts.noVendors")} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">{t("adminPayouts.store")}</TableHead>
                <TableHead className="text-right">{t("adminPayouts.available")}</TableHead>
                <TableHead className="text-right">{t("adminPayouts.pending")}</TableHead>
                <TableHead className="text-right">{t("adminPayouts.onHold")}</TableHead>
                <TableHead className="text-right">{t("adminPayouts.paidOut")}</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {balances.data?.items.map((row) => (
                <TableRow key={row.vendor.id}>
                  <TableCell className="font-medium">{row.vendor.store_name}</TableCell>
                  <TableCell className="font-bold">
                    {formatPrice(row.available)} {currency}
                  </TableCell>
                  <TableCell>{formatPrice(row.pending)}</TableCell>
                  <TableCell>{formatPrice(row.on_hold)}</TableCell>
                  <TableCell>{formatPrice(row.paid_out)}</TableCell>
                  <TableCell>
                    <Button size="sm" disabled={row.available <= 0} onClick={() => setSelected(row)}>
                      {t("adminPayouts.action")}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <h2 className="mb-3 mt-10 text-lg font-bold">{t("adminPayouts.history")}</h2>

      {history.isLoading ? (
        <Skeleton className="h-32 w-full rounded-xl" />
      ) : history.isError ? (
        <ErrorState message={errorMessage(history.error)} onRetry={() => void history.refetch()} />
      ) : history.data?.items.length === 0 ? (
        <EmptyState title={t("adminPayouts.noPayouts")} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">{t("adminPayouts.date")}</TableHead>
                <TableHead className="text-right">{t("adminPayouts.store")}</TableHead>
                <TableHead className="text-right">{t("adminPayouts.amount")}</TableHead>
                <TableHead className="text-right">{t("adminPayouts.reference")}</TableHead>
                <TableHead className="text-right">{t("adminPayouts.orders")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.data?.items.map((payout) => (
                <TableRow key={payout.id}>
                  <TableCell>
                    {new Date(payout.created_at).toLocaleDateString(locale, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </TableCell>
                  <TableCell>{payout.vendor?.store_name ?? "—"}</TableCell>
                  <TableCell className="font-bold">
                    {formatPrice(payout.amount)} {currency}
                  </TableCell>
                  <TableCell dir="ltr" className="font-mono text-sm">
                    {payout.reference ?? "—"}
                  </TableCell>
                  <TableCell>{t("adminPayouts.ordersCount", { count: payout.orders_count })}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {history.data && history.data.pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            disabled={!history.data.pagination.hasPreviousPage}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            {t("adminProductsIndex.prev")}
          </Button>
          <span className="text-sm text-muted-foreground">
            {t("adminProductsIndex.pageOf", {
              current: history.data.pagination.currentPage,
              total: history.data.pagination.totalPages,
            })}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={!history.data.pagination.hasNextPage}
            onClick={() => setPage((p) => p + 1)}
          >
            {t("adminProductsIndex.next")}
          </Button>
        </div>
      )}

      <RecordPayoutDialog balance={selected} onClose={() => setSelected(null)} />
    </div>
  );
}