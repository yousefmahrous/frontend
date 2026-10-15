import { api } from "./client";
import type { Pagination } from "./products.api";

export interface VendorBalance {
  vendor: { id: number; store_name: string; status: string };
  pending: number;
  available: number;
  on_hold: number;
  paid_out: number;
}

export interface AdminPayout {
  id: number;
  vendor: { id: number; store_name: string } | null;
  amount: number;
  currency: string;
  reference: string | null;
  note: string | null;
  created_at: string;
  orders_count: number;
}

export interface RecordPayoutPayload {
  reference: string;
  note?: string | undefined;
}

export async function fetchVendorBalances() {
  const { data } = await api.get<{
    success: boolean;
    data: { items: VendorBalance[]; hold_days: number };
  }>("/payouts/admin/balances");
  return data.data;
}

export async function fetchAllPayouts(params: { page: number; limit: number }) {
  const { data } = await api.get<{
    success: boolean;
    data: { items: AdminPayout[]; pagination: Pagination };
  }>("/payouts/admin/all", { params });
  return data.data;
}

export async function recordPayout(vendorId: number, payload: RecordPayoutPayload) {
  const { data } = await api.post<{
    success: boolean;
    message: string;
    data: { id: number; vendor_id: number; amount: number; reference: string; orders_count: number };
  }>(`/payouts/admin/vendors/${vendorId}`, payload);
  return data.data;
}