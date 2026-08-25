import { keepPreviousData, useQuery } from "@tanstack/react-query";

import {
  fetchAdminOrders,
  fetchLatestOrder,
  fetchMyOrders,
  fetchOrder,
  type OrderStatus,
} from "@/api/order.api";

export const orderKeys = {
  detail: (id: number) => ["order", id] as const,
  latest: ["order", "latest"] as const,
  mine: ["order", "mine"] as const,
  adminList: (params: { page: number; limit: number; status?: OrderStatus | "" }) =>
    ["order", "admin", "list", params] as const,
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

export function useMyOrders() {
  return useQuery({
    queryKey: orderKeys.mine,
    queryFn: fetchMyOrders,
    retry: false,
  });
}

export function useAdminOrders(params: { page: number; limit: number; status?: OrderStatus | "" }) {
  return useQuery({
    queryKey: orderKeys.adminList(params),
    queryFn: () => fetchAdminOrders(params),
    placeholderData: keepPreviousData,
    retry: false,
  });
}