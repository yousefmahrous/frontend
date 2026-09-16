import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Clock, PackageCheck, RotateCcw, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { errorMessage } from "@/api/client";
import type { RefundRequest, RefundRequestStatus } from "@/api/refund.api";
import { AdminOnly } from "@/components/Guards";
import { EmptyState, ErrorState } from "@/components/StateViews";
import { getRefundStatusMeta } from "@/lib/status";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import en from "@/i18n/locales/en.json";
import ar from "@/i18n/locales/ar.json";
import { DEFAULT_LANG, type Lang } from "@/i18n/i18n";
import { useTranslation } from "react-i18next";
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
import {
  useAdminRefundRequests,
  useApproveRefundRequest,
  useCancelRefundRequest,
  useCompleteRefundRequest,
  useRejectRefundRequest,
} from "@/hooks/useRefund";

export const Route = createFileRoute("/admin/refunds/")({
  ssr: false,
  head: ({ match }) => {
    const lang = (match.context as { lang?: Lang }).lang ?? DEFAULT_LANG;
    const meta = (lang === "ar" ? ar : en).pageMeta.adminRefundsIndex;
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
      <AdminRefundsPage />
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

function AdminRefundsPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<RefundRequestStatus | "">("pending");
  const [confirmComplete, setConfirmComplete] = useState<RefundRequest | null>(null);

  const { data, isLoading, isError, error, refetch } = useAdminRefundRequests({
    page,
    limit: LIMIT,
    status,
  });

  const approveMutation = useApproveRefundRequest();
  const rejectMutation = useRejectRefundRequest();
  const cancelMutation = useCancelRefundRequest();
  const completeMutation = useCompleteRefundRequest();

  const requests = data?.items ?? [];
  const pagination = data?.pagination;

  function handleApprove(id: number) {
    approveMutation.mutate(id, {
      onSuccess: () => toast.success(t("adminRefunds.approvedToast")),
      onError: (err) => toast.error(errorMessage(err)),
    });
  }

  function handleReject(id: number) {
    rejectMutation.mutate(
      { id },
      {
        onSuccess: () => toast.success(t("adminRefunds.rejectedToast")),
        onError: (err) => toast.error(errorMessage(err)),
      },
    );
  }

  function handleCancel(id: number) {
    cancelMutation.mutate(
      { id },
      {
        onSuccess: () => toast.success(t("adminRefunds.cancelledToast")),
        onError: (err) => toast.error(errorMessage(err)),
      },
    );
  }

  function handleConfirmComplete() {
    if (!confirmComplete) return;
    completeMutation.mutate(confirmComplete.id, {
      onSuccess: () => {
        toast.success(t("adminRefunds.completedToast"));
        setConfirmComplete(null);
      },
      onError: (err) => {
        toast.error(errorMessage(err));
        setConfirmComplete(null);
      },
    });
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold md:text-3xl">
            <RotateCcw className="size-6 text-accent" />
            {t("adminRefunds.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {pagination ? t("adminRefunds.countLabel", { count: pagination.totalCount }) : t("adminRefunds.loading")}
          </p>
        </div>

        <Select
          value={status || "all"}
          onValueChange={(value) => {
            setStatus(value === "all" ? "" : (value as RefundRequestStatus));
            setPage(1);
          }}
        >
          <SelectTrigger className="w-52">
            <SelectValue placeholder={t("common.allStatuses")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.allStatuses")}</SelectItem>
            <SelectItem value="pending">{t("adminRefunds.pendingReview")}</SelectItem>
            <SelectItem value="awaiting_return">{t("common.pendingBookReceipt")}</SelectItem>
            <SelectItem value="completed">{t("common.refunded")}</SelectItem>
            <SelectItem value="rejected">{t("adminRefunds.rejected")}</SelectItem>
            <SelectItem value="cancelled">{t("common.cancelled")}</SelectItem>
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
        ) : !requests.length ? (
          <EmptyState
            variant={status ? "search" : "empty"}
            title={t("adminRefunds.empty")}
            description={status ? t("adminRefunds.noneWithStatus") : t("adminRefunds.noneYet")}
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">{t("common.order")}</TableHead>
                  <TableHead className="text-right">{t("common.customer")}</TableHead>
                  <TableHead className="text-right">{t("adminRefunds.reason")}</TableHead>
                  <TableHead className="text-right">{t("common.total")}</TableHead>
                  <TableHead className="text-right">{t("common.status")}</TableHead>
                  <TableHead className="text-right">{t("common.date")}</TableHead>
                  <TableHead className="text-right">{t("adminRefunds.action")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => {
                  const meta = getRefundStatusMeta(t)[request.status];
                  return (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">#{request.order_id}</TableCell>
                      <TableCell>
                        {request.user ? (
                          <div>
                            <p className="font-medium">{request.user.name}</p>
                            <p className="text-xs text-muted-foreground">{request.user.email}</p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">{t("common.deletedUser")}</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-56 truncate text-muted-foreground" title={request.reason}>
                        {request.reason}
                      </TableCell>
                      <TableCell dir="ltr" className="text-muted-foreground">
                        {request.order ? `${formatPrice(request.order.total_amount)} ${t("bookDetails.currency")}` : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge className={meta.className}>{meta.label}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(request.created_at)}
                      </TableCell>
                      <TableCell>
                        <RequestActions
                          request={request}
                          onApprove={() => handleApprove(request.id)}
                          onReject={() => handleReject(request.id)}
                          onCancel={() => handleCancel(request.id)}
                          onComplete={() => setConfirmComplete(request)}
                          isBusy={
                            approveMutation.isPending ||
                            rejectMutation.isPending ||
                            cancelMutation.isPending
                          }
                        />
                      </TableCell>
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
            {t("adminRefunds.prev")}
          </Button>
          <span className="text-sm text-muted-foreground">
            {t("adminRefunds.pageOf", { current: pagination.currentPage, total: pagination.totalPages })}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={!pagination.hasNextPage}
            onClick={() => setPage((prev) => prev + 1)}
          >
            {t("adminRefunds.next")}
          </Button>
        </div>
      )}

      <AlertDialog
        open={Boolean(confirmComplete)}
        onOpenChange={(open) => !open && setConfirmComplete(null)}
      >
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("adminRefunds.confirmReceiptAction")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("adminRefunds.completeConfirmDesc", { id: confirmComplete?.order_id })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleConfirmComplete()}>
              {t("adminRefunds.confirmCompleteAction")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function RequestActions({
  request,
  onApprove,
  onReject,
  onCancel,
  onComplete,
  isBusy,
}: {
  request: RefundRequest;
  onApprove: () => void;
  onReject: () => void;
  onCancel: () => void;
  onComplete: () => void;
  isBusy: boolean;
}) {
  const { t } = useTranslation();
  if (request.status === "pending") {
    return (
      <div className="flex gap-2">
        <Button size="sm" variant="outline" disabled={isBusy} onClick={onApprove}>
          <CheckCircle2 className="ms-1 size-3.5" />
          {t("adminRefunds.approve")}
        </Button>
        <Button size="sm" variant="ghost" className="text-destructive" disabled={isBusy} onClick={onReject}>
          <XCircle className="ms-1 size-3.5" />
          {t("adminRefunds.reject")}
        </Button>
      </div>
    );
  }

  if (request.status === "awaiting_return") {
    return (
      <div className="flex gap-2">
        <Button size="sm" onClick={onComplete}>
          <PackageCheck className="ms-1 size-3.5" />
          {t("adminRefunds.confirmReceiptShort")}
        </Button>
        <Button size="sm" variant="ghost" className="text-destructive" disabled={isBusy} onClick={onCancel}>
          {t("adminRefunds.cancel")}
        </Button>
      </div>
    );
  }

  return <Clock className="size-4 text-muted-foreground" aria-label={t("adminRefunds.noActionAvailable")} />;
}