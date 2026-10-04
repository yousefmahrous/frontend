import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  applyAsVendor,
  createMyProduct,
  deleteMyProduct,
  fetchMyProduct,
  fetchMyProducts,
  fetchMyVendor,
  fetchVendorsAdmin,
  updateMyProduct,
  updateVendorStatus,
  type VendorStatus,
} from "@/api/vendor.api";
import type { BookPayload } from "@/api/books.api";

export const vendorKeys = {
  me: ["vendor", "me"] as const,
  myProducts: (params: { page: number; limit: number }) =>
    ["vendor", "products", params] as const,
  myProduct: (id: string) => ["vendor", "products", "detail", id] as const,
  adminList: (params: { page: number; limit: number; status?: string }) =>
    ["vendor", "admin", params] as const,
};

export function useMyVendor() {
  return useQuery({
    queryKey: vendorKeys.me,
    queryFn: fetchMyVendor,
    retry: false,
  });
}

export function useApplyVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (storeName: string) => applyAsVendor(storeName),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: vendorKeys.me }),
  });
}

export function useMyProducts(params: { page: number; limit: number }) {
  return useQuery({
    queryKey: vendorKeys.myProducts(params),
    queryFn: () => fetchMyProducts(params),
    placeholderData: keepPreviousData,
    retry: false,
  });
}

export function useMyProduct(id: string) {
  return useQuery({
    queryKey: vendorKeys.myProduct(id),
    queryFn: () => fetchMyProduct(id),
    retry: false,
    enabled: Boolean(id),
  });
}

export function useCreateMyProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BookPayload) => createMyProduct(payload),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["vendor", "products"] }),
  });
}

export function useUpdateMyProduct(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BookPayload) => updateMyProduct(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["vendor", "products"] });
      void queryClient.invalidateQueries({ queryKey: vendorKeys.myProduct(id) });
    },
  });
}

export function useDeleteMyProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteMyProduct(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["vendor", "products"] }),
  });
}

export function useVendorsAdmin(params: { page: number; limit: number; status?: string }) {
  return useQuery({
    queryKey: vendorKeys.adminList(params),
    queryFn: () => fetchVendorsAdmin(params),
    placeholderData: keepPreviousData,
    retry: false,
  });
}

export function useUpdateVendorStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: VendorStatus }) =>
      updateVendorStatus(id, status),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["vendor", "admin"] }),
  });
}