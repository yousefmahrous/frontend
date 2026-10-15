import ar from "@/i18n/locales/ar.json";
import en from "@/i18n/locales/en.json";
import { readLangCookie } from "@/i18n/langCookie";
import type { LocalizedText } from "@/lib/localized";
import { api, PRODUCTS_PATH } from "./client";

export type { LocalizedText };

export type ProductCategory = "novels" | "science" | "history" | "kids";

export const PRODUCT_CATEGORIES: ProductCategory[] = ["novels", "science", "history", "kids"];

export interface ProductVariant {
  id: number;
  sku: string | null;
  options: Record<string, string>;
  price: number;
  stock: number;
}

export interface Product {
  id: string;
  name: LocalizedText;
  /** ISBN / barcode. Only products have one, so it can be missing. */
  number: string | null;
  /** Publisher email. Only products have one, so it can be missing. */
  email: string | null;
  adress: LocalizedText;
  /** Publisher. Only products have one, so it can be missing. */
  centre: string | null;
  category: ProductCategory | string;
  price: number;
  stock: number;
  variants?: ProductVariant[];
  avatar_key?: string | null;
  avatar_url?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface VariantPayload {
  sku: string | null;
  options: Record<string, string>;
  price: number;
  stock: number;
}

export interface ProductPayload {
  name: LocalizedText;
  number: string | null;
  email: string | null;
  adress: LocalizedText;
  centre: string | null;
  category: string;
  price: number;
  stock: number;
  avatar_key: string | null;
  /** Create only. When present, price/stock come from the first variant. */
  variants?: VariantPayload[];
}

export interface Pagination {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  limit: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ProductsListResult {
  items: Product[];
  pagination: Pagination;
}

export async function fetchProducts(params: { page: number; limit: number; search?: string; category?: string }) {
  const { data } = await api.get<{
    success: boolean;
    data: { users?: Product[]; items?: Product[]; pagination: Pagination };
  }>(PRODUCTS_PATH, {
    params: {
      page: params.page,
      limit: params.limit,
      ...(params.search ? { search: params.search } : {}),
      ...(params.category ? { category: params.category } : {}),
    },
  });

  const payload = data.data;
  const items = payload.users ?? payload.items ?? [];
  return { items, pagination: payload.pagination } satisfies ProductsListResult;
}

export async function fetchPopularProducts(limit = 10) {
  const { data } = await api.get<{
    success: boolean;
    data: { users?: Product[]; items?: Product[] };
  }>(`${PRODUCTS_PATH}/popular`, {
    params: { limit },
  });

  const payload = data.data;
  return payload.users ?? payload.items ?? [];
}

export async function fetchProduct(id: string) {
  const { data } = await api.get<{ success: boolean; data: { user?: Product; item?: Product } }>(
    `${PRODUCTS_PATH}/${id}`,
  );
  const product = data.data.user ?? data.data.item;
  if (!product) throw new Error((readLangCookie() === "en" ? en : ar).apiErrors.notFound);
  return product;
}

export async function createProduct(payload: ProductPayload) {
  const { data } = await api.post<{ success: boolean; message: string }>(PRODUCTS_PATH, payload);
  return data;
}

export async function updateProduct(id: string, payload: ProductPayload) {
  const { data } = await api.put<{ success: boolean; message: string }>(
    `${PRODUCTS_PATH}/${id}`,
    payload,
  );
  return data;
}

export async function deleteProduct(id: string) {
  const { data } = await api.delete<{ success: boolean; message: string }>(`${PRODUCTS_PATH}/${id}`);
  return data;
}