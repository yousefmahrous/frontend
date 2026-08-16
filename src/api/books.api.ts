import { api, BOOKS_PATH } from "./client";

export type BookCategory = "روايات" | "علمي" | "تاريخي" | "أطفال";

export const BOOK_CATEGORIES: BookCategory[] = ["روايات", "علمي", "تاريخي", "أطفال"];

export interface Book {
  id: string;
  name: string;
  number: string;
  email: string;
  adress: string;
  centre: string;
  category: BookCategory | string;
  stock: number;
  avatar_key?: string | null;
  avatar_url?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface BookPayload {
  name: string;
  number: string;
  email: string;
  adress: string;
  centre: string;
  category: string;
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

export async function fetchBooks(params: { page: number; limit: number; search?: string }) {
  const { data } = await api.get<{
    success: boolean;
    data: { users?: Book[]; items?: Book[]; pagination: Pagination };
  }>(BOOKS_PATH, {
    params: {
      page: params.page,
      limit: params.limit,
      ...(params.search ? { search: params.search } : {}),
    },
  });

  const payload = data.data;
  const items = payload.users ?? payload.items ?? [];
  return { items, pagination: payload.pagination } satisfies BooksListResult;
}

export async function fetchBook(id: string) {
  const { data } = await api.get<{ success: boolean; data: { user?: Book; item?: Book } }>(
    `${BOOKS_PATH}/${id}`,
  );
  const book = data.data.user ?? data.data.item;
  if (!book) throw new Error("غير موجود");
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