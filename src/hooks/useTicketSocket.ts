import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { io, type Socket } from "socket.io-client";

import { SOCKET_URL } from "@/api/client";
import type { Ticket, TicketMessage, TicketStatus } from "@/api/ticket.api";
import { ticketKeys } from "./useTicket";

let socket: Socket | null = null;

function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      autoConnect: false,
    });
  }
  return socket;
}

export function useTicketSocket(ticketId: number) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!Number.isFinite(ticketId)) return;

    const s = getSocket();
    s.connect();
    s.emit("join_ticket", ticketId);

    const handleMessage = (message: TicketMessage) => {
      if (message.ticket_id !== ticketId) return;

      queryClient.setQueryData<Ticket | undefined>(ticketKeys.detail(ticketId), (old) => {
        if (!old) return old;
        const alreadyThere = old.messages?.some((m) => m.id === message.id);
        if (alreadyThere) return old;
        return { ...old, messages: [...(old.messages ?? []), message] };
      });

      void queryClient.invalidateQueries({ queryKey: ticketKeys.mine });
    };

    const handleStatusChanged = ({ status }: { status: TicketStatus }) => {
      queryClient.setQueryData<Ticket | undefined>(ticketKeys.detail(ticketId), (old) =>
        old ? { ...old, status } : old,
      );
    };

    s.on("ticket_message", handleMessage);
    s.on("ticket_status_changed", handleStatusChanged);

    return () => {
      s.emit("leave_ticket", ticketId);
      s.off("ticket_message", handleMessage);
      s.off("ticket_status_changed", handleStatusChanged);
    };
  }, [ticketId, queryClient]);
}