import { z } from "zod";
import { BOOK_CATEGORIES } from "@/api/books.api";


export const bookSchema = z.object({
  name: z.string().trim().min(3, "عنوان الكتاب لازم 3 أحرف على الأقل"),
  number: z
    .string()
    .trim()
    .min(10, "أدخل رقم ISBN صحيح (10 أو 13 رقم)")
    .regex(/^(?:\d[\d-]{8,}\d)$/, "صيغة ISBN غير صحيحة"),
  email: z.string().trim().email("إيميل الناشر غير صحيح"),
  adress: z.string().trim().min(5, "وصف الكتاب لازم 5 أحرف على الأقل"),
  centre: z.string().trim().min(2, "دار النشر لازم حرفين على الأقل"),
  category: z.enum(BOOK_CATEGORIES as [string, ...string[]], { message: "اختر تصنيف الكتاب" }),
  stock: z.coerce.number({ message: "الكمية لازم تكون رقم" }).int().min(0, "الكمية متقدرش تكون سالبة"),
  avatar_key: z.string().nullable(),
});

export type BookFormValues = z.infer<typeof bookSchema>;

export const bookFieldLabels: Record<keyof BookFormValues, string> = {
  name: "عنوان الكتاب",
  number: "الرقم الدولي المعياري (ISBN)",
  email: "إيميل الناشر",
  adress: "وصف الكتاب",
  centre: "دار النشر",
  category: "التصنيف",
  stock: "الكمية المتاحة",
  avatar_key: "صورة الغلاف",
};