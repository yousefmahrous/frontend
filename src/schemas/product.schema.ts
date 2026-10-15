import { z } from "zod";
import type { TFunction } from "i18next";

const bilingualField = (t: TFunction, minAr: number, minEn: number, arKey: string, enKey: string) =>
  z.object({
    ar: z.string().trim().min(minAr, t(arKey, { count: minAr })),
    en: z.string().trim().min(minEn, t(enKey, { count: minEn })),
  });

// Product-only fields (ISBN, publisher, publisher email) may be left blank so that
// non-product products can be created. The rule only applies when a value is typed.
const optionalText = (rule: z.ZodType<string>) =>
  z
    .string()
    .trim()
    .superRefine((value, ctx) => {
      if (value === "") return;
      const result = rule.safeParse(value);
      if (result.success) return;
      for (const issue of result.error.issues) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: issue.message });
      }
    });

export const createProductSchema = (t: TFunction) =>
  z.object({
    name: bilingualField(t, 3, 3, "validation.product.titleAr.min", "validation.product.titleEn.min"),
    number: optionalText(
      z
        .string()
        .min(10, t("validation.product.isbn.min"))
        .regex(/^(?:\d[\d-]{8,}\d)$/, t("validation.product.isbn.format")),
    ),
    email: optionalText(z.string().email(t("validation.product.publisherEmail.invalid"))),
    adress: bilingualField(
      t,
      5,
      5,
      "validation.product.descriptionAr.min",
      "validation.product.descriptionEn.min"
    ),
    centre: optionalText(z.string().min(2, t("validation.product.publisher.min", { count: 2 }))),
    category: z.string().trim().min(1, t("validation.product.category.required")),
    price: z
      .coerce.number({ message: t("validation.product.price.type") })
      .min(0, t("validation.product.price.negative")),
    stock: z.coerce
      .number({ message: t("validation.product.stock.type") })
      .int()
      .min(0, t("validation.product.stock.negative")),
    avatar_key: z.string().nullable(),
  });

export type ProductFormValues = z.infer<ReturnType<typeof createProductSchema>>;

export const getProductFieldLabels = (t: TFunction): Record<keyof ProductFormValues, string> => ({
  name: t("productForm.titleLabel"),
  number: t("productForm.isbn"),
  email: t("productForm.publisherEmail"),
  adress: t("productForm.description"),
  centre: t("productForm.publisher"),
  category: t("productForm.category"),
  price: t("productForm.price"),
  stock: t("productForm.quantity"),
  avatar_key: t("productForm.coverImage"),
});