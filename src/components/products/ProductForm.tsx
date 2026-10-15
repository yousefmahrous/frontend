import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import type { ProductPayload, VariantPayload } from "@/api/products.api";
import { ApiError } from "@/api/client";
import { createProductSchema, type ProductFormValues } from "@/schemas/product.schema";
import { CoverUpload } from "@/components/products/CoverUpload";
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
import { useCategories } from "@/hooks/useCategories";

import { useTranslation } from "react-i18next";

const blankToNull = (value: string) => (value.trim() === "" ? null : value.trim());

interface VariantRow {
  sku: string;
  values: Record<string, string>;
  price: string;
  stock: string;
}

const emptyVariant = (): VariantRow => ({ sku: "", values: {}, price: "", stock: "" });
const parseOptionNames = (text: string) =>
  Array.from(new Set(text.split(",").map((n) => n.trim()).filter(Boolean)));

interface ProductFormProps {
  defaultValues?: Partial<ProductFormValues>;
  previewUrl?: string | null;
  submitLabel: string;
  /** Edit mode with several variants: price/stock are managed per variant instead. */
  hidePriceStock?: boolean;
  onSubmit: (payload: ProductPayload) => Promise<void>;
}

function OptionalHint({ label }: { label: string }) {
  return <span className="text-xs font-normal text-muted-foreground">({label})</span>;
}

