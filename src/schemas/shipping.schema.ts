import { z } from "zod";
import type { TFunction } from "i18next";

const ARABIC_INDIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const EG_MOBILE = /^01[0125]\d{8}$/;

export function normalizePhone(value: string): string {
  return value
    .replace(/[٠-٩]/g, (d) => String(ARABIC_INDIC_DIGITS.indexOf(d)))
    .replace(/[\s\-().]/g, "")
    .replace(/^(\+20|0020)/, "0");
}

export const createShippingSchema = (t: TFunction) =>
  z.object({
    name: z
      .string()
      .trim()
      .min(3, t("shipping.validation.nameMin"))
      .max(80, t("shipping.validation.nameMax")),
    phone: z
      .string()
      .transform(normalizePhone)
      .refine((v) => EG_MOBILE.test(v), t("shipping.validation.phoneInvalid")),
    address: z
      .string()
      .trim()
      .min(10, t("shipping.validation.addressMin"))
      .max(250, t("shipping.validation.addressMax")),
    city: z
      .string()
      .trim()
      .min(2, t("shipping.validation.cityMin"))
      .max(60, t("shipping.validation.cityMax")),
    notes: z.string().trim().max(300, t("shipping.validation.notesMax")),
  });

export type ShippingValues = z.infer<ReturnType<typeof createShippingSchema>>;