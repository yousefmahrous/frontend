import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import { errorMessage } from "@/api/client";
import { BookForm } from "@/components/books/BookForm";
import { VendorOnly } from "@/components/Guards";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/StateViews";
import { useMyProduct, useUpdateMyProduct } from "@/hooks/useVendor";

export const Route = createFileRoute("/vendor/products/$id/edit")({
  ssr: false,
  component: () => (
    <VendorOnly>
      <EditProductPage />
    </VendorOnly>
  ),
});

function EditProductPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams({ from: "/vendor/products/$id/edit" });
  const { data: product, isLoading, isError, error, refetch } = useMyProduct(id);
  const updateProduct = useUpdateMyProduct(id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Button asChild variant="ghost" className="mb-6 gap-2">
        <Link to="/vendor/products">
          <ArrowRight className="size-4" />
          {t("vendorProducts.backToProducts")}
        </Link>
      </Button>
      <h1 className="mb-6 text-2xl font-bold md:text-3xl">{t("vendorProducts.editTitle")}</h1>

      {isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : isError || !product ? (
        <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
      ) : (
        <BookForm
          defaultValues={{
            name: product.name,
            number: product.number,
            email: product.email,
            adress: product.adress,
            centre: product.centre,
            category: product.category,
            price: product.price,
            stock: product.stock,
            avatar_key: product.avatar_key ?? null,
          }}
          previewUrl={product.avatar_url}
          submitLabel={t("common.save")}
          onSubmit={async (payload) => {
            try {
              await updateProduct.mutateAsync(payload);
              toast.success(t("adminBooksEdit.updatedSuccess", t("common.success")) as string);
              void navigate({ to: "/vendor/products" });
            } catch (error) {
              toast.error(errorMessage(error));
              throw error;
            }
          }}
        />
      )}
    </div>
  );
}