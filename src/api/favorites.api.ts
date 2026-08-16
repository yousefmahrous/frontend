import { api } from "./client"

export const FAVORITES_PATH = "/favorites";

export interface FavoriteBook {
  id: string;
  name: string;
  number: string;
  category: string;
  stock: number;
  avatar_url?: string | null;
}

export interface FavoriteItem {
  id: string;
  book: FavoriteBook;
}

export interface Favorites {
  items: FavoriteItem[];
  itemsCount: number;
}

export async function fetchFavorites() {
  const { data } = await api.get<{ success: boolean; data: Favorites }>(FAVORITES_PATH);
  return data.data;
}

export async function addFavorite(bookId: string) {
  const { data } = await api.post<{ success: boolean; data: Favorites; message: string }>(
    `${FAVORITES_PATH}/items`,
    { book_id: bookId },
  );
  return data;
}

export async function removeFavorite(bookId: string) {
  const { data } = await api.delete<{ success: boolean; data: Favorites; message: string }>(
    `${FAVORITES_PATH}/items/${bookId}`,
  );
  return data;
}