export function ProductForm({ defaultValues, previewUrl, submitLabel, hidePriceStock = false, onSubmit }: ProductFormProps) {
  const { t, i18n } = useTranslation();
  const productSchema = useMemo(() => createProductSchema(t), [t, i18n.language]);
  const { data: categories = [] } = useCategories();
  const lang = i18n.language.startsWith("ar") ? "ar" : "en";
  // Variants can only be defined when creating (editing keeps the existing variants).
  const canHaveVariants = !defaultValues;
  const [hasVariants, setHasVariants] = useState(false);
  const [optionNamesText, setOptionNamesText] = useState("");
  const [variants, setVariants] = useState<VariantRow[]>([emptyVariant()]);
  const [variantError, setVariantError] = useState<string | null>(null);
  const optionNames = parseOptionNames(optionNamesText);

  const updateVariant = (index: number, patch: Partial<VariantRow>) =>
    setVariants((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  function buildVariants(): VariantPayload[] | null {
    if (optionNames.length === 0 && variants.length > 1) {
      setVariantError(t("productForm.variants.errorOptions"));
      return null;
    }
    const result: VariantPayload[] = [];
    const seen = new Set<string>();
    for (const row of variants) {
      const options: Record<string, string> = {};
      for (const name of optionNames) {
        const value = (row.values[name] ?? "").trim();
        if (!value) {
          setVariantError(t("productForm.variants.errorOptions"));
          return null;
        }
        options[name] = value;
      }
      const price = Number(row.price);
      const stock = Number(row.stock);
      if (row.price.trim() === "" || !Number.isFinite(price) || price < 0 || row.stock.trim() === "" || !Number.isInteger(stock) || stock < 0) {
        setVariantError(t("productForm.variants.errorNumbers"));
        return null;
      }
      const key = JSON.stringify(Object.entries(options).sort(([a], [b]) => a.localeCompare(b)));
      if (seen.has(key)) {
        setVariantError(t("productForm.variants.errorDuplicate"));
        return null;
      }
      seen.add(key);
      result.push({ sku: blankToNull(row.sku), options, price, stock });
    }
    setVariantError(null);
    return result;
  }
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: { ar: "", en: "" },
      number: "",
      email: "",
      adress: { ar: "", en: "" },
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
    let variantPayload: VariantPayload[] | undefined;
    if (canHaveVariants && hasVariants) {
      const built = buildVariants();
      if (!built) return;
      variantPayload = built;
    }
    const firstVariant = variantPayload?.[0];
    try {
      await onSubmit({
        ...values,
        ...(variantPayload && firstVariant
          ? { variants: variantPayload, price: firstVariant.price, stock: firstVariant.stock }
          : {}),
        number: blankToNull(values.number),
        email: blankToNull(values.email),
        centre: blankToNull(values.centre),
      } as ProductPayload);
    } catch (error) {
      if (error instanceof ApiError && error.fieldErrors) {
        for (const [field, message] of Object.entries(error.fieldErrors)) {
          setError(field as keyof ProductFormValues, { message });
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
        <Label htmlFor="name.ar">{t("productForm.titleLabelAr")}</Label>
        <Input
          id="name.ar"
          placeholder={t("productForm.titlePlaceholderAr")}
          {...register("name.ar")}
        />
        {errors.name?.ar && <p className="text-sm text-destructive">{errors.name.ar.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="name.en">{t("productForm.titleLabelEn")}</Label>
        <Input
          id="name.en"
          dir="ltr"
          placeholder={t("productForm.titlePlaceholderEn")}
          {...register("name.en")}
        />
        {errors.name?.en && <p className="text-sm text-destructive">{errors.name.en.message}</p>}
      </div>
      {errors.name?.message && (
        <p className="text-sm text-destructive md:col-span-2">{errors.name.message}</p>
      )}

      <div className="space-y-2">
        <Label htmlFor="number">
          {t("productForm.isbn")} <OptionalHint label={t("productForm.optional")} />
        </Label>
        <Input id="number" placeholder="9789770000000" dir="ltr" {...register("number")} />
        {errors.number && <p className="text-sm text-destructive">{errors.number.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">
          {t("productForm.publisherEmail")} <OptionalHint label={t("productForm.optional")} />
        </Label>
        <Input
          id="email"
          type="email"
          dir="ltr"
          placeholder="publisher@example.com"
          {...register("email")}
        />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="centre">
          {t("productForm.publisher")} <OptionalHint label={t("productForm.optional")} />
        </Label>
        <Input
          id="centre"
          placeholder={t("productForm.publisherPlaceholder")}
          {...register("centre")}
        />
        {errors.centre && <p className="text-sm text-destructive">{errors.centre.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">{t("productForm.category")}</Label>
        <Select value={category} onValueChange={(value) => setValue("category", value)}>
          <SelectTrigger id="category">
            <SelectValue placeholder={t("productForm.chooseCategory")} />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.slug}>
                {c.name[lang]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
      </div>

      {!(canHaveVariants && hasVariants) && !hidePriceStock && (
        <>
          <div className="space-y-2">
            <Label htmlFor="price">{t("productForm.price")}</Label>
            <Input id="price" type="number" min={0} step="0.01" dir="ltr" {...register("price")} />
            {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="stock">{t("productForm.quantity")}</Label>
            <Input id="stock" type="number" min={0} dir="ltr" {...register("stock")} />
            {errors.stock && <p className="text-sm text-destructive">{errors.stock.message}</p>}
          </div>
        </>
      )}

      {canHaveVariants && (
        <div className="space-y-3 md:col-span-2">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={hasVariants}
              onChange={(e) => setHasVariants(e.target.checked)}
            />
            {t("productForm.variants.enable")}
          </label>

          {hasVariants && (
            <div className="space-y-4 rounded-lg border p-4">
              <div className="space-y-2">
                <Label htmlFor="optionNames">{t("productForm.variants.optionNames")}</Label>
                <Input
                  id="optionNames"
                  value={optionNamesText}
                  onChange={(e) => setOptionNamesText(e.target.value)}
                  placeholder={t("productForm.variants.optionNamesPlaceholder")}
                />
              </div>

              {variants.map((row, index) => (
                <div key={index} className="grid gap-2 rounded-md border p-3 sm:grid-cols-2 lg:grid-cols-4">
                  {optionNames.map((name) => (
                    <div key={name} className="space-y-1">
                      <Label className="text-xs">{name}</Label>
                      <Input
                        value={row.values[name] ?? ""}
                        onChange={(e) => updateVariant(index, { values: { ...row.values, [name]: e.target.value } })}
                      />
                    </div>
                  ))}
                  <div className="space-y-1">
                    <Label className="text-xs">{t("productForm.variants.sku")}</Label>
                    <Input dir="ltr" value={row.sku} onChange={(e) => updateVariant(index, { sku: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t("productForm.variants.price")}</Label>
                    <Input type="number" min={0} step="0.01" dir="ltr" value={row.price} onChange={(e) => updateVariant(index, { price: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t("productForm.variants.stock")}</Label>
                    <Input type="number" min={0} dir="ltr" value={row.stock} onChange={(e) => updateVariant(index, { stock: e.target.value })} />
                  </div>
                  {variants.length > 1 && (
                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={t("productForm.variants.remove")}
                        onClick={() => setVariants((rows) => rows.filter((_, i) => i !== index))}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}

              {variantError && <p className="text-sm text-destructive">{variantError}</p>}

              <Button type="button" variant="outline" className="gap-2" onClick={() => setVariants((rows) => [...rows, emptyVariant()])}>
                <Plus className="size-4" />
                {t("productForm.variants.add")}
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="adress.ar">{t("productForm.descriptionLabelAr")}</Label>
        <Textarea
          id="adress.ar"
          rows={4}
          placeholder={t("productForm.shortDescriptionAr")}
          {...register("adress.ar")}
        />
        {errors.adress?.ar && (
          <p className="text-sm text-destructive">{errors.adress.ar.message}</p>
        )}
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="adress.en">{t("productForm.descriptionLabelEn")}</Label>
        <Textarea
          id="adress.en"
          rows={4}
          dir="ltr"
          placeholder={t("productForm.shortDescriptionEn")}
          {...register("adress.en")}
        />
        {errors.adress?.en && (
          <p className="text-sm text-destructive">{errors.adress.en.message}</p>
        )}
      </div>
      {errors.adress?.message && (
        <p className="text-sm text-destructive md:col-span-2">{errors.adress.message}</p>
      )}

      <div className="space-y-2 md:col-span-2">
        <Label>{t("productForm.coverImage")}</Label>
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