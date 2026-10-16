import { createFileRoute } from "@tanstack/react-router";
import { CategoryName } from "@/components/products/CategoryName";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { errorMessage } from "@/api/client";
import { useCategories } from "@/hooks/useCategories";
import { ProductCard, ProductGridSkeleton } from "@/components/products/ProductCard";
import { EmptyState, ErrorState } from "@/components/StateViews";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProducts, useDebouncedValue } from "@/hooks/useProducts";
import { useProductsRealtime } from "@/hooks/useProductsRealtime";

import en from "@/i18n/locales/en.json";
import ar from "@/i18n/locales/ar.json";
import { DEFAULT_LANG, type Lang } from "@/i18n/i18n";
import { useTranslation } from "react-i18next";
export const Route = createFileRoute("/products/")({
  ssr: false,
  head: ({ match }) => {
    const lang = (match.context as { lang?: Lang }).lang ?? DEFAULT_LANG;
    const meta = (lang === "ar" ? ar : en).pageMeta.productsIndexPage;
    return {
      meta: [
        { title: meta.title },
        { name: "description", content: meta.description },
        { property: "og:title", content: meta.title },
        { property: "og:description", content: meta.ogDescription },
      ],
    };
  },
  component: CatalogPage,
});

const LIMIT = 12;

function CatalogPage() {
  const { t } = useTranslation();
  useProductsRealtime();
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const { data: categories = [] } = useCategories();
  const [category, setCategory] = useState<string | null>(null);
  const search = useDebouncedValue(searchInput, 400);

  const { data, isLoading, isFetching, isError, error, refetch } = useProducts({
    page,
    limit: LIMIT,
    search,
    category,
  });

  const products = data?.items ?? [];

  const pagination = data?.pagination;
  const pageNumbers = useMemo(() => {
    const total = pagination?.totalPages ?? 1;
    const list: number[] = [];
    for (let index = Math.max(1, page - 2); index <= Math.min(total, page + 2); index += 1) {
      list.push(index);
    }
    return list;
  }, [pagination?.totalPages, page]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-bold md:text-3xl">{t("products.title")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {pagination ? t("products.countAvailable", { count: pagination.totalCount }) : t("products.loadingProducts")}
      </p>

      <div className="mt-6 space-y-4">
        <div className="relative">
          <Search className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(event) => {
              setSearchInput(event.target.value);
              setPage(1);
            }}
            placeholder={t("products.searchPlaceholder")}
            className="pe-10"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={category === null ? "default" : "secondary"}
            size="sm"
            onClick={() => {
              setCategory(null);
              setPage(1);
            }}
          >
            {t("products.allCategories")}
          </Button>
          {categories.map((c) => (
            <Button
              key={c.slug}
              variant={category === c.slug ? "default" : "secondary"}
              size="sm"
              onClick={() => {
                setCategory(c.slug);
                setPage(1);
              }}
            >
              <CategoryName slug={c.slug} />
            </Button>
          ))}
        </div>
      </div>

      <div className="mt-8">
        {isLoading ? (
          <ProductGridSkeleton count={LIMIT} />
        ) : isError ? (
          <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
        ) : !products.length ? (
          <EmptyState
            variant={search || category ? "search" : "empty"}
            title={search || category ? t("products.noResults") : t("products.noProductsYet")}
            description={
              search || category
                ? t("products.tryOtherSearch")
                : t("products.firstProductsAppearHere")
            }
          />
        ) : (
          <div
            className={`grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 ${
              isFetching ? "opacity-70 transition-opacity" : ""
            }`}
          >
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={!pagination.hasPreviousPage}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            className="gap-1"
          >
            <ChevronRight className="size-4" />
            {t("products.prev")}
          </Button>
          {pageNumbers.map((number) => (
            <Button
              key={number}
              size="sm"
              variant={number === pagination.currentPage ? "default" : "ghost"}
              onClick={() => setPage(number)}
            >
              {number}
            </Button>
          ))}
          <Button
            variant="secondary"
            size="sm"
            disabled={!pagination.hasNextPage}
            onClick={() => setPage((prev) => prev + 1)}
            className="gap-1"
          >
            {t("products.next")}
            <ChevronLeft className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}