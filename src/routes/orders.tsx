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

export const Route = createFileRoute("/orders")({
  ssr: false,
  head: () => ({
    meta: [{ title: "أوردراتي | مكتبة القراء" }],
  }),
  component: () => (
    <Protected>
      <OrdersPage />
    </Protected>
  ),
});

const RETURN_WINDOW_DAYS = 14;

const STATUS_META: Record<
  OrderStatus,
  { label: string; className: string; icon: typeof CheckCircle2 }
> = {
  paid: {
    label: "تم الدفع",
    className: "bg-green-100 text-green-700 hover:bg-green-100",
    icon: CheckCircle2,
  },
  pending: {
    label: "بانتظار الدفع",
    className: "bg-amber-100 text-amber-700 hover:bg-amber-100",
    icon: Clock,
  },
  failed: {
    label: "فشل الدفع",
    className: "bg-destructive/10 text-destructive hover:bg-destructive/10",
    icon: XCircle,
  },
  cancelled: {
    label: "ملغي",
    className: "bg-secondary text-muted-foreground hover:bg-secondary",
    icon: XCircle,
  },
  return_requested: {
    label: "طلب الاسترجاع قيد المراجعة",
    className: "bg-blue-100 text-blue-700 hover:bg-blue-100",
    icon: RotateCcw,
  },
  return_approved: {
    label: "بانتظار استلام الكتاب",
    className: "bg-blue-100 text-blue-700 hover:bg-blue-100",
    icon: RotateCcw,
  },
  refunded: {
    label: "تم الاسترجاع",
    className: "bg-secondary text-muted-foreground hover:bg-secondary",
    icon: RotateCcw,
  },
};

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
        <h1 className="text-2xl font-extrabold">أوردراتي</h1>
        {items.length > 0 && <Badge variant="secondary">{items.length} أوردر</Badge>}
      </div>

      {items.length === 0 ? (
        <EmptyState title="مفيش أوردرات لسه" description="لما تشتري كتاب هيظهر أوردرك هنا." />
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
          مفيش أي أوردر اتدفع لحد دلوقتي.
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
  const meta = STATUS_META[order.status];
  const StatusIcon = meta.icon;
  const [dialogOpen, setDialogOpen] = useState(false);

  const canRequestRefund =
    order.status === "paid" && !hasActiveRefundRequest && isWithinReturnWindow(order.paid_at);

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
        <div>
          <p className="font-bold">أوردر #{order.id}</p>
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
              {formatPrice(item.unit_price * item.quantity)} جنيه
            </span>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between border-t border-border pt-3">
        <span className="text-sm text-muted-foreground">الإجمالي</span>
        <span className="text-lg font-extrabold">{formatPrice(order.total_amount)} جنيه</span>
      </div>

      {canRequestRefund && (
        <div className="mt-3 border-t border-border pt-3">
          <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
            <RotateCcw className="ms-1 size-3.5" />
            طلب استرجاع
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
  const [reason, setReason] = useState("");
  const requestRefundMutation = useRequestRefund();

  function handleSubmit() {
    if (!reason.trim()) {
      toast.error("من فضلك اكتب سبب الاسترجاع");
      return;
    }

    requestRefundMutation.mutate(
      { orderId, reason: reason.trim() },
      {
        onSuccess: () => {
          toast.success("تم إرسال طلب الاسترجاع بنجاح، هيتم مراجعته قريبًا");
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
          <DialogTitle>طلب استرجاع الأوردر #{orderId}</DialogTitle>
          <DialogDescription>
            اكتب سبب رغبتك في استرجاع الأوردر ده. طلبك هيتراجع من فريقنا وهنتواصل معاك بخصوص خطوات
            إرجاع الكتاب.
          </DialogDescription>
        </DialogHeader>

        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="اكتب السبب هنا..."
          rows={4}
        />

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button onClick={handleSubmit} disabled={requestRefundMutation.isPending}>
            {requestRefundMutation.isPending ? "جاري الإرسال..." : "إرسال الطلب"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}