import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  PackageOpen,
  Building2,
  Hash,
  Heart,
  Mail,
  PackageX,
  ShoppingCart,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { errorMessage } from "@/api/client";
import { ErrorState } from "@/components/StateViews";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
import { useAddToCart } from "@/hooks/useCart";
import { useProduct } from "@/hooks/useProducts";
import { useProductsRealtime } from "@/hooks/useProductsRealtime";
import { useToggleFavorite } from "@/hooks/useFavorites";
import { pickLocalized } from "@/lib/localized";
import { ReviewsSection } from "@/components/reviews/ReviewsList";

import en from "@/i18n/locales/en.json";
import ar from "@/i18n/locales/ar.json";
import { DEFAULT_LANG, type Lang } from "@/i18n/i18n";
import { useTranslation } from "react-i18next";
import type { ProductVariant } from "@/api/products.api";

const optionNamesOf = (variants: ProductVariant[]) =>
  Array.from(new Set(variants.flatMap((v) => Object.keys(v.options))));

const matches = (v: ProductVariant, selection: Record<string, string>) =>
  Object.entries(selection).every(([name, value]) => v.options[name] === value);

export const Route = createFileRoute("/products/$id")({
  ssr: false,
  head: ({ match }) => {
    const lang = (match.context as { lang?: Lang }).lang ?? DEFAULT_LANG;
    const meta = (lang === "ar" ? ar : en).pageMeta.productDetailsPage;
    return {
      meta: [
        { title: meta.title },
        { name: "description", content: meta.description },
        { property: "og:title", content: meta.title },
        { property: "og:description", content: meta.ogDescription },
      ],
    };
  },
  component: ProductDetails,
});

function ProductDetails() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as Lang;
  const { id } = Route.useParams();
  const { data: product, isLoading, isError, error, refetch } = useProduct(id);
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const addToCart = useAddToCart();
  const favorite = useToggleFavorite(id);
  const [selection, setSelection] = useState<Record<string, string> | null>(null);

  useProductsRealtime();

  const variants = product?.variants ?? [];
  const hasOptions = variants.length > 1;
  const optionNames = optionNamesOf(variants);
  const defaultVariant = variants.find((v) => v.stock > 0) ?? variants[0];
  const currentSelection = selection ?? defaultVariant?.options ?? {};
  const selectedVariant = hasOptions ? variants.find((v) => matches(v, currentSelection)) : undefined;

  function chooseOption(name: string, value: string) {
    const next = { ...currentSelection, [name]: value };
    if (variants.some((v) => matches(v, next))) return setSelection(next);
    // That exact combination doesn't exist: jump to the closest variant that has this value.
    const fallback = variants.find((v) => v.options[name] === value && v.stock > 0) ??
      variants.find((v) => v.options[name] === value);
    if (fallback) setSelection(fallback.options);
  }

  function requireLogin() {
    toast.info(t("productDetails.loginFirst"));
    void navigate({ to: "/login" });
  }

  function handleAddToCart() {
    if (!user) return requireLogin();
    if (hasOptions && !selectedVariant) {
      toast.error(t("productDetails.pickOptions"));
      return;
    }
    addToCart.mutate(selectedVariant ? { productId: id, variantId: selectedVariant.id } : id, {
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

  if (isError || !product) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-14">
        <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
      </div>
    );
  }

  const productName = pickLocalized(product.name, lang);
  const productDescription = pickLocalized(product.adress, lang);
  const shownPrice = selectedVariant ? selectedVariant.price : product.price;
  const shownStock = hasOptions ? (selectedVariant?.stock ?? 0) : product.stock;

  const details = [
    { icon: Building2, label: t("productDetails.publisher"), value: product.centre },
    { icon: Hash, label: "ISBN", value: product.number },
    { icon: Mail, label: t("productDetails.publisherEmail"), value: product.email },
  ].filter((item) => Boolean(item.value));

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Button asChild variant="ghost" className="mb-6 gap-2">
        <Link to="/products">
          <ArrowRight className="size-4" />
          {t("productDetails.backToCatalog")}
        </Link>
      </Button>

      <div className="grid gap-8 md:grid-cols-[280px_1fr]">
        <div className="overflow-hidden rounded-xl border border-border bg-secondary shadow-product">
          {product.avatar_url ? (
            <img
              src={product.avatar_url}
              alt={t("common.productCoverAlt", { name: productName })}
              className="aspect-2/3 w-full object-cover"
            />
          ) : (
            <div className="flex aspect-2/3 w-full items-center justify-center text-muted-foreground">
              <PackageOpen className="size-12" />
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <Badge variant="secondary">{t(`categories.${product.category}`, product.category)}</Badge>
            <h1 className="text-3xl font-extrabold leading-snug">{productName}</h1>
          </div>

          <p className="leading-relaxed text-muted-foreground">{productDescription}</p>

          <p className="text-2xl font-extrabold text-accent">
            {(shownPrice / 100).toFixed(2)} {t("productDetails.currency")}
          </p>

          {hasOptions && (
            <div className="space-y-4">
              {optionNames.map((name) => {
                const values = Array.from(new Set(variants.map((v) => v.options[name]).filter((x): x is string => Boolean(x))));
                return (
                  <div key={name} className="space-y-2">
                    <p className="text-sm font-semibold">{name}</p>
                    <div className="flex flex-wrap gap-2">
                      {values.map((value) => {
                        const active = currentSelection[name] === value;
                        const inStock = variants.some((v) => v.options[name] === value && v.stock > 0);
                        return (
                          <Button
                            key={value}
                            type="button"
                            variant={active ? "default" : "outline"}
                            size="sm"
                            className={cn(!inStock && "line-through opacity-60")}
                            aria-pressed={active}
                            onClick={() => chooseOption(name, value)}
                          >
                            {value}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

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

          {shownStock <= 0 ? (
            <Badge variant="destructive" className="w-fit gap-1.5 px-3 py-1.5 text-sm">
              <PackageX className="size-4" />
              {t("productDetails.outOfStockNow")}
            </Badge>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t("productDetails.copiesLeft", { count: shownStock })}
            </p>
          )}

          {!isAdmin && (
            <div className="flex items-center gap-3">
              <Button
                onClick={handleAddToCart}
                disabled={addToCart.isPending || shownStock <= 0}
                size="lg"
                className="gap-2"
              >
                <ShoppingCart className="size-4" />
                {addToCart.isPending ? t("productDetails.adding") : t("common.addToCart")}
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
                    ? t("productDetails.removeFromFavorites")
                    : t("productDetails.addToFavorites")
                }
                data-testid="product-detail-favorite-toggle"
              >
                <Heart className={cn("size-4", favorite.isFavorite && "fill-accent text-accent")} />
                {favorite.isFavorite
                  ? t("productDetails.inFavorites")
                  : t("productDetails.addToFavorites")}
              </Button>
            </div>
          )}
        </div>
      </div>
      <div className="mt-12 border-t border-border pt-10">
        <ReviewsSection productId={id} />
      </div>
    </div>
  );
}