import { z } from "zod";
import type { TFunction } from "i18next";

export const createTicketSchema = (t: TFunction) =>
  z.object({
    subject: z
      .string()
      .trim()
      .min(3, t("validation.subject.min", { count: 3 }))
      .max(150, t("validation.message.max")),
    message: z
      .string()
      .trim()
      .min(5, t("validation.message.min", { count: 5 }))
      .max(2000, t("validation.message.max")),
});

export type CreateTicketValues = z.infer<ReturnType<typeof createTicketSchema>>;

export const createTicketMessageSchema = (t: TFunction) =>
  z.object({
    body: z
      .string()
      .trim()
      .min(1, t("validation.message.min", { count: 1 }))
      .max(2000, t("validation.message.max")),
});

export type TicketMessageValues = z.infer<ReturnType<typeof createTicketMessageSchema>>;