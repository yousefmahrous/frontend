import ar from "@/i18n/locales/ar.json";
import en from "@/i18n/locales/en.json";
import { readLangCookie } from "@/i18n/langCookie";
import type { LocalizedText } from "@/lib/localized";
import { api, BOOKS_PATH } from "./client";

export type { LocalizedText };

export type BookCategory = "novels" | "science" | "history" | "kids";

export const BOOK_CATEGORIES: BookCategory[] = ["novels", "science", "history", "kids"];

export interface Book {
  id: string;
  name: LocalizedText;
  number: string;
  email: string;
  adress: LocalizedText;
  centre: string;
  category: BookCategory | string;
  price: number;
  stock: number;
  avatar_key?: string | null;
  avatar_url?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface BookPayload {
  name: LocalizedText;
  number: string;
  email: string;
  adress: LocalizedText;
  centre: string;
  category: string;
  price: number;
  stock: number;
  avatar_key: string | null;
}

export interface Pagination {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  limit: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface BooksListResult {
  items: Book[];
  pagination: Pagination;
}

export async function fetchBooks(params: { page: number; limit: number; search?: string; category?: string }) {
  const { data } = await api.get<{
    success: boolean;
    data: { users?: Book[]; items?: Book[]; pagination: Pagination };
  }>(BOOKS_PATH, {
    params: {
      page: params.page,
      limit: params.limit,
      ...(params.search ? { search: params.search } : {}),
      ...(params.category ? { category: params.category } : {}),
    },
  });

  const payload = data.data;
  const items = payload.users ?? payload.items ?? [];
  return { items, pagination: payload.pagination } satisfies BooksListResult;
}

export async function fetchPopularBooks(limit = 10) {
  const { data } = await api.get<{
    success: boolean;
    data: { users?: Book[]; items?: Book[] };
  }>(`${BOOKS_PATH}/popular`, {
    params: { limit },
  });

  const payload = data.data;
  return payload.users ?? payload.items ?? [];
}

export async function fetchBook(id: string) {
  const { data } = await api.get<{ success: boolean; data: { user?: Book; item?: Book } }>(
    `${BOOKS_PATH}/${id}`,
  );
  const book = data.data.user ?? data.data.item;
  if (!book) throw new Error((readLangCookie() === "en" ? en : ar).apiErrors.notFound);
  return book;
}

export async function createBook(payload: BookPayload) {
  const { data } = await api.post<{ success: boolean; message: string }>(BOOKS_PATH, payload);
  return data;
}

export async function updateBook(id: string, payload: BookPayload) {
  const { data } = await api.put<{ success: boolean; message: string }>(
    `${BOOKS_PATH}/${id}`,
    payload,
  );
  return data;
}

export async function deleteBook(id: string) {
  const { data } = await api.delete<{ success: boolean; message: string }>(`${BOOKS_PATH}/${id}`);
  return data;
}