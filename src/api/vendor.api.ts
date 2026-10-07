import { api } from "./client";
import type { Book, BookPayload, BooksListResult, Pagination } from "./books.api";
import type { FulfillmentStatus, OrderShipping } from "./order.api";

export type VendorStatus = "pending" | "active" | "suspended" | "rejected";

export interface Vendor {
  id: number;
  store_name: string;
  slug: string;
  status: VendorStatus;
  commission_bps: number | null;
  created_at: string;
  owner?: { id: number; name: string; email: string };
}

export async function applyAsVendor(storeName: string) {
  const { data } = await api.post<{ success: boolean; message: string; data: Vendor }>(
    "/vendors/apply",
    { store_name: storeName },
  );
  return data;
}

export async function fetchMyVendor() {
  const { data } = await api.get<{ success: boolean; data: Vendor | null }>("/vendors/me");
  return data.data;
}

export async function fetchVendorsAdmin(params: { page: number; limit: number; status?: string }) {
  const { data } = await api.get<{
    success: boolean;
    data: { items: Vendor[]; pagination: Pagination };
  }>("/vendors/admin/all", {
    params: {
      page: params.page,
      limit: params.limit,
      ...(params.status ? { status: params.status } : {}),
    },
  });
  return data.data;
}

export async function updateVendorStatus(id: number, status: VendorStatus) {
  const { data } = await api.patch<{ success: boolean; message: string; data: Vendor }>(
    `/vendors/${id}/status`,
    { status },
  );
  return data;
}

export async function fetchMyProducts(params: { page: number; limit: number }) {
  const { data } = await api.get<{
    success: boolean;
    data: { users: Book[]; pagination: Pagination };
  }>("/vendors/books", { params });
  return { items: data.data.users, pagination: data.data.pagination } satisfies BooksListResult;
}

export async function fetchMyProduct(id: string) {
  const { data } = await api.get<{ success: boolean; data: { user: Book } }>(
    `/vendors/books/${id}`,
  );
  return data.data.user;
}

export async function createMyProduct(payload: BookPayload) {
  const { data } = await api.post<{ success: boolean; message: string }>(
    "/vendors/books",
    payload,
  );
  return data;
}

export async function updateMyProduct(id: string, payload: BookPayload) {
  const { data } = await api.put<{ success: boolean; message: string }>(
    `/vendors/books/${id}`,
    payload,
  );
  return data;
}

export async function deleteMyProduct(id: string) {
  const { data } = await api.delete<{ success: boolean; message: string }>(
    `/vendors/books/${id}`,
  );
  return data;
}

export interface VendorOrderItem {
  book_id: number;
  title: string;
  quantity: number;
  unit_price: number;
}

export interface VendorOrder {
  id: number;
  order_id: number;
  order_status: string;
  paid_at: string | null;
  created_at: string;
  fulfillment_status: FulfillmentStatus;
  carrier: string | null;
  tracking_number: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  shipping: OrderShipping;
  items: VendorOrderItem[];
  subtotal: number;
}

export interface FulfillmentPayload {
  status: Exclude<FulfillmentStatus, "pending">;
  carrier?: string | undefined;
  tracking_number?: string | undefined;
}

export async function fetchMyVendorOrders(params: {
  page: number;
  limit: number;
  status?: FulfillmentStatus | undefined;
}) {
  const { data } = await api.get<{
    success: boolean;
    data: { items: VendorOrder[]; pagination: Pagination };
  }>("/vendors/orders", { params });
  return data.data;
}

export async function updateVendorOrderFulfillment(id: number, payload: FulfillmentPayload) {
  const { data } = await api.patch<{ success: boolean; message: string; data: VendorOrder }>(
    `/vendors/orders/${id}/fulfillment`,
    payload,
  );
  return data.data;
}