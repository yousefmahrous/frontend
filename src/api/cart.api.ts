import { api } from "./client";

export const CART_PATH = "/cart";

export interface CartItemBook {
  id: string;
  name: string;
  number: string;
  category: string;
  avatar_url?: string | null;
}

export interface CartItem {
  id: string;
  quantity: number;
  book: CartItemBook;
}

export interface Cart {
  id: string;
  items: CartItem[];
  itemsCount: number;
}

export async function fetchCart() {
  const { data } = await api.get<{ success: boolean; data: Cart }>(CART_PATH);
  return data.data;
}

export async function addToCart(bookId: string) {
  const { data } = await api.post<{ success: boolean; data: Cart; message: string }>(
    `${CART_PATH}/items`,
    { book_id: bookId },
  );
  return data;
}

export async function updateCartItemQuantity(itemId: string, quantity: number) {
  const { data } = await api.patch<{ success: boolean; data: Cart }>(
    `${CART_PATH}/items/${itemId}`,
    { quantity },
  );
  return data;
}

export async function removeCartItem(itemId: string) {
  const { data } = await api.delete<{ success: boolean; data: Cart; message: string }>(
    `${CART_PATH}/items/${itemId}`,
  );
  return data;
}