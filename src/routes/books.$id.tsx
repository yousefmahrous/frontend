import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Building2, Hash, Heart, Mail, PackageX, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { errorMessage } from "@/api/client";
import { ErrorState } from "@/components/StateViews";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
import { useAddToCart } from "@/hooks/useCart";
import { useBook } from "@/hooks/useBooks";
import { useBooksRealtime } from "@/hooks/useBooksRealtime";
import { useToggleFavorite } from "@/hooks/useFavorites";
import { ReviewsSection } from "@/components/reviews/ReviewsList";

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
  component: BookDetails,
});

function BookDetails() {
  const { id } = Route.useParams();
  const { data: book, isLoading, isError, error, refetch } = useBook(id);
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const addToCart = useAddToCart();
  const favorite = useToggleFavorite(id);

  useBooksRealtime();

  function requireLogin() {
    toast.info("سجّل دخولك الأول عشان تقدر تكمل");
    void navigate({ to: "/login" });
  }

  function handleAddToCart() {
    if (!user) return requireLogin();
    addToCart.mutate(id, {
      onSuccess: (res) => toast.success(res.message),
      onError: (err) => toast.error(errorMessage(err)),
    });
  }

  function handleToggleFavorite() {
    if (!user) return requireLogin();
    favorite.toggle({
      onSuccess: (message) => message && toast.success(message),
      onError: (err) => toast.error(errorMessage(err)),
    });
  }

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
            <Badge variant="secondary">{book.category}</Badge>
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

          {book.stock <= 0 ? (
            <Badge variant="destructive" className="w-fit gap-1.5 px-3 py-1.5 text-sm">
              <PackageX className="size-4" />
              الكمية غير متوفرة حاليًا
            </Badge>
          ) : (
            <p className="text-sm text-muted-foreground">متبقي {book.stock} نسخة فقط</p>
          )}

          {!isAdmin && (
            <div className="flex items-center gap-3">
              <Button
                onClick={handleAddToCart}
                disabled={addToCart.isPending || book.stock <= 0}
                size="lg"
                className="gap-2"
              >
                <ShoppingCart className="size-4" />
                {addToCart.isPending ? "جاري الإضافة..." : "أضف للعربية"}
              </Button>

              <Button
                onClick={handleToggleFavorite}
                disabled={favorite.isPending}
                variant="outline"
                size="lg"
                className="gap-2"
                aria-pressed={favorite.isFavorite}
                aria-label={favorite.isFavorite ? "احذف من المفضلة" : "ضيف للمفضلة"}
              >
                <Heart
                  className={cn(
                    "size-4",
                    favorite.isFavorite && "fill-accent text-accent",
                  )}
                />
                {favorite.isFavorite ? "في المفضلة" : "أضف للمفضلة"}
              </Button>
            </div>
          )}
        </div>
      </div>
    <div className="mt-12 border-t border-border pt-10">
      <ReviewsSection bookId={id} />
    </div>
    </div>
  );
}