import { createFileRoute, Link } from "@tanstack/react-router";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import { errorMessage } from "@/api/client";
import { VendorOnly } from "@/components/Guards";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMyProducts, useDeleteMyProduct } from "@/hooks/useVendor";
import { pickLocalized } from "@/lib/localized";
import type { Lang } from "@/i18n/i18n";

export const Route = createFileRoute("/vendor/products/")({
  ssr: false,
  component: () => (
    <VendorOnly>
      <VendorProductsPage />
    </VendorOnly>
  ),
});

const LIMIT = 10;

function VendorProductsPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as Lang;
  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);
  const { data, isLoading, isError, error, refetch } = useMyProducts({ page, limit: LIMIT });
  const deleteProduct = useDeleteMyProduct();

  const products = data?.items ?? [];
  const pagination = data?.pagination;

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteProduct.mutateAsync(pendingDelete.id);
      toast.success(t("vendorProducts.deletedSuccess", { name: pendingDelete.name }));
    } catch (deleteError) {
      toast.error(errorMessage(deleteError));
    } finally {
      setPendingDelete(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold md:text-3xl">{t("vendorProducts.manage")}</h1>
        <Button asChild className="gap-2">
          <Link to="/vendor/products/new">
            <Plus className="size-4" />
            {t("vendorProducts.addProduct")}
          </Link>
        </Button>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-14 w-full" />
            ))}
          </div>
        ) : isError ? (
          <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
        ) : !products.length ? (
          <EmptyState
            title={t("vendorProducts.noProducts")}
            description={t("vendorProducts.startAdding")}
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">{t("adminBooksIndex.titleCol")}</TableHead>
                  <TableHead className="text-right">{t("adminBooksIndex.category")}</TableHead>
                  <TableHead className="text-right">{t("bookForm.price")}</TableHead>
                  <TableHead className="text-right">{t("bookForm.quantity")}</TableHead>
                  <TableHead className="text-right">{t("adminBooksIndex.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => {
                  const name = pickLocalized(product.name, lang);
                  return (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {t(`categories.${product.category}`, product.category)}
                        </Badge>
                      </TableCell>
                      <TableCell dir="ltr">{product.price}</TableCell>
                      <TableCell dir="ltr">{product.stock}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button asChild size="icon" variant="ghost" aria-label={t("common.edit")}>
                            <Link to="/vendor/products/$id/edit" params={{ id: String(product.id) }}>
                              <Pencil className="size-4" />
                            </Link>
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label={t("common.delete")}
                            onClick={() => setPendingDelete({ id: String(product.id), name })}
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
            {t("adminBooksIndex.prev")}
          </Button>
          <span className="text-sm text-muted-foreground">
            {t("adminBooksIndex.pageOf", { current: pagination.currentPage, total: pagination.totalPages })}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={!pagination.hasNextPage}
            onClick={() => setPage((prev) => prev + 1)}
          >
            {t("adminBooksIndex.next")}
          </Button>
        </div>
      )}

      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("adminBooksIndex.confirmDelete")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("adminBooksIndex.deleteConfirmDesc", { name: pendingDelete?.name })}
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