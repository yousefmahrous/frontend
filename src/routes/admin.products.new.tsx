import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";

import { errorMessage } from "@/api/client";
import { ProductForm } from "@/components/products/ProductForm";
import { AdminOnly } from "@/components/Guards";
import { Button } from "@/components/ui/button";
import { useCreateProduct } from "@/hooks/useProducts";

import en from "@/i18n/locales/en.json";
import ar from "@/i18n/locales/ar.json";
import { DEFAULT_LANG, type Lang } from "@/i18n/i18n";
import { useTranslation } from "react-i18next";
export const Route = createFileRoute("/admin/products/new")({
  ssr: false,
  head: ({ match }) => {
    const lang = (match.context as { lang?: Lang }).lang ?? DEFAULT_LANG;
    const meta = (lang === "ar" ? ar : en).pageMeta.adminProductsNew;
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
      <NewProductPage />
    </AdminOnly>
  ),
});

function NewProductPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const createProduct = useCreateProduct();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Button asChild variant="ghost" className="mb-6 gap-2">
        <Link to="/admin/products">
          <ArrowRight className="size-4" />
          {t("adminProductsNew.backToAdmin")}
        </Link>
      </Button>
      <h1 className="mb-6 text-2xl font-bold md:text-3xl">{t("adminProductsNew.title")}</h1>

      <ProductForm
        submitLabel={t("adminProductsNew.saveLabel")}
        onSubmit={async (payload) => {
          try {
            await createProduct.mutateAsync(payload);
            toast.success(t("adminProductsNew.addedSuccess"));
            void navigate({ to: "/admin/products" });
          } catch (error) {
            toast.error(errorMessage(error));
            throw error;
          }
        }}
      />
    </div>
  );
}
