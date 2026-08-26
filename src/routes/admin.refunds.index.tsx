import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Clock, PackageCheck, RotateCcw, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { errorMessage } from "@/api/client";
import type { RefundRequest, RefundRequestStatus } from "@/api/refund.api";
import { AdminOnly } from "@/components/Guards";
import { EmptyState, ErrorState } from "@/components/StateViews";
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
  head: () => ({
    meta: [
      { title: "طلبات الاسترجاع | مكتبة القراء" },
      { name: "description", content: "لوحة إدارة طلبات استرجاع الأوردرات." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <AdminOnly>
      <AdminRefundsPage />
    </AdminOnly>
  ),
});

const LIMIT = 15;

const STATUS_META: Record<RefundRequestStatus, { label: string; className: string }> = {
  pending: { label: "بانتظار المراجعة", className: "bg-amber-100 text-amber-700 hover:bg-amber-100" },
  awaiting_return: {
    label: "بانتظار استلام الكتاب",
    className: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  },
  completed: {
    label: "تم الاسترجاع",
    className: "bg-green-100 text-green-700 hover:bg-green-100",
  },
  rejected: {
    label: "مرفوض",
    className: "bg-destructive/10 text-destructive hover:bg-destructive/10",
  },
  cancelled: { label: "ملغي", className: "bg-secondary text-muted-foreground hover:bg-secondary" },
};

function formatPrice(amountInPiastres: number) {
  return (amountInPiastres / 100).toFixed(2);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" });
}

function AdminRefundsPage() {
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
      onSuccess: () => toast.success("تمت الموافقة على الطلب، في انتظار استلام الكتاب"),
      onError: (err) => toast.error(errorMessage(err)),
    });
  }

  function handleReject(id: number) {
    rejectMutation.mutate(
      { id },
      {
        onSuccess: () => toast.success("تم رفض طلب الاسترجاع"),
        onError: (err) => toast.error(errorMessage(err)),
      },
    );
  }

  function handleCancel(id: number) {
    cancelMutation.mutate(
      { id },
      {
        onSuccess: () => toast.success("تم إلغاء الطلب، الأوردر رجع لحالته الطبيعية"),
        onError: (err) => toast.error(errorMessage(err)),
      },
    );
  }

  function handleConfirmComplete() {
    if (!confirmComplete) return;
    completeMutation.mutate(confirmComplete.id, {
      onSuccess: () => {
        toast.success("تم تنفيذ الاسترجاع بنجاح عن طريق Stripe");
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
            طلبات الاسترجاع
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {pagination ? `${pagination.totalCount} طلب` : "جاري التحميل…"}
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
            <SelectValue placeholder="كل الحالات" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الحالات</SelectItem>
            <SelectItem value="pending">بانتظار المراجعة</SelectItem>
            <SelectItem value="awaiting_return">بانتظار استلام الكتاب</SelectItem>
            <SelectItem value="completed">تم الاسترجاع</SelectItem>
            <SelectItem value="rejected">مرفوض</SelectItem>
            <SelectItem value="cancelled">ملغي</SelectItem>
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
            title="مفيش طلبات"
            description={status ? "مفيش طلبات بالحالة دي." : "لسه محدش طلب استرجاع."}
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الأوردر</TableHead>
                  <TableHead className="text-right">العميل</TableHead>
                  <TableHead className="text-right">السبب</TableHead>
                  <TableHead className="text-right">الإجمالي</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">التاريخ</TableHead>
                  <TableHead className="text-right">الإجراء</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => {
                  const meta = STATUS_META[request.status];
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
                          <span className="text-muted-foreground">مستخدم محذوف</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-56 truncate text-muted-foreground" title={request.reason}>
                        {request.reason}
                      </TableCell>
                      <TableCell dir="ltr" className="text-muted-foreground">
                        {request.order ? `${formatPrice(request.order.total_amount)} جنيه` : "—"}
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
            السابق
          </Button>
          <span className="text-sm text-muted-foreground">
            صفحة {pagination.currentPage} من {pagination.totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={!pagination.hasNextPage}
            onClick={() => setPage((prev) => prev + 1)}
          >
            التالي
          </Button>
        </div>
      )}

      <AlertDialog
        open={Boolean(confirmComplete)}
        onOpenChange={(open) => !open && setConfirmComplete(null)}
      >
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد استلام الكتاب وتنفيذ الاسترجاع</AlertDialogTitle>
            <AlertDialogDescription>
              متأكد إنك استلمت الكتاب فعليًا من العميل؟ الخطوة دي هتنفّذ استرجاع فلوس حقيقي عن طريق
              Stripe للأوردر #{confirmComplete?.order_id}، ومينفعش يتراجع فيها بعد كده.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleConfirmComplete()}>
              أيوه، استلمت الكتاب ونفّذ الاسترجاع
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
  if (request.status === "pending") {
    return (
      <div className="flex gap-2">
        <Button size="sm" variant="outline" disabled={isBusy} onClick={onApprove}>
          <CheckCircle2 className="ms-1 size-3.5" />
          موافقة
        </Button>
        <Button size="sm" variant="ghost" className="text-destructive" disabled={isBusy} onClick={onReject}>
          <XCircle className="ms-1 size-3.5" />
          رفض
        </Button>
      </div>
    );
  }

  if (request.status === "awaiting_return") {
    return (
      <div className="flex gap-2">
        <Button size="sm" onClick={onComplete}>
          <PackageCheck className="ms-1 size-3.5" />
          تأكيد الاستلام وتنفيذ الاسترجاع
        </Button>
        <Button size="sm" variant="ghost" className="text-destructive" disabled={isBusy} onClick={onCancel}>
          إلغاء
        </Button>
      </div>
    );
  }

  return <Clock className="size-4 text-muted-foreground" aria-label="مفيش إجراء متاح" />;
}