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
import { useBooks, useDebouncedValue, useDeleteBook } from "@/hooks/useBooks";
import { useBooksRealtime } from "@/hooks/useBooksRealtime";
import { pickLocalized } from "@/lib/localized";

import en from "@/i18n/locales/en.json";
import ar from "@/i18n/locales/ar.json";
import { DEFAULT_LANG, type Lang } from "@/i18n/i18n";
import { useTranslation } from "react-i18next";
export const Route = createFileRoute("/admin/books/")({
  ssr: false,
  head: ({ match }) => {
    const lang = (match.context as { lang?: Lang }).lang ?? DEFAULT_LANG;
    const meta = (lang === "ar" ? ar : en).pageMeta.adminBooksIndex;
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
      <AdminBooksPage />
    </AdminOnly>
  ),
});

const LIMIT = 10;

function AdminBooksPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as Lang;
  useBooksRealtime();
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);
  const search = useDebouncedValue(searchInput, 400);
  const { data, isLoading, isError, error, refetch } = useBooks({ page, limit: LIMIT, search });
  const deleteBook = useDeleteBook();

  const books = data?.items ?? [];
  const pagination = data?.pagination;

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteBook.mutateAsync(pendingDelete.id);
      toast.success(t("adminBooksIndex.deletedSuccess", { name: pendingDelete.name }));
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
          <h1 className="text-2xl font-bold md:text-3xl">{t("adminBooksIndex.manageBooks")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {pagination
              ? t("adminBooksIndex.countLabel", { count: pagination.totalCount })
              : t("adminBooksIndex.loading")}
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link to="/admin/books/new">
            <Plus className="size-4" />
            {t("adminBooksIndex.addBook")}
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
          placeholder={t("adminBooksIndex.searchPlaceholder")}
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
        ) : !books.length ? (
          <EmptyState
            variant={search ? "search" : "empty"}
            title={search ? t("adminBooksIndex.noResults") : t("adminBooksIndex.noBooks")}
            description={
              search ? t("adminBooksIndex.tryOtherSearch") : t("adminBooksIndex.startAdding")
            }
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">{t("adminBooksIndex.cover")}</TableHead>
                  <TableHead className="text-right">{t("adminBooksIndex.titleCol")}</TableHead>
                  <TableHead className="text-right">{t("adminBooksIndex.publisher")}</TableHead>
                  <TableHead className="text-right">{t("adminBooksIndex.category")}</TableHead>
                  <TableHead className="text-right">ISBN</TableHead>
                  <TableHead className="text-right">{t("adminBooksIndex.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {books.map((book) => {
                  const bookName = pickLocalized(book.name, lang);
                  return (
                    <TableRow key={book.id}>
                      <TableCell>
                        <div className="h-14 w-10 overflow-hidden rounded bg-secondary">
                          {book.avatar_url && (
                            <img
                              src={book.avatar_url}
                              alt={t("adminBooksIndex.coverAlt", { name: bookName })}
                              loading="lazy"
                              className="size-full object-cover"
                            />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{bookName}</TableCell>
                      <TableCell className="text-muted-foreground">{book.centre}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {t(`categories.${book.category}`, book.category)}
                        </Badge>
                      </TableCell>
                      <TableCell dir="ltr" className="text-muted-foreground">
                        {book.number}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button asChild size="icon" variant="ghost" aria-label={t("common.edit")}>
                            <Link to="/admin/books/$id/edit" params={{ id: String(book.id) }}>
                              <Pencil className="size-4" />
                            </Link>
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label={t("common.delete")}
                            onClick={() =>
                              setPendingDelete({ id: String(book.id), name: bookName })
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
            {t("adminBooksIndex.prev")}
          </Button>
          <span className="text-sm text-muted-foreground">
            {t("adminBooksIndex.pageOf", {
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
            {t("adminBooksIndex.next")}
          </Button>
        </div>
      )}

      <AlertDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
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