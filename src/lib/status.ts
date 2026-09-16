import type { OrderStatus } from "@/api/order.api";
import type { RefundRequestStatus } from "@/api/refund.api";
import type { TicketStatus } from "@/api/ticket.api";

export type StatusMeta = { label: string; className: string };
type Translate = (key: string) => string;

export function getOrderStatusMeta(
  t: Translate,
): Record<OrderStatus, StatusMeta> {
  return {
    paid: {
      label: t("orders.statusPaid"),
      className: "bg-green-100 text-green-700 hover:bg-green-100",
    },
    pending: {
      label: t("orders.statusPending"),
      className: "bg-amber-100 text-amber-700 hover:bg-amber-100",
    },
    failed: {
      label: t("orders.statusFailed"),
      className: "bg-destructive/10 text-destructive hover:bg-destructive/10",
    },
    cancelled: {
      label: t("orders.statusCancelled"),
      className: "bg-secondary text-muted-foreground hover:bg-secondary",
    },
    return_requested: {
      label: t("orders.statusReturnRequested"),
      className: "bg-blue-100 text-blue-700 hover:bg-blue-100",
    },
    return_approved: {
      label: t("orders.statusReturnApproved"),
      className: "bg-blue-100 text-blue-700 hover:bg-blue-100",
    },
    refunded: {
      label: t("orders.statusRefunded"),
      className: "bg-secondary text-muted-foreground hover:bg-secondary",
    },
  };
}

export function getRefundStatusMeta(
  t: Translate,
): Record<RefundRequestStatus, StatusMeta> {
  return {
    pending: {
      label: t("adminRefunds.statusPending"),
      className: "bg-amber-100 text-amber-700 hover:bg-amber-100",
    },
    awaiting_return: {
      label: t("adminRefunds.statusAwaitingReturn"),
      className: "bg-blue-100 text-blue-700 hover:bg-blue-100",
    },
    completed: {
      label: t("adminRefunds.statusCompleted"),
      className: "bg-green-100 text-green-700 hover:bg-green-100",
    },
    rejected: {
      label: t("adminRefunds.statusRejected"),
      className: "bg-destructive/10 text-destructive hover:bg-destructive/10",
    },
    cancelled: {
      label: t("adminRefunds.statusCancelled"),
      className: "bg-secondary text-muted-foreground hover:bg-secondary",
    },
  };
}

export function getTicketStatusMeta(
  t: Translate,
): Record<TicketStatus, StatusMeta> {
  return {
    opened: {
      label: t("ticket.statusOpened"),
      className: "bg-blue-100 text-blue-700 hover:bg-blue-100",
    },
    pending: {
      label: t("ticket.statusPending"),
      className: "bg-amber-100 text-amber-700 hover:bg-amber-100",
    },
    under_review: {
      label: t("ticket.statusUnderReview"),
      className: "bg-purple-100 text-purple-700 hover:bg-purple-100",
    },
    resolved: {
      label: t("ticket.statusResolved"),
      className: "bg-green-100 text-green-700 hover:bg-green-100",
    },
  };
}