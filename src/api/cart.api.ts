import { api } from "./client";

export const CART_PATH = "/cart";

export interface CartItemProduct {
  id: string;
  name: string;
  number: string | null;
  category: string;
  stock: number;
  price: number;
  avatar_url?: string | null;
}

export interface CartItem {
  id: string;
  quantity: number;
  variant?: { id: number; sku: string | null; options: Record<string, string> };
  product: CartItemProduct;
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

export async function addToCart(productId: string, variantId?: number) {
  const { data } = await api.post<{ success: boolean; data: Cart; message: string }>(
    `${CART_PATH}/items`,
    { product_id: productId, ...(variantId ? { variant_id: variantId } : {}) },
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