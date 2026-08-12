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

export const Route = createFileRoute("/admin/books/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "إدارة الكتب | مكتبة القراء" },
      { name: "description", content: "لوحة إدارة الكتب: إضافة وتعديل وحذف كتب المتجر." },
      { property: "og:title", content: "إدارة الكتب | مكتبة القراء" },
      { property: "og:description", content: "لوحة إدارة كتب المتجر." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <AdminOnly>
      <AdminBooksPage />
    </AdminOnly>
  ),
});

const LIMIT = 10;

function AdminBooksPage() {
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
      toast.success(`تم حذف "${pendingDelete.name}"`);
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
          <h1 className="text-2xl font-bold md:text-3xl">إدارة الكتب</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {pagination ? `${pagination.totalCount} كتاب` : "جاري التحميل…"}
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link to="/admin/books/new">
            <Plus className="size-4" />
            إضافة كتاب
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
          placeholder="ابحث عن كتاب…"
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
            title={search ? "مفيش نتائج" : "مفيش كتب"}
            description={search ? "جرّب كلمة بحث تانية." : "ابدأ بإضافة أول كتاب للمتجر."}
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الغلاف</TableHead>
                  <TableHead className="text-right">العنوان</TableHead>
                  <TableHead className="text-right">دار النشر</TableHead>
                  <TableHead className="text-right">التصنيف</TableHead>
                  <TableHead className="text-right">ISBN</TableHead>
                  <TableHead className="text-right">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {books.map((book) => (
                  <TableRow key={book.id}>
                    <TableCell>
                      <div className="h-14 w-10 overflow-hidden rounded bg-secondary">
                        {book.avatar_url && (
                          <img
                            src={book.avatar_url}
                            alt={`غلاف ${book.name}`}
                            loading="lazy"
                            className="size-full object-cover"
                          />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{book.name}</TableCell>
                    <TableCell className="text-muted-foreground">{book.centre}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{book.grade}</Badge>
                    </TableCell>
                    <TableCell dir="ltr" className="text-muted-foreground">
                      {book.number}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button asChild size="icon" variant="ghost" aria-label="تعديل">
                          <Link to="/admin/books/$id/edit" params={{ id: String(book.id) }}>
                            <Pencil className="size-4" />
                          </Link>
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="حذف"
                          onClick={() =>
                            setPendingDelete({ id: String(book.id), name: book.name })
                          }
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
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
            السابق
          </Button>
          <span className="text-sm text-muted-foreground">
            صفحة {pagination.currentPage} من {pagination.totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={!pagination.hasNextPage}
            onClick={() => setPage((prev) => prev + 1)}
          >
            التالي
          </Button>
        </div>
      )}

      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل تريد حذف "{pendingDelete?.name}"؟ لا يمكن الرجوع بعد الحذف.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmDelete()}>حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
