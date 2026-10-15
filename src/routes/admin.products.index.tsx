import { createFileRoute, Link } from "@tanstack/react-router";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { errorMessage } from "@/api/client";
import { AdminOnly } from "@/components/Guards";
import { EmptyState, ErrorState } from "@/components/StateViews";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useProducts, useDebouncedValue, useDeleteProduct } from "@/hooks/useProducts";
import { useProductsRealtime } from "@/hooks/useProductsRealtime";
import { pickLocalized } from "@/lib/localized";

import en from "@/i18n/locales/en.json";
import ar from "@/i18n/locales/ar.json";
import { DEFAULT_LANG, type Lang } from "@/i18n/i18n";
import { useTranslation } from "react-i18next";
export const Route = createFileRoute("/admin/products/")({
  ssr: false,
  head: ({ match }) => {
    const lang = (match.context as { lang?: Lang }).lang ?? DEFAULT_LANG;
    const meta = (lang === "ar" ? ar : en).pageMeta.adminProductsIndex;
    return {
      meta: [
        { title: meta.title },
        { name: "description", content: meta.description },
        { property: "og:title", content: meta.title },
        { property: "og:description", content: meta.ogDescription },
        { name: "robots", content: "noindex" },
      ],
    };
  },
  component: () => (
    <AdminOnly>
      <AdminProductsPage />
    </AdminOnly>
  ),
});

const LIMIT = 10;

function AdminProductsPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as Lang;
  useProductsRealtime();
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);
  const search = useDebouncedValue(searchInput, 400);
  const { data, isLoading, isError, error, refetch } = useProducts({ page, limit: LIMIT, search });
  const deleteProduct = useDeleteProduct();

  const products = data?.items ?? [];
  const pagination = data?.pagination;

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteProduct.mutateAsync(pendingDelete.id);
      toast.success(t("adminProductsIndex.deletedSuccess", { name: pendingDelete.name }));
    } catch (deleteError) {
      toast.error(errorMessage(deleteError));
    } finally {
      setPendingDelete(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">{t("adminProductsIndex.manageProducts")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {pagination
              ? t("adminProductsIndex.countLabel", { count: pagination.totalCount })
              : t("adminProductsIndex.loading")}
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link to="/admin/products/new">
            <Plus className="size-4" />
            {t("adminProductsIndex.addProduct")}
          </Link>
        </Button>
      </div>

      <div className="relative mt-6">
        <Search className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchInput}
          onChange={(event) => {
            setSearchInput(event.target.value);
            setPage(1);
          }}
          placeholder={t("adminProductsIndex.searchPlaceholder")}
          className="pe-10"
        />
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-14 w-full" />
            ))}
          </div>
        ) : isError ? (
          <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
        ) : !products.length ? (
          <EmptyState
            variant={search ? "search" : "empty"}
            title={search ? t("adminProductsIndex.noResults") : t("adminProductsIndex.noProducts")}
            description={
              search ? t("adminProductsIndex.tryOtherSearch") : t("adminProductsIndex.startAdding")
            }
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">{t("adminProductsIndex.cover")}</TableHead>
                  <TableHead className="text-right">{t("adminProductsIndex.titleCol")}</TableHead>
                  <TableHead className="text-right">{t("adminProductsIndex.publisher")}</TableHead>
                  <TableHead className="text-right">{t("adminProductsIndex.category")}</TableHead>
                  <TableHead className="text-right">ISBN</TableHead>
                  <TableHead className="text-right">{t("adminProductsIndex.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => {
                  const productName = pickLocalized(product.name, lang);
                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="h-14 w-10 overflow-hidden rounded bg-secondary">
                          {product.avatar_url && (
                            <img
                              src={product.avatar_url}
                              alt={t("adminProductsIndex.coverAlt", { name: productName })}
                              loading="lazy"
                              className="size-full object-cover"
                            />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{productName}</TableCell>
                      <TableCell className="text-muted-foreground">{product.centre || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {t(`categories.${product.category}`, product.category)}
                        </Badge>
                      </TableCell>
                      <TableCell dir="ltr" className="text-muted-foreground">
                        {product.number || "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button asChild size="icon" variant="ghost" aria-label={t("common.edit")}>
                            <Link to="/admin/products/$id/edit" params={{ id: String(product.id) }}>
                              <Pencil className="size-4" />
                            </Link>
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label={t("common.delete")}
                            onClick={() =>
                              setPendingDelete({ id: String(product.id), name: productName })
                            }
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            disabled={!pagination.hasPreviousPage}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          >
            {t("adminProductsIndex.prev")}
          </Button>
          <span className="text-sm text-muted-foreground">
            {t("adminProductsIndex.pageOf", {
              current: pagination.currentPage,
              total: pagination.totalPages,
            })}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={!pagination.hasNextPage}
            onClick={() => setPage((prev) => prev + 1)}
          >
            {t("adminProductsIndex.next")}
          </Button>
        </div>
      )}

      <AlertDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("adminProductsIndex.confirmDelete")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("adminProductsIndex.deleteConfirmDesc", { name: pendingDelete?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmDelete()}>
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}