import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";

import { BOOK_CATEGORIES, type BookPayload } from "@/api/books.api";
import { ApiError } from "@/api/client";
import { bookSchema, type BookFormValues } from "@/schemas/book.schema";
import { CoverUpload } from "@/components/books/CoverUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface BookFormProps {
  defaultValues?: Partial<BookFormValues>;
  previewUrl?: string | null;
  submitLabel: string;
  onSubmit: (payload: BookPayload) => Promise<void>;
}

export function BookForm({ defaultValues, previewUrl, submitLabel, onSubmit }: BookFormProps) {
  const form = useForm<BookFormValues>({
    resolver: zodResolver(bookSchema),
    defaultValues: {
      name: "",
      number: "",
      email: "",
      adress: "",
      centre: "",
      grade: "",
      avatar_key: null,
      ...defaultValues,
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = form;

  const grade = watch("grade");
  const avatarKey = watch("avatar_key");

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(values as BookPayload);
    } catch (error) {
      if (error instanceof ApiError && error.fieldErrors) {
        for (const [field, message] of Object.entries(error.fieldErrors)) {
          setError(field as keyof BookFormValues, { message });
        }
      }
      throw error;
    }
  });

  return (
    <form
      onSubmit={(event) => {
        void submit(event).catch(() => undefined);
      }}
      className="grid gap-5 md:grid-cols-2"
      noValidate
    >
      <div className="space-y-2">
        <Label htmlFor="name">عنوان الكتاب</Label>
        <Input id="name" placeholder="مثال: ثلاثية غرناطة" {...register("name")} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="number">الرقم الدولي المعياري (ISBN)</Label>
        <Input id="number" placeholder="9789770000000" dir="ltr" {...register("number")} />
        {errors.number && <p className="text-sm text-destructive">{errors.number.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">إيميل الناشر</Label>
        <Input id="email" type="email" dir="ltr" placeholder="publisher@example.com" {...register("email")} />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="centre">دار النشر</Label>
        <Input id="centre" placeholder="مثال: دار الشروق" {...register("centre")} />
        {errors.centre && <p className="text-sm text-destructive">{errors.centre.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="grade">التصنيف</Label>
        <Select value={grade} onValueChange={(value) => setValue("grade", value)}>
          <SelectTrigger id="grade">
            <SelectValue placeholder="اختر التصنيف" />
          </SelectTrigger>
          <SelectContent>
            {BOOK_CATEGORIES.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.grade && <p className="text-sm text-destructive">{errors.grade.message}</p>}
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="adress">وصف الكتاب</Label>
        <Textarea id="adress" rows={4} placeholder="نبذة قصيرة عن الكتاب" {...register("adress")} />
        {errors.adress && <p className="text-sm text-destructive">{errors.adress.message}</p>}
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label>صورة الغلاف</Label>
        <CoverUpload
          value={avatarKey}
          previewUrl={previewUrl ?? null}
          onChange={(key) => setValue("avatar_key", key)}
        />
      </div>

      <div className="md:col-span-2">
        <Button type="submit" disabled={isSubmitting} className="gap-2">
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}