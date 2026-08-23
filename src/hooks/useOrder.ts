import { useQuery } from "@tanstack/react-query";

import { fetchLatestOrder, fetchOrder } from "@/api/order.api";

export const orderKeys = {
  detail: (id: number) => ["order", id] as const,
  latest: ["order", "latest"] as const,
};

export function useOrder(orderId: number | undefined) {
  return useQuery({
    queryKey: orderKeys.detail(orderId ?? 0),
    queryFn: () => fetchOrder(orderId as number),
    enabled: Boolean(orderId),
    retry: false,
    refetchInterval: (query) => (query.state.data?.status === "pending" ? 2000 : false),
  });
}

export function useLatestOrder(enabled = true) {
  return useQuery({
    queryKey: orderKeys.latest,
    queryFn: fetchLatestOrder,
    enabled,
    retry: false,
    refetchInterval: (query) => (query.state.data?.status === "pending" ? 2000 : false),
  });
}