import { useState } from "react";
import { toast } from "sonner";
import type { Review } from "@/api/reviews.api";
import { errorMessage } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSubmitReview } from "@/hooks/useReviews";
import { StarRating } from "./StarRating";

interface ReviewFormProps {
  bookId: string;
  existingReview?: Review | undefined;
}

export function ReviewForm({ bookId, existingReview }: ReviewFormProps) {
  const [rating, setRating] = useState(existingReview?.rating ?? 0);
  const [comment, setComment] = useState(existingReview?.comment ?? "");
  const submitReview = useSubmitReview(bookId);

  const isEditing = Boolean(existingReview);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (rating < 1 || rating > 5) {
      toast.error("اختار تقييم من 1 لـ5 نجوم");
      return;
    }

    if (comment.trim().length < 3) {
      toast.error("التعليق لازم يكون 3 حروف على الأقل");
      return;
    }

    submitReview.mutate(
      { rating, comment: comment.trim() },
      {
        onSuccess: (res) => toast.success(res.message),
        onError: (err) => toast.error(errorMessage(err)),
      },
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-border bg-card p-4">
      <div className="space-y-1.5">
        <p className="text-sm font-medium">{isEditing ? "عدّل تقييمك" : "قيّم الكتاب"}</p>
        <StarRating value={rating} onChange={setRating} size="lg" />
      </div>

      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="شاركنا رأيك في الكتاب..."
        rows={3}
        maxLength={1000}
      />

      <div className="flex items-center justify-end gap-2">
        <Button type="submit" disabled={submitReview.isPending}>
          {submitReview.isPending ? "جاري الحفظ..." : isEditing ? "حفظ التعديل" : "إرسال التقييم"}
        </Button>
      </div>
    </form>
  );
}