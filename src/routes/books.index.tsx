import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { errorMessage } from "@/api/client";
import { BOOK_CATEGORIES } from "@/api/books.api";
import { BookCard, BookGridSkeleton } from "@/components/books/BookCard";
import { EmptyState, ErrorState } from "@/components/StateViews";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBooks, useDebouncedValue } from "@/hooks/useBooks";
import { useBooksRealtime } from "@/hooks/useBooksRealtime";

export const Route = createFileRoute("/books/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "كتالوج الكتب | مكتبة القراء" },
      {
        name: "description",
        content: "تصفح كل كتب المتجر مع بحث فوري وفلترة حسب التصنيف: روايات، علمي، تاريخي، أطفال.",
      },
      { property: "og:title", content: "كتالوج الكتب | مكتبة القراء" },
      { property: "og:description", content: "تصفح كل كتب المتجر مع بحث وفلترة حسب التصنيف." },
    ],
  }),
  component: CatalogPage,
});

const LIMIT = 12;

function CatalogPage() {
  useBooksRealtime();
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState<string | null>(null);
  const search = useDebouncedValue(searchInput, 400);

  const { data, isLoading, isFetching, isError, error, refetch } = useBooks({
    page,
    limit: LIMIT,
    search,
  });

  const books = useMemo(() => {
    const items = data?.items ?? [];
    return category ? items.filter((book) => book.category === category) : items;
  }, [data?.items, category]);

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
      <h1 className="text-2xl font-bold md:text-3xl">كتالوج الكتب</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {pagination ? `${pagination.totalCount} كتاب متاح` : "جاري تحميل الكتب…"}
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
            placeholder="ابحث بعنوان الكتاب أو دار النشر…"
            className="pe-10"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={category === null ? "default" : "secondary"}
            size="sm"
            onClick={() => setCategory(null)}
          >
            كل التصنيفات
          </Button>
          {BOOK_CATEGORIES.map((item) => (
            <Button
              key={item}
              variant={category === item ? "default" : "secondary"}
              size="sm"
              onClick={() => setCategory(item)}
            >
              {item}
            </Button>
          ))}
        </div>
      </div>

      <div className="mt-8">
        {isLoading ? (
          <BookGridSkeleton count={LIMIT} />
        ) : isError ? (
          <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
        ) : !books.length ? (
          <EmptyState
            variant={search || category ? "search" : "empty"}
            title={search || category ? "مفيش نتائج مطابقة" : "مفيش كتب لسه"}
            description={
              search || category
                ? "جرّب كلمات بحث تانية أو شيل الفلتر."
                : "أول ما تتضاف كتب هتظهر هنا لحظيًا."
            }
          />
        ) : (
          <div
            className={`grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 ${
              isFetching ? "opacity-70 transition-opacity" : ""
            }`}
          >
            {books.map((book) => (
              <BookCard key={book.id} book={book} />
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
            السابق
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
            التالي
            <ChevronLeft className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}