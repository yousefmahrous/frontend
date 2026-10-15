import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  deleteReview as deleteReviewApi,
  fetchProductReviews,
  submitReview,
} from "@/api/reviews.api";
import { productsKeys } from "@/hooks/useProducts";

export const reviewsKeys = {
  all: ["reviews"] as const,
  product: (productId: string, page: number) => ["reviews", "product", productId, page] as const,
};

export function useProductReviews(productId: string, page = 1, limit = 10) {
  return useQuery({
    queryKey: reviewsKeys.product(productId, page),
    queryFn: () => fetchProductReviews(productId, { page, limit }),
    enabled: Boolean(productId),
  });
}

export function useSubmitReview(productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { rating: number; comment: string }) => submitReview(productId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["reviews", "product", productId] });
      void queryClient.invalidateQueries({ queryKey: productsKeys.detail(productId) });
    },
  });
}

export function useDeleteReview(productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reviewId: string) => deleteReviewApi(reviewId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["reviews", "product", productId] });
      void queryClient.invalidateQueries({ queryKey: productsKeys.detail(productId) });
    },
  });
}