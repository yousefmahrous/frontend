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

import { useTranslation } from "react-i18next";
interface BookFormProps {
  defaultValues?: Partial<BookFormValues>;
  previewUrl?: string | null;
  submitLabel: string;
  onSubmit: (payload: BookPayload) => Promise<void>;
}

export function BookForm({ defaultValues, previewUrl, submitLabel, onSubmit }: BookFormProps) {
  const { t } = useTranslation();
  const form = useForm<BookFormValues>({
    resolver: zodResolver(bookSchema),
    defaultValues: {
      name: "",
      number: "",
      email: "",
      adress: "",
      centre: "",
      category: "",
      price: 0,
      stock: 0,
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

  const category = watch("category");
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
        <Label htmlFor="name">{t("bookForm.titleLabel")}</Label>
        <Input id="name" placeholder={t("bookForm.titlePlaceholder")} {...register("name")} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="number">{t("bookForm.isbn")}</Label>
        <Input id="number" placeholder="9789770000000" dir="ltr" {...register("number")} />
        {errors.number && <p className="text-sm text-destructive">{errors.number.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">{t("bookForm.publisherEmail")}</Label>
        <Input id="email" type="email" dir="ltr" placeholder="publisher@example.com" {...register("email")} />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="centre">{t("bookForm.publisher")}</Label>
        <Input id="centre" placeholder={t("bookForm.publisherPlaceholder")} {...register("centre")} />
        {errors.centre && <p className="text-sm text-destructive">{errors.centre.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">{t("bookForm.category")}</Label>
        <Select value={category} onValueChange={(value) => setValue("category", value)}>
          <SelectTrigger id="category">
            <SelectValue placeholder={t("bookForm.chooseCategory")} />
          </SelectTrigger>
          <SelectContent>
            {BOOK_CATEGORIES.map((category) => (
              <SelectItem key={category} value={category}>
                {t(`categories.${category}`, category)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="price">{t("bookForm.price")}</Label>
        <Input id="price" type="number" min={0} step="0.01" dir="ltr" {...register("price")} />
        {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
      </div>

      <div className="space-y-2">
      <Label htmlFor="stock">{t("bookForm.quantity")}</Label>
      <Input id="stock" type="number" min={0} dir="ltr" {...register("stock")} />
      {errors.stock && <p className="text-sm text-destructive">{errors.stock.message}</p>}
    </div>

      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="adress">{t("bookForm.description")}</Label>
        <Textarea id="adress" rows={4} placeholder={t("bookForm.shortDescription")} {...register("adress")} />
        {errors.adress && <p className="text-sm text-destructive">{errors.adress.message}</p>}
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label>{t("bookForm.coverImage")}</Label>
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