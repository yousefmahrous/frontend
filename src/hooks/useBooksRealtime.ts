import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { io } from "socket.io-client";

import { BOOKS_UPDATED_EVENT, SOCKET_URL } from "@/api/client";
import { booksKeys } from "./useBooks";


const socket = io(SOCKET_URL, {
  withCredentials: true,
  transports: ["websocket", "polling"],
  autoConnect: false,
});

/** Live-updates the books list whenever the backend emits its update event. */
export function useBooksRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handler = () => {
      void queryClient.invalidateQueries({ queryKey: booksKeys.all });
    };

    try {
      socket.connect();
      socket.on(BOOKS_UPDATED_EVENT, handler);
      socket.on("books_updated", handler);
    } catch {
      // realtime is optional; the UI keeps working without it
    }

    return () => {
      socket.off(BOOKS_UPDATED_EVENT, handler);
      socket.off("books_updated", handler);
    };
  }, [queryClient]);
}