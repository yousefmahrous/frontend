import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";

import { errorMessage } from "@/api/client";
import { ProductForm } from "@/components/products/ProductForm";
import { VariantManager } from "@/components/products/VariantManager";
import { AdminOnly } from "@/components/Guards";
import { ErrorState } from "@/components/StateViews";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useProduct, useUpdateProduct } from "@/hooks/useProducts";

import en from "@/i18n/locales/en.json";
import ar from "@/i18n/locales/ar.json";
import { DEFAULT_LANG, type Lang } from "@/i18n/i18n";
import { useTranslation } from "react-i18next";
export const Route = createFileRoute("/admin/products/$id/edit")({
  ssr: false,
  head: ({ match }) => {
    const lang = (match.context as { lang?: Lang }).lang ?? DEFAULT_LANG;
    const meta = (lang === "ar" ? ar : en).pageMeta.adminProductsEdit;
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
      <EditProductPage />
    </AdminOnly>
  ),
});

function EditProductPage() {
  const { t } = useTranslation();
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { data: product, isLoading, isError, error, refetch } = useProduct(id);
  const updateProduct = useUpdateProduct(id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Button asChild variant="ghost" className="mb-6 gap-2">
        <Link to="/admin/products">
          <ArrowRight className="size-4" />
          {t("adminProductsNew.backToAdmin")}
        </Link>
      </Button>
      <h1 className="mb-6 text-2xl font-bold md:text-3xl">{t("adminProductsEdit.title")}</h1>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : isError || !product ? (
        <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
      ) : (
        <>
        <ProductForm
          hidePriceStock={(product.variants?.length ?? 0) > 1}
          submitLabel={t("adminProductsEdit.saveLabel")}
          previewUrl={product.avatar_url ?? null}
          defaultValues={{
            name: product.name,
            number: product.number ?? "",
            email: product.email ?? "",
            adress: product.adress,
            centre: product.centre ?? "",
            category: product.category,
            price: product.price / 100,
            stock: product.stock,
            avatar_key: product.avatar_key ?? null,
          }}
          onSubmit={async (payload) => {
            try {
              await updateProduct.mutateAsync(payload);
              toast.success(t("adminProductsEdit.updatedSuccess"));
              void navigate({ to: "/admin/products" });
            } catch (updateError) {
              toast.error(errorMessage(updateError));
              throw updateError;
            }
          }}
        />
        <div className="mt-10 border-t pt-8">
          <VariantManager scope="admin" productId={id} variants={product.variants ?? []} />
        </div>
        </>
      )}
    </div>
  );
}