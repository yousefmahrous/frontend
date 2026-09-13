import { z } from "zod";
import type { TFunction } from "i18next";
import { BOOK_CATEGORIES } from "@/api/books.api";

const bilingualField = (t: TFunction, minAr: number, minEn: number, arKey: string, enKey: string) =>
  z.object({
    ar: z.string().trim().min(minAr, t(arKey, { count: minAr })),
    en: z.string().trim().min(minEn, t(enKey, { count: minEn })),
  });

export const createBookSchema = (t: TFunction) =>
  z.object({
    name: bilingualField(t, 3, 3, "validation.book.titleAr.min", "validation.book.titleEn.min"),
    number: z
      .string()
      .trim()
      .min(10, t("validation.book.isbn.min"))
      .regex(/^(?:\d[\d-]{8,}\d)$/, t("validation.book.isbn.format")),
    email: z.string().trim().email(t("validation.book.publisherEmail.invalid")),
    adress: bilingualField(
      t,
      5,
      5,
      "validation.book.descriptionAr.min",
      "validation.book.descriptionEn.min"
    ),
    centre: z.string().trim().min(2, t("validation.book.publisher.min", { count: 2 })),
    category: z.enum(BOOK_CATEGORIES as [string, ...string[]], {
      message: t("validation.book.category.required"),
    }),
    price: z
      .coerce.number({ message: t("validation.book.price.type") })
      .min(0, t("validation.book.price.negative")),
    stock: z.coerce
      .number({ message: t("validation.book.stock.type") })
      .int()
      .min(0, t("validation.book.stock.negative")),
    avatar_key: z.string().nullable(),
  });

export type BookFormValues = z.infer<ReturnType<typeof createBookSchema>>;

export const getBookFieldLabels = (t: TFunction): Record<keyof BookFormValues, string> => ({
  name: t("bookForm.titleLabel"),
  number: t("bookForm.isbn"),
  email: t("bookForm.publisherEmail"),
  adress: t("bookForm.description"),
  centre: t("bookForm.publisher"),
  category: t("bookForm.category"),
  price: t("bookForm.price"),
  stock: t("bookForm.quantity"),
  avatar_key: t("bookForm.coverImage"),
});