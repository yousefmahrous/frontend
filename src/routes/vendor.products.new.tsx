import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import { errorMessage } from "@/api/client";
import { BookForm } from "@/components/books/BookForm";
import { VendorOnly } from "@/components/Guards";
import { Button } from "@/components/ui/button";
import { useCreateMyProduct } from "@/hooks/useVendor";

export const Route = createFileRoute("/vendor/products/new")({
  ssr: false,
  component: () => (
    <VendorOnly>
      <NewProductPage />
    </VendorOnly>
  ),
});

function NewProductPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const createProduct = useCreateMyProduct();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Button asChild variant="ghost" className="mb-6 gap-2">
        <Link to="/vendor/products">
          <ArrowRight className="size-4" />
          {t("vendorProducts.backToProducts")}
        </Link>
      </Button>
      <h1 className="mb-6 text-2xl font-bold md:text-3xl">{t("vendorProducts.newTitle")}</h1>

      <BookForm
        submitLabel={t("adminBooksNew.saveLabel")}
        onSubmit={async (payload) => {
          try {
            await createProduct.mutateAsync(payload);
            toast.success(t("adminBooksNew.addedSuccess"));
            void navigate({ to: "/vendor/products" });
          } catch (error) {
            toast.error(errorMessage(error));
            throw error;
          }
        }}
      />
    </div>
  );
}