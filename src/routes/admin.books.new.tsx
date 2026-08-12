import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";

import { errorMessage } from "@/api/client";
import { BookForm } from "@/components/books/BookForm";
import { AdminOnly } from "@/components/Guards";
import { Button } from "@/components/ui/button";
import { useCreateBook } from "@/hooks/useBooks";

export const Route = createFileRoute("/admin/books/new")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "إضافة كتاب | مكتبة القراء" },
      { name: "description", content: "أضف كتابًا جديدًا لمتجر مكتبة القراء مع صورة غلاف." },
      { property: "og:title", content: "إضافة كتاب | مكتبة القراء" },
      { property: "og:description", content: "أضف كتابًا جديدًا للمتجر." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <AdminOnly>
      <NewBookPage />
    </AdminOnly>
  ),
});

function NewBookPage() {
  const navigate = useNavigate();
  const createBook = useCreateBook();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Button asChild variant="ghost" className="mb-6 gap-2">
        <Link to="/admin/books">
          <ArrowRight className="size-4" />
          رجوع للإدارة
        </Link>
      </Button>
      <h1 className="mb-6 text-2xl font-bold md:text-3xl">إضافة كتاب جديد</h1>

      <BookForm
        submitLabel="حفظ الكتاب"
        onSubmit={async (payload) => {
          try {
            await createBook.mutateAsync(payload);
            toast.success("تمت إضافة الكتاب");
            void navigate({ to: "/admin/books" });
          } catch (error) {
            toast.error(errorMessage(error));
            throw error;
          }
        }}
      />
    </div>
  );
}
