import { Link, useNavigate } from "@tanstack/react-router";
import { BookOpen, Heart } from "lucide-react";
import type { MouseEvent } from "react";
import { toast } from "sonner";
import type { Book } from "@/api/books.api";
import { errorMessage } from "@/api/client";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/auth-context";
import { useToggleFavorite } from "@/hooks/useFavorites";
import { cn } from "@/lib/utils";

export function BookCard({ book }: { book: Book }) {
  const cover = book.avatar_url ?? null;
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const favorite = useToggleFavorite(String(book.id));

  function handleToggleFavorite(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.info("سجّل دخولك الأول عشان تقدر تضيف للمفضلة");
      void navigate({ to: "/login" });
      return;
    }

    favorite.toggle({
      onSuccess: (message) => message && toast.success(message),
      onError: (err) => toast.error(errorMessage(err)),
    });
  }

  return (
    <Link
      to="/books/$id"
      params={{ id: String(book.id) }}
      className="card-book group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card"
    >
      <div className="relative aspect-2/3 w-full overflow-hidden bg-secondary">
        {cover ? (
          <img
            src={cover}
            alt={`غلاف كتاب ${book.name}`}
            loading="lazy"
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <BookOpen className="size-10" />
            <span className="text-xs">لا يوجد غلاف</span>
          </div>
        )}

        {!isAdmin && (
          <button
            type="button"
            onClick={handleToggleFavorite}
            disabled={favorite.isPending}
            aria-pressed={favorite.isFavorite}
            aria-label={favorite.isFavorite ? "احذف من المفضلة" : "ضيف للمفضلة"}
            className="absolute left-2 top-2 flex size-8 items-center justify-center rounded-full bg-background/80 backdrop-blur transition-colors hover:bg-background"
          >
            <Heart
              className={cn(
                "size-4 text-muted-foreground",
                favorite.isFavorite && "fill-accent text-accent",
              )}
            />
          </button>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 font-bold leading-snug text-foreground">{book.name}</h3>
        <p className="text-xs text-muted-foreground">{book.centre}</p>
        <div className="mt-auto pt-2">
          <Badge variant="secondary">{book.category}</Badge>
        </div>
      </div>
    </Link>
  );
}

export function BookCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="aspect-2/3 w-full animate-pulse bg-muted" />
      <div className="space-y-2 p-4">
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}

export function BookGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <BookCardSkeleton key={index} />
      ))}
    </div>
  );
}