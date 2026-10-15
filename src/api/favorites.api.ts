import { api } from "./client"

export const FAVORITES_PATH = "/favorites";

export interface FavoriteProduct {
  id: string;
  name: string;
  number: string | null;
  category: string;
  stock: number;
  avatar_url?: string | null;
}

export interface FavoriteItem {
  id: string;
  product: FavoriteProduct;
}

export interface Favorites {
  items: FavoriteItem[];
  itemsCount: number;
}

export async function fetchFavorites() {
  const { data } = await api.get<{ success: boolean; data: Favorites }>(FAVORITES_PATH);
  return data.data;
}

export async function addFavorite(productId: string) {
  const { data } = await api.post<{ success: boolean; data: Favorites; message: string }>(
    `${FAVORITES_PATH}/items`,
    { product_id: productId },
  );
  return data;
}

export async function removeFavorite(productId: string) {
  const { data } = await api.delete<{ success: boolean; data: Favorites; message: string }>(
    `${FAVORITES_PATH}/items/${productId}`,
  );
  return data;
}