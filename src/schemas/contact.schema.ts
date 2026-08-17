import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().trim().min(3, "الاسم لازم 3 أحرف على الأقل"),
  email: z.string().trim().email("الإيميل غير صحيح"),
  subject: z.string().trim().min(3, "الموضوع لازم 3 أحرف على الأقل"),
  message: z.string().trim().min(10, "الرسالة لازم تكون 10 أحرف على الأقل").max(2000, "الرسالة طويلة جدًا"),
});

export type ContactValues = z.infer<typeof contactSchema>;