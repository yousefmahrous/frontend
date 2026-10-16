import { Link, useNavigate } from "@tanstack/react-router";
import { CategoryName } from "@/components/products/CategoryName";
import { PackageOpen, Heart } from "lucide-react";
import type { MouseEvent } from "react";
import { toast } from "sonner";
import type { Product } from "@/api/products.api";
import { errorMessage } from "@/api/client";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/auth-context";
import { useToggleFavorite } from "@/hooks/useFavorites";
import { pickLocalized } from "@/lib/localized";
import { cn } from "@/lib/utils";

import { useTranslation } from "react-i18next";
import type { Lang } from "@/i18n/i18n";
export function ProductCard({ product }: { product: Product }) {
  const { t, i18n } = useTranslation();
  const name = pickLocalized(product.name, i18n.language as Lang);
  const cover = product.avatar_url ?? null;
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const favorite = useToggleFavorite(String(product.id));

  function handleToggleFavorite(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.info(t("productCard.loginToFavorite"));
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
      to="/products/$id"
      params={{ id: String(product.id) }}
      className="card-product group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card"
    >
      <div className="relative aspect-2/3 w-full overflow-hidden bg-secondary">
        {cover ? (
          <img
            src={cover}
            alt={t("common.productCoverAlt", { name })}
            loading="lazy"
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <PackageOpen className="size-10" />
            <span className="text-xs">{t("productCard.noCover")}</span>
          </div>
        )}

        {!isAdmin && (
          <button
            type="button"
            onClick={handleToggleFavorite}
            disabled={favorite.isPending}
            aria-pressed={favorite.isFavorite}
            aria-label={
              favorite.isFavorite ? t("productCard.removeFavoriteAria") : t("productCard.addFavoriteAria")
            }
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
        <h3 className="line-clamp-2 font-bold leading-snug text-foreground">{name}</h3>
        {product.centre && <p className="text-xs text-muted-foreground">{product.centre}</p>}
        <div className="mt-auto pt-2">
          <Badge variant="secondary"><CategoryName slug={product.category} /></Badge>
        </div>
      </div>
    </Link>
  );
}

export function ProductCardSkeleton() {
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

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}