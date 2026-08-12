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

export const Route = createFileRoute("/admin/books/$id/edit")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "تعديل كتاب | مكتبة القراء" },
      { name: "description", content: "عدّل بيانات الكتاب وصورة الغلاف في متجر مكتبة القراء." },
      { property: "og:title", content: "تعديل كتاب | مكتبة القراء" },
      { property: "og:description", content: "عدّل بيانات الكتاب في المتجر." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <AdminOnly>
      <EditBookPage />
    </AdminOnly>
  ),
});

function EditBookPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { data: book, isLoading, isError, error, refetch } = useBook(id);
  const updateBook = useUpdateBook(id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Button asChild variant="ghost" className="mb-6 gap-2">
        <Link to="/admin/books">
          <ArrowRight className="size-4" />
          رجوع للإدارة
        </Link>
      </Button>
      <h1 className="mb-6 text-2xl font-bold md:text-3xl">تعديل الكتاب</h1>

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
          submitLabel="حفظ التعديلات"
          previewUrl={book.avatar_url ?? null}
          defaultValues={{
            name: book.name,
            number: book.number,
            email: book.email,
            adress: book.adress,
            centre: book.centre,
            grade: book.grade,
            avatar_key: book.avatar_key ?? null,
          }}
          onSubmit={async (payload) => {
            try {
              await updateBook.mutateAsync(payload);
              toast.success("تم تحديث الكتاب");
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
