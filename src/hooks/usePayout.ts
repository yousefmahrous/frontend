import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  fetchAllPayouts,
  fetchVendorBalances,
  recordPayout,
  type RecordPayoutPayload,
} from "@/api/payout.api";

export function useVendorBalances() {
  return useQuery({
    queryKey: ["payout", "admin", "balances"],
    queryFn: fetchVendorBalances,
    retry: false,
  });
}

export function useAdminPayouts(params: { page: number; limit: number }) {
  return useQuery({
    queryKey: ["payout", "admin", "history", params],
    queryFn: () => fetchAllPayouts(params),
    placeholderData: keepPreviousData,
    retry: false,
  });
}

export function useRecordPayout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ vendorId, ...payload }: RecordPayoutPayload & { vendorId: number }) =>
      recordPayout(vendorId, payload),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["payout", "admin"] }),
  });
}