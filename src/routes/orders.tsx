import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Clock, PackageSearch, RotateCcw, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { errorMessage } from "@/api/client";
import type { Order, OrderStatus } from "@/api/order.api";
import { Protected } from "@/components/Guards";
import { EmptyState, ErrorState } from "@/components/StateViews";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useMyOrders } from "@/hooks/useOrder";
import { useMyRefundRequests, useRequestRefund } from "@/hooks/useRefund";

import en from "@/i18n/locales/en.json";
import ar from "@/i18n/locales/ar.json";
import { DEFAULT_LANG, type Lang } from "@/i18n/i18n";
import { useTranslation } from "react-i18next";
export const Route = createFileRoute("/orders")({
  ssr: false,
  head: ({ match }) => {
    const lang = (match.context as { lang?: Lang }).lang ?? DEFAULT_LANG;
    const meta = (lang === "ar" ? ar : en).pageMeta.ordersPage;
    return {
      meta: [
        { title: meta.title },
      ],
    };
  },
  component: () => (
    <Protected>
      <OrdersPage />
    </Protected>
  ),
});

const RETURN_WINDOW_DAYS = 14;

function getStatusMeta(
  t: (key: string) => string,
): Record<OrderStatus, { label: string; className: string; icon: typeof CheckCircle2 }> {
  return {
    paid: {
      label: t("orders.statusPaid"),
      className: "bg-green-100 text-green-700 hover:bg-green-100",
      icon: CheckCircle2,
    },
    pending: {
      label: t("orders.statusPending"),
      className: "bg-amber-100 text-amber-700 hover:bg-amber-100",
      icon: Clock,
    },
    failed: {
      label: t("orders.statusFailed"),
      className: "bg-destructive/10 text-destructive hover:bg-destructive/10",
      icon: XCircle,
    },
    cancelled: {
      label: t("orders.statusCancelled"),
      className: "bg-secondary text-muted-foreground hover:bg-secondary",
      icon: XCircle,
    },
    return_requested: {
      label: t("orders.statusReturnRequested"),
      className: "bg-blue-100 text-blue-700 hover:bg-blue-100",
      icon: RotateCcw,
    },
    return_approved: {
      label: t("orders.statusReturnApproved"),
      className: "bg-blue-100 text-blue-700 hover:bg-blue-100",
      icon: RotateCcw,
    },
    refunded: {
      label: t("orders.statusRefunded"),
      className: "bg-secondary text-muted-foreground hover:bg-secondary",
      icon: RotateCcw,
    },
  };
}

function formatPrice(amountInPiastres: number) {
  return (amountInPiastres / 100).toFixed(2);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function isWithinReturnWindow(paidAt: string | null) {
  if (!paidAt) return false;
  const deadline = new Date(paidAt);
  deadline.setDate(deadline.getDate() + RETURN_WINDOW_DAYS);
  return new Date() <= deadline;
}

function OrdersPage() {
  const { t } = useTranslation();
  const { data: orders, isLoading, isError, error, refetch } = useMyOrders();
  const { data: refundRequests } = useMyRefundRequests();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-10">
        <Skeleton className="h-8 w-40" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-14">
        <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
      </div>
    );
  }

  const items = orders ?? [];
  const paidItems = items.filter((order) => order.status === "paid");

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex items-center gap-3">
        <PackageSearch className="size-6 text-accent" />
        <h1 className="text-2xl font-extrabold">{t("orders.title")}</h1>
        {items.length > 0 && <Badge variant="secondary">{t("orders.count", { count: items.length })}</Badge>}
      </div>

      {items.length === 0 ? (
        <EmptyState title={t("orders.empty")} description={t("orders.emptyDesc")} />
      ) : (
        <div className="space-y-4">
          {items.map((order) => {
            const activeRequest = refundRequests?.find(
              (r) => r.order_id === order.id && ["pending", "awaiting_return"].includes(r.status),
            );
            return <OrderCard key={order.id} order={order} hasActiveRefundRequest={Boolean(activeRequest)} />;
          })}
        </div>
      )}

      {items.length > 0 && paidItems.length === 0 && (
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t("orders.noneWithNoPaidYet")}
        </p>
      )}
    </div>
  );
}

function OrderCard({
  order,
  hasActiveRefundRequest,
}: {
  order: Order;
  hasActiveRefundRequest: boolean;
}) {
  const { t } = useTranslation();
  const meta = getStatusMeta(t)[order.status];
  const StatusIcon = meta.icon;
  const [dialogOpen, setDialogOpen] = useState(false);

  const canRequestRefund =
    order.status === "paid" && !hasActiveRefundRequest && isWithinReturnWindow(order.paid_at);

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
        <div>
          <p className="font-bold">{t("orders.orderNumber", { id: order.id })}</p>
          <p className="text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
        </div>
        <Badge className={meta.className}>
          <StatusIcon className="ms-1 size-3.5" />
          {meta.label}
        </Badge>
      </div>

      <ul className="my-3 space-y-1">
        {order.items.map((item) => (
          <li key={item.book_id} className="flex items-center justify-between text-sm">
            <span className="text-foreground">
              {item.title} <span className="text-muted-foreground">× {item.quantity}</span>
            </span>
            <span className="text-muted-foreground">
              {formatPrice(item.unit_price * item.quantity)} {t("bookDetails.currency")}
            </span>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between border-t border-border pt-3">
        <span className="text-sm text-muted-foreground">{t("common.total")}</span>
        <span className="text-lg font-extrabold">{formatPrice(order.total_amount)} {t("bookDetails.currency")}</span>
      </div>

      {canRequestRefund && (
        <div className="mt-3 border-t border-border pt-3">
          <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
            <RotateCcw className="ms-1 size-3.5" />
            {t("orders.requestRefund")}
          </Button>
        </div>
      )}

      <RefundRequestDialog orderId={order.id} open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}

function RefundRequestDialog({
  orderId,
  open,
  onOpenChange,
}: {
  orderId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const [reason, setReason] = useState("");
  const requestRefundMutation = useRequestRefund();

  function handleSubmit() {
    if (!reason.trim()) {
      toast.error(t("orders.reasonRequired"));
      return;
    }

    requestRefundMutation.mutate(
      { orderId, reason: reason.trim() },
      {
        onSuccess: () => {
          toast.success(t("orders.refundRequestSent"));
          setReason("");
          onOpenChange(false);
        },
        onError: (err) => toast.error(errorMessage(err)),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("orders.refundDialogTitle", { id: orderId })}</DialogTitle>
          <DialogDescription>
            {t("orders.refundDialogDesc")}
          </DialogDescription>
        </DialogHeader>

        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={t("orders.reasonPlaceholder")}
          rows={4}
        />

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={requestRefundMutation.isPending}>
            {requestRefundMutation.isPending ? t("orders.sending") : t("orders.sendRequest")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}