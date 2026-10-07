import { api } from "./client";

export const PAYMENT_PATH = "/payment";

export interface ShippingPayload {
  name: string;
  phone: string;
  address: string;
  city: string;
  notes?: string | undefined;
}

export async function createCheckoutSession(shipping: ShippingPayload) {
  const { data } = await api.post<{ success: boolean; data: { url: string } }>(
    `${PAYMENT_PATH}/checkout`,
    shipping,
  );
  return data.data;
}