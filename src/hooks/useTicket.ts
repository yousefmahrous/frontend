import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createTicket,
  fetchAdminTickets,
  fetchMyTickets,
  fetchTicketDetail,
  sendTicketMessage,
  updateTicketStatus,
  type TicketStatus,
} from "@/api/ticket.api";

export const ticketKeys = {
  mine: ["ticket", "mine"] as const,
  detail: (id: number) => ["ticket", "detail", id] as const,
  adminList: (params: { page: number; limit: number; status?: TicketStatus | "" }) =>
    ["ticket", "admin", "list", params] as const,
};

export function useMyTickets() {
  return useQuery({
    queryKey: ticketKeys.mine,
    queryFn: fetchMyTickets,
    retry: false,
  });
}

export function useTicketDetail(id: number) {
  return useQuery({
    queryKey: ticketKeys.detail(id),
    queryFn: () => fetchTicketDetail(id),
    enabled: Number.isFinite(id),
    retry: false,
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ subject, message }: { subject: string; message: string }) =>
      createTicket(subject, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.mine });
    },
  });
}

export function useSendTicketMessage(ticketId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => sendTicketMessage(ticketId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.detail(ticketId) });
      queryClient.invalidateQueries({ queryKey: ticketKeys.mine });
    },
  });
}

export function useAdminTickets(params: {
  page: number;
  limit: number;
  status?: TicketStatus | "";
}) {
  return useQuery({
    queryKey: ticketKeys.adminList(params),
    queryFn: () => fetchAdminTickets(params),
    placeholderData: keepPreviousData,
    retry: false,
  });
}

export function useUpdateTicketStatus(ticketId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (status: TicketStatus) => updateTicketStatus(ticketId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.detail(ticketId) });
      queryClient.invalidateQueries({ queryKey: ["ticket", "admin"] });
    },
  });
}