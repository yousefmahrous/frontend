import { api } from "./client";
import type { OrderCustomer, Pagination } from "./order.api";

export const REFUNDS_PATH = "/refunds";

export type RefundRequestStatus =
  | "pending"
  | "awaiting_return"
  | "completed"
  | "rejected"
  | "cancelled";

export interface RefundOrderItem {
  book_id: number;
  title: string;
  quantity: number;
  unit_price: number;
}

export interface RefundOrder {
  id: number;
  status: string;
  total_amount: number;
  currency: string;
  paid_at: string | null;
  items?: RefundOrderItem[];
}

export interface RefundRequest {
  id: number;
  order_id: number;
  status: RefundRequestStatus;
  reason: string;
  admin_note: string | null;
  created_at: string;
  reviewed_at: string | null;
  order?: RefundOrder;
  user?: OrderCustomer;
}

export async function requestRefund(orderId: number, reason: string) {
  const { data } = await api.post<{ success: boolean; message: string; data: RefundRequest }>(
    REFUNDS_PATH,
    { order_id: orderId, reason },
  );
  return data.data;
}

export async function fetchMyRefundRequests() {
  const { data } = await api.get<{ success: boolean; data: { items: RefundRequest[] } }>(
    `${REFUNDS_PATH}/mine`,
  );
  return data.data.items;
}

export async function fetchAdminRefundRequests(params: {
  page: number;
  limit: number;
  status?: RefundRequestStatus | "";
}) {
  const { data } = await api.get<{
    success: boolean;
    data: { items: RefundRequest[]; pagination: Pagination };
  }>(`${REFUNDS_PATH}/admin/all`, {
    params: {
      page: params.page,
      limit: params.limit,
      ...(params.status ? { status: params.status } : {}),
    },
  });
  return data.data;
}

export async function approveRefundRequest(id: number) {
  const { data } = await api.post<{ success: boolean; message: string; data: RefundRequest }>(
    `${REFUNDS_PATH}/${id}/approve`,
  );
  return data.data;
}

export async function rejectRefundRequest(id: number, adminNote?: string) {
  const { data } = await api.post<{ success: boolean; message: string; data: RefundRequest }>(
    `${REFUNDS_PATH}/${id}/reject`,
    { admin_note: adminNote },
  );
  return data.data;
}

export async function cancelRefundRequest(id: number, adminNote?: string) {
  const { data } = await api.post<{ success: boolean; message: string; data: RefundRequest }>(
    `${REFUNDS_PATH}/${id}/cancel`,
    { admin_note: adminNote },
  );
  return data.data;
}

export async function completeRefundRequest(id: number) {
  const { data } = await api.post<{ success: boolean; message: string; data: RefundRequest }>(
    `${REFUNDS_PATH}/${id}/complete`,
  );
  return data.data;
}