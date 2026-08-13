import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addToCart, fetchCart, removeCartItem, updateCartItemQuantity } from "@/api/cart.api";
import { useAuth } from "@/context/auth-context";

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
    mutationFn: (bookId: string) => addToCart(bookId),
    onSuccess: (res) => {
      queryClient.setQueryData(cartKeys.all, res.data);
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
    },
  });
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => removeCartItem(itemId),
    onSuccess: (res) => {
      queryClient.setQueryData(cartKeys.all, res.data);
    },
  });
}