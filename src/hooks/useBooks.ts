import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import {
  createBook,
  deleteBook,
  fetchBook,
  fetchBooks,
  updateBook,
  type BookPayload,
} from "@/api/books.api";

export const booksKeys = {
  all: ["books"] as const,
  list: (params: { page: number; limit: number; search: string }) =>
    ["books", "list", params] as const,
  detail: (id: string) => ["books", "detail", id] as const,
};

export function useDebouncedValue<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function useBooks(params: { page: number; limit: number; search: string }) {
  return useQuery({
    queryKey: booksKeys.list(params),
    queryFn: () => fetchBooks(params),
    placeholderData: keepPreviousData,
    retry: false,
  });
}

export function useBook(id: string) {
  return useQuery({
    queryKey: booksKeys.detail(id),
    queryFn: () => fetchBook(id),
    retry: false,
    enabled: Boolean(id),
  });
}

export function useCreateBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BookPayload) => createBook(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: booksKeys.all }),
  });
}

export function useUpdateBook(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BookPayload) => updateBook(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: booksKeys.all });
      void queryClient.invalidateQueries({ queryKey: booksKeys.detail(id) });
    },
  });
}

export function useDeleteBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBook(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: booksKeys.all }),
  });
}