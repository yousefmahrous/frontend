import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Heart, Loader2, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { errorMessage } from "@/api/client";
import type { FavoriteItem } from "@/api/favorites.api";
import { Protected } from "@/components/Guards";
import { EmptyState, ErrorState } from "@/components/StateViews";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAddToCart } from "@/hooks/useCart";
import { useFavorites, useRemoveFavorite } from "@/hooks/useFavorites";

import en from "@/i18n/locales/en.json";
import ar from "@/i18n/locales/ar.json";
import { DEFAULT_LANG, type Lang } from "@/i18n/i18n";
import { useTranslation } from "react-i18next";
export const Route = createFileRoute("/favorites")({
  ssr: false,
  head: ({ match }) => {
    const lang = (match.context as { lang?: Lang }).lang ?? DEFAULT_LANG;
    const meta = (lang === "ar" ? ar : en).pageMeta.favoritesPage;
    return {
      meta: [
        { title: meta.title },
      ],
    };
  },
  component: () => (
    <Protected>
      <FavoritesPage />
    </Protected>
  ),
});

function FavoritesPage() {
  const { t } = useTranslation();
  const { data: favorites, isLoading, isError, error, refetch } = useFavorites();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-10">
        <Skeleton className="h-8 w-40" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-14">
        <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
      </div>
    );
  }

  const items = favorites?.items ?? [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex items-center gap-3">
        <Heart className="size-6 text-accent" />
        <h1 className="text-2xl font-extrabold">{t("favorites.title")}</h1>
        {items.length > 0 && <Badge variant="secondary">{t("favorites.bookCount", { count: favorites?.itemsCount })}</Badge>}
      </div>

      {items.length === 0 ? (
        <EmptyState
          title={t("favorites.empty")}
          description={t("favorites.emptyDesc")}
        />
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <FavoriteItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

function FavoriteItemCard({ item }: { item: FavoriteItem }) {
  const { t } = useTranslation();
  const removeFavorite = useRemoveFavorite();
  const addToCart = useAddToCart();

  function handleRemove() {
    removeFavorite.mutate(item.book.id, {
      onSuccess: (res) => toast.success(res.message),
      onError: (err) => toast.error(errorMessage(err)),
    });
  }

  function handleAddToCart() {
    addToCart.mutate(item.book.id, {
      onSuccess: (res) => toast.success(res.message),
      onError: (err) => toast.error(errorMessage(err)),
    });
  }

  return (
    <div className="flex gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
      <Link
        to="/books/$id"
        params={{ id: item.book.id }}
        className="shrink-0 overflow-hidden rounded-lg border border-border bg-secondary"
      >
        {item.book.avatar_url ? (
          <img
            src={item.book.avatar_url}
            alt={t("common.bookCoverAlt", { name: item.book.name })}
            className="aspect-2/3 w-20 object-cover"
          />
        ) : (
          <div className="flex aspect-2/3 w-20 items-center justify-center text-muted-foreground">
            <BookOpen className="size-6" />
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col justify-between gap-3">
        <div>
          <Badge variant="secondary" className="mb-1">
            {item.book.category}
          </Badge>
          <Link
            to="/books/$id"
            params={{ id: item.book.id }}
            className="block font-bold hover:text-accent"
          >
            {item.book.name}
          </Link>
          <p className="text-xs text-muted-foreground">ISBN: {item.book.number}</p>
        </div>

        <div className="flex items-center justify-between">
          <Button
            variant="secondary"
            size="sm"
            className="gap-2"
            disabled={addToCart.isPending || item.book.stock <= 0}
            onClick={handleAddToCart}
          >
            {addToCart.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <ShoppingCart className="size-3.5" />
            )}
            {item.book.stock <= 0 ? t("common.outOfStock") : t("common.addToCart")}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            disabled={removeFavorite.isPending}
            onClick={handleRemove}
            aria-label={t("favorites.removeItem")}
          >
            {removeFavorite.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Trash2 className="size-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}