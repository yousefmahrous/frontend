import { MessageSquareText, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { errorMessage } from "@/api/client";
import { EmptyState, ErrorState } from "@/components/StateViews";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/auth-context";
import { useBookReviews, useDeleteReview } from "@/hooks/useReviews";
import { StarRating } from "./StarRating";
import { ReviewForm } from "./ReviewForm";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
}

export function ReviewsSummary({ bookId }: { bookId: string }) {
  const { data } = useBookReviews(bookId, 1, 1);

  if (!data) return null;

  return (
    <div className="flex items-center gap-3">
      <StarRating value={Math.round(data.rating_average)} readOnly size="md" />
      <span className="text-sm font-semibold">{data.rating_average.toFixed(1)}</span>
      <span className="text-sm text-muted-foreground">
        ({data.reviews_count} {data.reviews_count === 1 ? "تقييم" : "تقييمات"})
      </span>
    </div>
  );
}

export function ReviewsSection({ bookId }: { bookId: string }) {
  const { user, isAdmin } = useAuth();
  const { data, isLoading, isError, error, refetch } = useBookReviews(bookId, 1, 20);
  const deleteReview = useDeleteReview(bookId);

  const myReview = data?.reviews.find((r) => r.user.id === user?.id);

  function handleDelete(reviewId: string) {
    deleteReview.mutate(reviewId, {
      onSuccess: (res) => toast.success(res.message),
      onError: (err) => toast.error(errorMessage(err)),
    });
  }

  return (
    <section className="space-y-5">
      <div className="flex items-center gap-2">
        <MessageSquareText className="size-5 text-accent" />
        <h2 className="text-xl font-bold">التقييمات والمراجعات</h2>
      </div>

      {data && (
        <div className="flex items-center gap-3">
          <StarRating value={Math.round(data.rating_average)} readOnly size="lg" />
          <span className="text-lg font-bold">{data.rating_average.toFixed(1)}</span>
          <span className="text-sm text-muted-foreground">
            من {data.reviews_count} {data.reviews_count === 1 ? "تقييم" : "تقييمات"}
          </span>
        </div>
      )}

      {user && !isAdmin && <ReviewForm bookId={bookId} existingReview={myReview} />}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
      ) : !data?.reviews.length ? (
        <EmptyState title="مفيش تقييمات لسه" description="كن أول من يقيّم الكتاب ده." />
      ) : (
        <div className="space-y-3">
          {data.reviews.map((review) => (
            <div key={review.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar className="size-9">
                    <AvatarFallback className="text-sm font-semibold">
                      {review.user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold">{review.user.name}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(review.created_at)}</p>
                  </div>
                </div>

                {(user?.id === review.user.id || isAdmin) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(review.id)}
                    disabled={deleteReview.isPending}
                    aria-label="احذف التقييم"
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                )}
              </div>

              <div className="mt-2">
                <StarRating value={review.rating} readOnly size="sm" />
              </div>

              <p className="mt-2 text-sm leading-relaxed text-foreground">{review.comment}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}