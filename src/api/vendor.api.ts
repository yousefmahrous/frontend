import { api } from "./client";
import type { Product, ProductPayload, ProductsListResult, Pagination } from "./products.api";
import type { FulfillmentStatus, OrderShipping, ReturnStatus } from "./order.api";
import type { RefundRequestStatus } from "./refund.api";

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
    data: { users: Product[]; pagination: Pagination };
  }>("/vendors/products", { params });
  return { items: data.data.users, pagination: data.data.pagination } satisfies ProductsListResult;
}

export async function fetchMyProduct(id: string) {
  const { data } = await api.get<{ success: boolean; data: { user: Product } }>(
    `/vendors/products/${id}`,
  );
  return data.data.user;
}

export async function createMyProduct(payload: ProductPayload) {
  const { data } = await api.post<{ success: boolean; message: string }>(
    "/vendors/products",
    payload,
  );
  return data;
}

export async function updateMyProduct(id: string, payload: ProductPayload) {
  const { data } = await api.put<{ success: boolean; message: string }>(
    `/vendors/products/${id}`,
    payload,
  );
  return data;
}

export async function deleteMyProduct(id: string) {
  const { data } = await api.delete<{ success: boolean; message: string }>(
    `/vendors/products/${id}`,
  );
  return data;
}

export interface VendorOrderItem {
  product_id: number;
  title: string;
  quantity: number;
  unit_price: number;
}

export interface VendorOrder {
  id: number;
  order_id: number;
  order_status: string;
  return_status: ReturnStatus | null;
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

export interface VendorEarnings {
  currency: string;
  pending: number;
  available: number;
  on_hold: number;
  paid_out: number;
  hold_days: number;
  commission_bps: number;
}

export interface VendorPayout {
  id: number;
  amount: number;
  currency: string;
  reference: string | null;
  note: string | null;
  created_at: string;
  orders_count: number;
}

export async function fetchVendorEarnings() {
  const { data } = await api.get<{ success: boolean; data: VendorEarnings }>("/vendors/earnings");
  return data.data;
}

export async function fetchMyPayouts(params: { page: number; limit: number }) {
  const { data } = await api.get<{
    success: boolean;
    data: { items: VendorPayout[]; pagination: Pagination };
  }>("/vendors/payouts", { params });
  return data.data;
}

export interface VendorReturn {
  id: number;
  order_id: number;
  status: RefundRequestStatus;
  reason: string;
  refund_amount: number | null;
  created_at: string;
  reviewed_at: string | null;
  items: VendorOrderItem[];
}

export async function fetchMyVendorReturns(params: { page: number; limit: number }) {
  const { data } = await api.get<{
    success: boolean;
    data: { items: VendorReturn[]; pagination: Pagination };
  }>("/vendors/returns", { params });
  return data.data;
}

export async function fetchPlatformOrders(params: {
  page: number;
  limit: number;
  status?: FulfillmentStatus | undefined;
}) {
  const { data } = await api.get<{
    success: boolean;
    data: { items: VendorOrder[]; pagination: Pagination };
  }>("/vendors/admin/platform-orders", { params });
  return data.data;
}

export async function updatePlatformFulfillment(id: number, payload: FulfillmentPayload) {
  const { data } = await api.patch<{ success: boolean; message: string; data: VendorOrder }>(
    `/vendors/admin/platform-orders/${id}/fulfillment`,
    payload,
  );
  return data.data;
}

export type AnalyticsRange = 7 | 30 | 90;

export interface VendorAnalytics {
  range_days: AnalyticsRange;
  totals: {
    orders: number;
    items_sold: number;
    revenue: number;
    net: number;
    returns: number;
    average_order_value: number;
  };
  daily: { date: string; orders: number; revenue: number }[];
  top_products: { product_id: number; title: string; quantity: number; revenue: number }[];
  fulfillment: Record<"pending" | "processing" | "shipped" | "delivered", number>;
}

export async function fetchVendorAnalytics(days: AnalyticsRange) {
  const { data } = await api.get<{ success: boolean; data: VendorAnalytics }>(
    "/vendors/analytics",
    { params: { days } },
  );
  return data.data;
}

export interface AdminAnalytics {
  range_days: AnalyticsRange;
  totals: {
    orders: number;
    revenue: number;
    commission: number;
    average_order_value: number;
  };
  daily: { date: string; orders: number; revenue: number; commission: number }[];
  top_vendors: {
    vendor_id: number;
    store_name: string;
    orders: number;
    revenue: number;
    commission: number;
  }[];
  vendors: Record<VendorStatus, number>;
  fulfillment: Record<"pending" | "processing" | "shipped" | "delivered", number>;
  pending_refunds: number;
}

export async function fetchAdminAnalytics(days: AnalyticsRange) {
  const { data } = await api.get<{ success: boolean; data: AdminAnalytics }>(
    "/vendors/admin/analytics",
    { params: { days } },
  );
  return data.data;
}
