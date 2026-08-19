import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  deleteReview as deleteReviewApi,
  fetchBookReviews,
  submitReview,
} from "@/api/reviews.api";
import { booksKeys } from "@/hooks/useBooks";

export const reviewsKeys = {
  all: ["reviews"] as const,
  book: (bookId: string, page: number) => ["reviews", "book", bookId, page] as const,
};

export function useBookReviews(bookId: string, page = 1, limit = 10) {
  return useQuery({
    queryKey: reviewsKeys.book(bookId, page),
    queryFn: () => fetchBookReviews(bookId, { page, limit }),
    enabled: Boolean(bookId),
  });
}

export function useSubmitReview(bookId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { rating: number; comment: string }) => submitReview(bookId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["reviews", "book", bookId] });
      void queryClient.invalidateQueries({ queryKey: booksKeys.detail(bookId) });
    },
  });
}

export function useDeleteReview(bookId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reviewId: string) => deleteReviewApi(reviewId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["reviews", "book", bookId] });
      void queryClient.invalidateQueries({ queryKey: booksKeys.detail(bookId) });
    },
  });
}