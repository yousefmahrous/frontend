import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Building2, Hash, Mail } from "lucide-react";

import { errorMessage } from "@/api/client";
import { Protected } from "@/components/Guards";
import { ErrorState } from "@/components/StateViews";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useBook } from "@/hooks/useBooks";

export const Route = createFileRoute("/books/$id")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "تفاصيل الكتاب | مكتبة القراء" },
      { name: "description", content: "كل تفاصيل الكتاب: الوصف، دار النشر، التصنيف ورقم ISBN." },
      { property: "og:title", content: "تفاصيل الكتاب | مكتبة القراء" },
      { property: "og:description", content: "كل تفاصيل الكتاب في مكتبة القراء." },
    ],
  }),
  component: () => (
    <Protected>
      <BookDetails />
    </Protected>
  ),
});

function BookDetails() {
  const { id } = Route.useParams();
  const { data: book, isLoading, isError, error, refetch } = useBook(id);

  if (isLoading) {
    return (
      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 md:grid-cols-[280px_1fr]">
        <Skeleton className="aspect-2/3 w-full rounded-xl" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-28 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !book) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-14">
        <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
      </div>
    );
  }

  const details = [
    { icon: Building2, label: "دار النشر", value: book.centre },
    { icon: Hash, label: "ISBN", value: book.number },
    { icon: Mail, label: "إيميل الناشر", value: book.email },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Button asChild variant="ghost" className="mb-6 gap-2">
        <Link to="/books">
          <ArrowRight className="size-4" />
          رجوع للكتالوج
        </Link>
      </Button>

      <div className="grid gap-8 md:grid-cols-[280px_1fr]">
        <div className="overflow-hidden rounded-xl border border-border bg-secondary shadow-book">
          {book.avatar_url ? (
            <img
              src={book.avatar_url}
              alt={`غلاف كتاب ${book.name}`}
              className="aspect-2/3 w-full object-cover"
            />
          ) : (
            <div className="flex aspect-2/3 w-full items-center justify-center text-muted-foreground">
              <BookOpen className="size-12" />
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <Badge variant="secondary">{book.grade}</Badge>
            <h1 className="text-3xl font-extrabold leading-snug">{book.name}</h1>
          </div>

          <p className="leading-relaxed text-muted-foreground">{book.adress}</p>

          <dl className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2">
            {details.map((item) => (
              <div key={item.label} className="flex items-start gap-3">
                <item.icon className="mt-0.5 size-4 text-accent" />
                <div>
                  <dt className="text-xs text-muted-foreground">{item.label}</dt>
                  <dd className="text-sm font-medium break-all">{item.value}</dd>
                </div>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}