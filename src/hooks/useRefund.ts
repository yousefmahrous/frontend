import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  approveRefundRequest,
  cancelRefundRequest,
  completeRefundRequest,
  fetchAdminRefundRequests,
  fetchMyRefundRequests,
  rejectRefundRequest,
  requestRefund,
  type RefundRequestStatus,
} from "@/api/refund.api";
import { orderKeys } from "@/hooks/useOrder";

export const refundKeys = {
  mine: ["refund", "mine"] as const,
  adminList: (params: { page: number; limit: number; status?: RefundRequestStatus | "" }) =>
    ["refund", "admin", "list", params] as const,
};

export function useMyRefundRequests() {
  return useQuery({
    queryKey: refundKeys.mine,
    queryFn: fetchMyRefundRequests,
    retry: false,
  });
}

export function useAdminRefundRequests(params: {
  page: number;
  limit: number;
  status?: RefundRequestStatus | "";
}) {
  return useQuery({
    queryKey: refundKeys.adminList(params),
    queryFn: () => fetchAdminRefundRequests(params),
    placeholderData: keepPreviousData,
    retry: false,
  });
}

export function useRequestRefund() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, reason }: { orderId: number; reason: string }) =>
      requestRefund(orderId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: refundKeys.mine });
      queryClient.invalidateQueries({ queryKey: orderKeys.mine });
    },
  });
}

function useAdminRefundMutation<T>(mutationFn: (arg: T) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["refund", "admin"] });
      queryClient.invalidateQueries({ queryKey: ["order", "admin"] });
    },
  });
}

export function useApproveRefundRequest() {
  return useAdminRefundMutation((id: number) => approveRefundRequest(id));
}

export function useRejectRefundRequest() {
  return useAdminRefundMutation(({ id, adminNote }: { id: number; adminNote?: string }) =>
    rejectRefundRequest(id, adminNote),
  );
}

export function useCancelRefundRequest() {
  return useAdminRefundMutation(({ id, adminNote }: { id: number; adminNote?: string }) =>
    cancelRefundRequest(id, adminNote),
  );
}

export function useCompleteRefundRequest() {
  return useAdminRefundMutation((id: number) => completeRefundRequest(id));
}