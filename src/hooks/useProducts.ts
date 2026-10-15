import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import {
  createProduct,
  deleteProduct,
  fetchProduct,
  fetchProducts,
  fetchPopularProducts,
  updateProduct,
  type ProductPayload,
} from "@/api/products.api";

export const productsKeys = {
  all: ["products"] as const,
  list: (params: { page: number; limit: number; search: string; category?: string | null }) =>
    ["products", "list", params] as const,
  detail: (id: string) => ["products", "detail", id] as const,
  popular: (limit: number) => ["products", "popular", limit] as const,
};

export function useDebouncedValue<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function useProducts(params: { page: number; limit: number; search: string; category?: string | null }) {
  return useQuery({
    queryKey: productsKeys.list(params),
    queryFn: () =>
      fetchProducts({
        page: params.page,
        limit: params.limit,
        search: params.search,
        ...(params.category ? { category: params.category } : {}),
      }),
    placeholderData: keepPreviousData,
    retry: false,
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: productsKeys.detail(id),
    queryFn: () => fetchProduct(id),
    retry: false,
    enabled: Boolean(id),
  });
}

export function usePopularProducts(limit = 10) {
  return useQuery({
    queryKey: productsKeys.popular(limit),
    queryFn: () => fetchPopularProducts(limit),
    retry: false,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProductPayload) => createProduct(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: productsKeys.all }),
  });
}

export function useUpdateProduct(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProductPayload) => updateProduct(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: productsKeys.all });
      void queryClient.invalidateQueries({ queryKey: productsKeys.detail(id) });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: productsKeys.all }),
  });
}