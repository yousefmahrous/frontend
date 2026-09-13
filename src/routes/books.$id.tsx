import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  Building2,
  Hash,
  Heart,
  Mail,
  PackageX,
  ShoppingCart,
} from "lucide-react";
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
import { pickLocalized } from "@/lib/localized";
import { ReviewsSection } from "@/components/reviews/ReviewsList";

import en from "@/i18n/locales/en.json";
import ar from "@/i18n/locales/ar.json";
import { DEFAULT_LANG, type Lang } from "@/i18n/i18n";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/books/$id")({
  ssr: false,
  head: ({ match }) => {
    const lang = (match.context as { lang?: Lang }).lang ?? DEFAULT_LANG;
    const meta = (lang === "ar" ? ar : en).pageMeta.bookDetailsPage;
    return {
      meta: [
        { title: meta.title },
        { name: "description", content: meta.description },
        { property: "og:title", content: meta.title },
        { property: "og:description", content: meta.ogDescription },
      ],
    };
  },
  component: BookDetails,
});

function BookDetails() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as Lang;
  const { id } = Route.useParams();
  const { data: book, isLoading, isError, error, refetch } = useBook(id);
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const addToCart = useAddToCart();
  const favorite = useToggleFavorite(id);

  useBooksRealtime();

  function requireLogin() {
    toast.info(t("bookDetails.loginFirst"));
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

  const bookName = pickLocalized(book.name, lang);
  const bookDescription = pickLocalized(book.adress, lang);

  const details = [
    { icon: Building2, label: t("bookDetails.publisher"), value: book.centre },
    { icon: Hash, label: "ISBN", value: book.number },
    { icon: Mail, label: t("bookDetails.publisherEmail"), value: book.email },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Button asChild variant="ghost" className="mb-6 gap-2">
        <Link to="/books">
          <ArrowRight className="size-4" />
          {t("bookDetails.backToCatalog")}
        </Link>
      </Button>

      <div className="grid gap-8 md:grid-cols-[280px_1fr]">
        <div className="overflow-hidden rounded-xl border border-border bg-secondary shadow-book">
          {book.avatar_url ? (
            <img
              src={book.avatar_url}
              alt={t("common.bookCoverAlt", { name: bookName })}
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
            <Badge variant="secondary">{t(`categories.${book.category}`, book.category)}</Badge>
            <h1 className="text-3xl font-extrabold leading-snug">{bookName}</h1>
          </div>

          <p className="leading-relaxed text-muted-foreground">{bookDescription}</p>

          <p className="text-2xl font-extrabold text-accent">
            {(book.price / 100).toFixed(2)} {t("bookDetails.currency")}
          </p>

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
              {t("bookDetails.outOfStockNow")}
            </Badge>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t("bookDetails.copiesLeft", { count: book.stock })}
            </p>
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
                {addToCart.isPending ? t("bookDetails.adding") : t("common.addToCart")}
              </Button>

              <Button
                onClick={handleToggleFavorite}
                disabled={favorite.isPending}
                variant="outline"
                size="lg"
                className="gap-2"
                aria-pressed={favorite.isFavorite}
                aria-label={
                  favorite.isFavorite
                    ? t("bookDetails.removeFromFavorites")
                    : t("bookDetails.addToFavorites")
                }
                data-testid="book-detail-favorite-toggle"
              >
                <Heart className={cn("size-4", favorite.isFavorite && "fill-accent text-accent")} />
                {favorite.isFavorite
                  ? t("bookDetails.inFavorites")
                  : t("bookDetails.addToFavorites")}
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