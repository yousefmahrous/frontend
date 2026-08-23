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

export async function fetchOrder(orderId: number) {
  const { data } = await api.get<{ success: boolean; data: Order }>(
    `${ORDERS_PATH}/${orderId}`,
  );
  return data.data;
}

export async function fetchLatestOrder() {
  const { data } = await api.get<{ success: boolean; data: Order }>(
    `${ORDERS_PATH}/latest`,
  );
  return data.data;
}