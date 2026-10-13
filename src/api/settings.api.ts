import { api } from "./client";

export interface CommissionVendor {
  id: number;
  store_name: string;
  status: string;
  commission_bps: number | null;
}

export interface CommissionSettings {
  default_commission_bps: number;
  payout_hold_days: number;
  vendors: CommissionVendor[];
}

export async function fetchCommissionSettings() {
  const { data } = await api.get<{ success: boolean; data: CommissionSettings }>(
    "/settings/admin/commission",
  );
  return data.data;
}

export async function updateCommissionSettings(payload: {
  default_commission_bps?: number;
  payout_hold_days?: number;
}) {
  await api.patch("/settings/admin/commission", payload);
}

export async function updateVendorCommission(vendorId: number, commissionBps: number | null) {
  await api.patch(`/settings/admin/vendors/${vendorId}/commission`, { commission_bps: commissionBps });
}