import { Link } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";

import type { Book } from "@/api/books.api";
import { Badge } from "@/components/ui/badge";

export function BookCard({ book }: { book: Book }) {
  const cover = book.avatar_url ?? null;

  return (
    <Link
      to="/books/$id"
      params={{ id: String(book.id) }}
      className="card-book group flex flex-col overflow-hidden rounded-xl border border-border bg-card"
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
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 font-bold leading-snug text-foreground">{book.name}</h3>
        <p className="text-xs text-muted-foreground">{book.centre}</p>
        <div className="mt-auto pt-2">
          <Badge variant="secondary">{book.grade}</Badge>
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