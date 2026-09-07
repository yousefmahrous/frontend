import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";

import { errorMessage } from "@/api/client";
import { BookForm } from "@/components/books/BookForm";
import { AdminOnly } from "@/components/Guards";
import { ErrorState } from "@/components/StateViews";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useBook, useUpdateBook } from "@/hooks/useBooks";

import en from "@/i18n/locales/en.json";
import ar from "@/i18n/locales/ar.json";
import { DEFAULT_LANG, type Lang } from "@/i18n/i18n";
import { useTranslation } from "react-i18next";
export const Route = createFileRoute("/admin/books/$id/edit")({
  ssr: false,
  head: ({ match }) => {
    const lang = (match.context as { lang?: Lang }).lang ?? DEFAULT_LANG;
    const meta = (lang === "ar" ? ar : en).pageMeta.adminBooksEdit;
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
      <EditBookPage />
    </AdminOnly>
  ),
});

function EditBookPage() {
  const { t } = useTranslation();
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { data: book, isLoading, isError, error, refetch } = useBook(id);
  const updateBook = useUpdateBook(id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Button asChild variant="ghost" className="mb-6 gap-2">
        <Link to="/admin/books">
          <ArrowRight className="size-4" />
          {t("adminBooksNew.backToAdmin")}
        </Link>
      </Button>
      <h1 className="mb-6 text-2xl font-bold md:text-3xl">{t("adminBooksEdit.title")}</h1>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : isError || !book ? (
        <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
      ) : (
        <BookForm
          submitLabel={t("adminBooksEdit.saveLabel")}
          previewUrl={book.avatar_url ?? null}
          defaultValues={{
            name: book.name,
            number: book.number,
            email: book.email,
            adress: book.adress,
            centre: book.centre,
            category: book.category,
            price: book.price / 100,
            stock: book.stock,
            avatar_key: book.avatar_key ?? null,
          }}
          onSubmit={async (payload) => {
            try {
              await updateBook.mutateAsync(payload);
              toast.success(t("adminBooksEdit.updatedSuccess"));
              void navigate({ to: "/admin/books" });
            } catch (updateError) {
              toast.error(errorMessage(updateError));
              throw updateError;
            }
          }}
        />
      )}
    </div>
  );
}