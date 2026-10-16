import { useTranslation } from "react-i18next";

import { useCategories } from "@/hooks/useCategories";

export function CategoryName({ slug }: { slug: string }) {
  const { t, i18n } = useTranslation();
  const { data } = useCategories();
  const lang = i18n.language.startsWith("ar") ? "ar" : "en";
  const found = data?.find((c) => c.slug === slug);
  return <>{found ? found.name[lang] : t(`categories.${slug}`, slug)}</>;
}