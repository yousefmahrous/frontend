import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import { errorMessage } from "@/api/client";
import { AdminOnly } from "@/components/Guards";
import { EmptyState, ErrorState } from "@/components/StateViews";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useVendorsAdmin, useUpdateVendorStatus } from "@/hooks/useVendor";
import type { VendorStatus } from "@/api/vendor.api";

export const Route = createFileRoute("/admin/vendors/")({
  ssr: false,
  component: () => (
    <AdminOnly>
      <AdminVendorsPage />
    </AdminOnly>
  ),
});

const LIMIT = 10;

const STATUS_BADGE: Record<VendorStatus, string> = {
  pending: "bg-amber-100 text-amber-700 hover:bg-amber-100",
  active: "bg-green-100 text-green-700 hover:bg-green-100",
  suspended: "bg-destructive/10 text-destructive hover:bg-destructive/10",
  rejected: "bg-destructive/10 text-destructive hover:bg-destructive/10",
};

function AdminVendorsPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const { data, isLoading, isError, error, refetch } = useVendorsAdmin({
    page,
    limit: LIMIT,
    ...(statusFilter ? { status: statusFilter } : {}),
  });
  const updateStatus = useUpdateVendorStatus();

  const vendors = data?.items ?? [];
  const pagination = data?.pagination;

  const changeStatus = async (id: number, status: VendorStatus) => {
    try {
      await updateStatus.mutateAsync({ id, status });
      toast.success(t("adminVendors.statusUpdated"));
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold md:text-3xl">{t("adminVendors.title")}</h1>
        <Select
          value={statusFilter || "all"}
          onValueChange={(value) => {
            setStatusFilter(value === "all" ? "" : value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("adminVendors.filterAll")}</SelectItem>
            <SelectItem value="pending">{t("adminVendors.status_pending")}</SelectItem>
            <SelectItem value="active">{t("adminVendors.status_active")}</SelectItem>
            <SelectItem value="suspended">{t("adminVendors.status_suspended")}</SelectItem>
            <SelectItem value="rejected">{t("adminVendors.status_rejected")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-14 w-full" />
            ))}
          </div>
        ) : isError ? (
          <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
        ) : !vendors.length ? (
          <EmptyState title={t("adminVendors.noVendors")} />
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">{t("adminVendors.store")}</TableHead>
                  <TableHead className="text-right">{t("adminVendors.owner")}</TableHead>
                  <TableHead className="text-right">{t("adminVendors.status")}</TableHead>
                  <TableHead className="text-right">{t("adminVendors.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendors.map((vendor) => (
                  <TableRow key={vendor.id}>
                    <TableCell className="font-medium">{vendor.store_name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {vendor.owner?.name} <br />
                      <span dir="ltr" className="text-xs">{vendor.owner?.email}</span>
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_BADGE[vendor.status]}>
                        {t(`adminVendors.status_${vendor.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {vendor.status === "pending" && (
                          <>
                            <Button size="sm" onClick={() => void changeStatus(vendor.id, "active")}>
                              {t("adminVendors.approve")}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => void changeStatus(vendor.id, "rejected")}
                            >
                              {t("adminVendors.reject")}
                            </Button>
                          </>
                        )}
                        {vendor.status === "active" && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => void changeStatus(vendor.id, "suspended")}
                          >
                            {t("adminVendors.suspend")}
                          </Button>
                        )}
                        {vendor.status === "suspended" && (
                          <Button size="sm" onClick={() => void changeStatus(vendor.id, "active")}>
                            {t("adminVendors.reactivate")}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
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