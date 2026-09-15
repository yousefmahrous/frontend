import { api } from "./client";
import type { OrderCustomer, Pagination } from "./order.api";

export const TICKETS_PATH = "/tickets";

export type TicketStatus = "opened" | "pending" | "under_review" | "resolved";

export type TicketMessageSender = "user" | "admin" | "system";

export interface TicketMessage {
  id: number;
  ticket_id: number;
  sender_type: TicketMessageSender;
  sender_id: number | null;
  body: string;
  created_at: string;
}

export interface Ticket {
  id: number;
  subject: string;
  status: TicketStatus;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  user?: OrderCustomer;
  last_message?: TicketMessage;
  messages?: TicketMessage[];
}

export async function createTicket(subject: string, message: string) {
  const { data } = await api.post<{ success: boolean; message: string; data: Ticket }>(
    TICKETS_PATH,
    { subject, message },
  );
  return data.data;
}

export async function fetchMyTickets() {
  const { data } = await api.get<{ success: boolean; data: { items: Ticket[] } }>(
    `${TICKETS_PATH}/mine`,
  );
  return data.data.items;
}

export async function fetchTicketDetail(id: number) {
  const { data } = await api.get<{ success: boolean; data: Ticket }>(`${TICKETS_PATH}/${id}`);
  return data.data;
}

export async function sendTicketMessage(id: number, body: string) {
  const { data } = await api.post<{ success: boolean; data: TicketMessage }>(
    `${TICKETS_PATH}/${id}/messages`,
    { body },
  );
  return data.data;
}

export async function fetchAdminTickets(params: {
  page: number;
  limit: number;
  status?: TicketStatus | "";
}) {
  const { data } = await api.get<{
    success: boolean;
    data: { items: Ticket[]; pagination: Pagination };
  }>(`${TICKETS_PATH}/admin/all`, {
    params: {
      page: params.page,
      limit: params.limit,
      ...(params.status ? { status: params.status } : {}),
    },
  });
  return data.data;
}

export async function updateTicketStatus(id: number, status: TicketStatus) {
  const { data } = await api.patch<{ success: boolean; message: string; data: Ticket }>(
    `${TICKETS_PATH}/admin/${id}/status`,
    { status },
  );
  return data.data;
}