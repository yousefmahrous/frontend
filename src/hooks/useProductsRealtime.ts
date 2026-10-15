import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { io } from "socket.io-client";

import { PRODUCTS_UPDATED_EVENT, SOCKET_URL } from "@/api/client";
import { productsKeys } from "./useProducts";


const socket = io(SOCKET_URL, {
  withCredentials: true,
  transports: ["websocket", "polling"],
  autoConnect: false,
});

export function useProductsRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handler = () => {
      void queryClient.invalidateQueries({ queryKey: productsKeys.all });
    };

    try {
      socket.connect();
      socket.on(PRODUCTS_UPDATED_EVENT, handler);
      socket.on("products_updated", handler);
    } catch {
    }

    return () => {
      socket.off(PRODUCTS_UPDATED_EVENT, handler);
      socket.off("products_updated", handler);
    };
  }, [queryClient]);
}