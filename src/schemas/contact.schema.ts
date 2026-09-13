import { z } from "zod";
import type { TFunction } from "i18next";

export const createContactSchema = (t: TFunction) =>
  z.object({
    name: z.string().trim().min(3, t("validation.name.min", { count: 3 })),
    email: z.string().trim().email(t("validation.email.invalid")),
    subject: z.string().trim().min(3, t("validation.subject.min", { count: 3 })),
    message: z
      .string()
      .trim()
      .min(10, t("validation.message.min", { count: 10 }))
      .max(2000, t("validation.message.max")),
  });

export type ContactValues = z.infer<ReturnType<typeof createContactSchema>>;