import { api, PRODUCTS_PATH } from "./client";
import type { VariantPayload } from "./products.api";

export type VariantScope = "vendor" | "admin";

const basePath = (scope: VariantScope, productId: string) =>
  scope === "vendor" ? `/vendors/products/${productId}/variants` : `${PRODUCTS_PATH}/${productId}/variants`;

export async function addVariant(scope: VariantScope, productId: string, payload: VariantPayload) {
  const { data } = await api.post<{ success: boolean; message: string }>(basePath(scope, productId), payload);
  return data;
}

export async function updateVariant(
  scope: VariantScope,
  productId: string,
  variantId: number,
  payload: VariantPayload,
) {
  const { data } = await api.put<{ success: boolean; message: string }>(
    `${basePath(scope, productId)}/${variantId}`,
    payload,
  );
  return data;
}

export async function deleteVariant(scope: VariantScope, productId: string, variantId: number) {
  const { data } = await api.delete<{ success: boolean; message: string }>(
    `${basePath(scope, productId)}/${variantId}`,
  );
  return data;
}