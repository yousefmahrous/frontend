import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { addToCart, fetchCart, removeCartItem, updateCartItemQuantity } from "@/api/cart.api";
import { useAuth } from "@/context/auth-context";
import { productsKeys } from "./useProducts";

export const cartKeys = {
  all: ["cart"] as const,
};

export function useCart() {
  const { user } = useAuth();
  return useQuery({
    queryKey: cartKeys.all,
    queryFn: fetchCart,
    enabled: Boolean(user),
    retry: false,
  });
}

export function useAddToCart() {
  const queryClient = useQueryClient();
  return useMutation({
    // A plain product id keeps working (favorites etc.); pass { productId, variantId } to pick a variant.
    mutationFn: (arg: string | { productId: string; variantId?: number }) =>
      typeof arg === "string" ? addToCart(arg) : addToCart(arg.productId, arg.variantId),
    onSuccess: (res) => {
      queryClient.setQueryData(cartKeys.all, res.data);
      // Adding to cart reserves stock in the DB, so the product's list/detail
      // queries (which include stock) need to be refreshed too.
      void queryClient.invalidateQueries({ queryKey: productsKeys.all });
    },
  });
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      updateCartItemQuantity(itemId, quantity),
    onSuccess: (res) => {
      queryClient.setQueryData(cartKeys.all, res.data);
      void queryClient.invalidateQueries({ queryKey: productsKeys.all });
    },
  });
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => removeCartItem(itemId),
    onSuccess: (res) => {
      queryClient.setQueryData(cartKeys.all, res.data);
      // Removing an item releases stock back to the product, refresh it too.
      void queryClient.invalidateQueries({ queryKey: productsKeys.all });
    },
  });
}