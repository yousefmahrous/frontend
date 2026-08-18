import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Sparkles, TrendingUp, Truck } from "lucide-react";
import { BookCard, BookGridSkeleton } from "@/components/books/BookCard";
import { EmptyState, ErrorState } from "@/components/StateViews";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { useBooks, usePopularBooks } from "@/hooks/useBooks";
import { useBooksRealtime } from "@/hooks/useBooksRealtime";
import { errorMessage } from "@/api/client";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "مكتبة القراء | أحدث الكتب العربية" },
      {
        name: "description",
        content: "اكتشف أحدث الإصدارات في مكتبة القراء: روايات، كتب علمية، تاريخية وكتب أطفال.",
      },
      { property: "og:title", content: "مكتبة القراء | أحدث الكتب العربية" },
      {
        property: "og:description",
        content: "اكتشف أحدث الإصدارات في مكتبة القراء واشترِ كتبك المفضلة.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { user } = useAuth();
  useBooksRealtime();
  const { data, isLoading, isError, error, refetch } = useBooks({ page: 1, limit: 8, search: "" });
  const {
    data: popularBooks,
    isLoading: isPopularLoading,
    isError: isPopularError,
    error: popularError,
    refetch: refetchPopular,
  } = usePopularBooks(8);

  return (
    <div>
      <section className="bg-hero-gradient text-primary-foreground">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 md:grid-cols-2 md:items-center md:py-24">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium">
              <Sparkles className="size-3.5" />
              إصدارات جديدة كل أسبوع
            </span>
            <h1 className="text-3xl font-extrabold leading-tight md:text-5xl">
              مكتبتك العربية، على بعد نقرة واحدة
            </h1>
            <p className="max-w-md text-sm leading-relaxed text-primary-foreground/80 md:text-base">
              آلاف العناوين في الروايات والعلوم والتاريخ وكتب الأطفال، مع تصنيفات واضحة وبحث سريع
              يوصلك لكتابك في ثواني.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" variant="secondary">
                <Link to="/books">تصفح الكتالوج</Link>
              </Button>
              {!user && (
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/40 bg-transparent text-primary-foreground hover:bg-white/10"
                >
                  <Link to="/signup">إنشاء حساب</Link>
                </Button>
              )}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { icon: BookOpen, title: "تصنيفات متنوعة", desc: "روايات، علمي، تاريخي، أطفال" },
              { icon: Truck, title: "توصيل سريع", desc: "لكل المحافظات خلال أيام" },
            ].map((item) => (
              <div key={item.title} className="rounded-xl bg-white/10 p-5 backdrop-blur">
                <item.icon className="size-6" />
                <h2 className="mt-3 font-bold">{item.title}</h2>
                <p className="mt-1 text-sm text-primary-foreground/75">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {Boolean(popularBooks?.length) && (
        <section className="mx-auto max-w-6xl px-4 pt-14">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="flex items-center gap-2 text-2xl font-bold">
                <TrendingUp className="size-6 text-accent" />
                الأكثر شعبية
              </h2>
              <p className="text-sm text-muted-foreground">
                أكتر الكتب اللي جذبت اهتمام القراء
              </p>
            </div>
          </div>

          {isPopularLoading ? (
            <BookGridSkeleton count={8} />
          ) : isPopularError ? (
            <ErrorState message={errorMessage(popularError)} onRetry={() => void refetchPopular()} />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {popularBooks?.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          )}
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">أحدث الكتب</h2>
            <p className="text-sm text-muted-foreground">أول ما يوصل المتجر يظهر هنا فورًا</p>
          </div>
          <Button asChild variant="ghost">
            <Link to="/books">شاهد الكل</Link>
          </Button>
        </div>

        {isLoading ? (
          <BookGridSkeleton count={8} />
        ) : isError ? (
          <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
        ) : !data?.items.length ? (
          <EmptyState
            title="مفيش كتب لسه"
            description="سجّل دخولك لتصفح الكتالوج، أو انتظر إضافة أول كتاب من إدارة المتجر."
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {data.items.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}