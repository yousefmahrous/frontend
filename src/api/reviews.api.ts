import { api } from "./client";

export const REVIEWS_PATH = "/reviews";

export interface ReviewUser {
  id: string;
  name: string;
}

export interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  updated_at: string;
  user: ReviewUser;
}

export interface ReviewsPagination {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  limit: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface BookReviewsResult {
  reviews: Review[];
  rating_average: number;
  reviews_count: number;
  pagination: ReviewsPagination;
}

export interface ReviewMutationResult {
  review: Review;
  rating_average: number;
  reviews_count: number;
}

export interface ReviewDeleteResult {
  rating_average: number;
  reviews_count: number;
}

export async function fetchBookReviews(bookId: string, params: { page?: number; limit?: number } = {}) {
  const { data } = await api.get<{ success: boolean; data: BookReviewsResult }>(
    `${REVIEWS_PATH}/books/${bookId}`,
    { params: { page: params.page ?? 1, limit: params.limit ?? 10 } },
  );
  return data.data;
}

export async function submitReview(bookId: string, payload: { rating: number; comment: string }) {
  const { data } = await api.post<{ success: boolean; message: string; data: ReviewMutationResult }>(
    `${REVIEWS_PATH}/books/${bookId}`,
    payload,
  );
  return data;
}

export async function deleteReview(reviewId: string) {
  const { data } = await api.delete<{ success: boolean; message: string; data: ReviewDeleteResult }>(
    `${REVIEWS_PATH}/${reviewId}`,
  );
  return data;
}