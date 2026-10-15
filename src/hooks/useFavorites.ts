import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { addFavorite, fetchFavorites, removeFavorite } from "@/api/favorites.api";
import { useAuth } from "@/context/auth-context";

export const favoritesKeys = {
  all: ["favorites"] as const,
};

export function useFavorites() {
  const { user, isAdmin } = useAuth();
  return useQuery({
    queryKey: favoritesKeys.all,
    queryFn: fetchFavorites,
    enabled: Boolean(user) && !isAdmin,
    retry: false,
  });
}

export function useAddFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) => addFavorite(productId),
    onSuccess: (res) => {
      queryClient.setQueryData(favoritesKeys.all, res.data);
    },
  });
}

export function useRemoveFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) => removeFavorite(productId),
    onSuccess: (res) => {
      queryClient.setQueryData(favoritesKeys.all, res.data);
    },
  });
}


export function useIsFavorite(productId: string) {
  const { data } = useFavorites();
  return Boolean(data?.items.some((item) => item.product.id === productId));
}


export function useToggleFavorite(productId: string) {
  const isFavorite = useIsFavorite(productId);
  const addFavoriteMutation = useAddFavorite();
  const removeFavoriteMutation = useRemoveFavorite();

  function toggle(options?: { onSuccess?: (message?: string) => void; onError?: (err: unknown) => void }) {
    if (isFavorite) {
      removeFavoriteMutation.mutate(productId, {
        onSuccess: (res) => options?.onSuccess?.(res.message),
        onError: (err) => options?.onError?.(err),
      });
    } else {
      addFavoriteMutation.mutate(productId, {
        onSuccess: (res) => options?.onSuccess?.(res.message),
        onError: (err) => options?.onError?.(err),
      });
    }
  }

  return {
    isFavorite,
    toggle,
    isPending: addFavoriteMutation.isPending || removeFavoriteMutation.isPending,
  };
}