import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  fetchCommissionSettings,
  updateCommissionSettings,
  updateVendorCommission,
} from "@/api/settings.api";

const KEY = ["settings", "commission"];

export function useCommissionSettings() {
  return useQuery({ queryKey: KEY, queryFn: fetchCommissionSettings, retry: false });
}

export function useUpdateCommissionSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateCommissionSettings,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateVendorCommission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ vendorId, bps }: { vendorId: number; bps: number | null }) =>
      updateVendorCommission(vendorId, bps),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: KEY }),
  });
}