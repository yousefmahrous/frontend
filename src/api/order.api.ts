import { api } from "./client";

export const ORDERS_PATH = "/orders";

export type OrderStatus = "pending" | "paid" | "failed" | "cancelled";

export interface OrderItem {
  book_id: number;
  title: string;
  quantity: number;
  unit_price: number;
}

export interface Order {
  id: number;
  status: OrderStatus;
  total_amount: number;
  currency: string;
  created_at: string;
  items: OrderItem[];
}

export interface OrderCustomer {
  id: number;
  name: string;
  email: string;
}

export interface AdminOrder extends Order {
  user: OrderCustomer | null;
}

export interface Pagination {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  limit: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export async function fetchOrder(orderId: number) {
  const { data } = await api.get<{ success: boolean; data: Order }>(`${ORDERS_PATH}/${orderId}`);
  return data.data;
}

export async function fetchLatestOrder() {
  const { data } = await api.get<{ success: boolean; data: Order }>(`${ORDERS_PATH}/latest`);
  return data.data;
}

export async function fetchMyOrders() {
  const { data } = await api.get<{ success: boolean; data: { items: Order[] } }>(ORDERS_PATH);
  return data.data.items;
}

export async function fetchAdminOrders(params: {
  page: number;
  limit: number;
  status?: OrderStatus | "";
}) {
  const { data } = await api.get<{
    success: boolean;
    data: { items: AdminOrder[]; pagination: Pagination };
  }>(`${ORDERS_PATH}/admin/all`, {
    params: {
      page: params.page,
      limit: params.limit,
      ...(params.status ? { status: params.status } : {}),
    },
  });
  return data.data;
}