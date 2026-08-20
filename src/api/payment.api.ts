import { api } from "./client";

export const PAYMENT_PATH = "/payment";

export async function createCheckoutSession() {
  const { data } = await api.post<{ success: boolean; data: { url: string } }>(
    `${PAYMENT_PATH}/checkout`,
  );
  return data.data;
}