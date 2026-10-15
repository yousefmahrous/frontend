import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { errorMessage } from "@/api/client";
import type { Category } from "@/api/categories.api";
import { AdminOnly } from "@/components/Guards";
import { ErrorState } from "@/components/StateViews";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from "@/hooks/useCategories";

export const Route = createFileRoute("/admin/categories/")({
  ssr: false,
  component: () => (
    <AdminOnly>
      <AdminCategoriesPage />
    </AdminOnly>
  ),
});

function CategoryForm({
  editing,
  categories,
  onDone,
}: {
  editing: Category | null;
  categories: Category[];
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const create = useCreateCategory();
  const update = useUpdateCategory();
  const [slug, setSlug] = useState(editing?.slug ?? "");
  const [ar, setAr] = useState(editing?.name.ar ?? "");
  const [en, setEn] = useState(editing?.name.en ?? "");
  const [parentId, setParentId] = useState<string>(editing?.parent_id ? String(editing.parent_id) : "");

  // Lowercase latin letters, digits and dashes only; falls back to the English name when empty.
  const toSlug = (text: string) =>
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  function save() {
    const payload = {
      slug: toSlug(slug.trim() || en),
      name: { ar: ar.trim(), en: en.trim() },
      parent_id: parentId ? Number(parentId) : null,
    };
    const opts = {
      onSuccess: () => {
        toast.success(t("adminCategories.saved"));
        onDone();
      },
      onError: (e: unknown) => toast.error(errorMessage(e)),
    };
    if (editing) update.mutate({ id: editing.id, ...payload }, opts);
    else create.mutate(payload, opts);
  }

  const busy = create.isPending || update.isPending;

  return (
    <div className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2">
      <div className="space-y-1">
        <Label>{t("adminCategories.nameAr")}</Label>
        <Input value={ar} onChange={(e) => setAr(e.target.value)} dir="rtl" />
      </div>
      <div className="space-y-1">
        <Label>{t("adminCategories.nameEn")}</Label>
        <Input value={en} onChange={(e) => setEn(e.target.value)} dir="ltr" />
      </div>
      <div className="space-y-1">
        <Label>{t("adminCategories.slug")}</Label>
        <Input value={slug} onChange={(e) => setSlug(e.target.value)} dir="ltr" placeholder="e.g. t-shirts" />
      </div>
      <div className="space-y-1">
        <Label>{t("adminCategories.parent")}</Label>
        <select
          className="h-9 w-full rounded-md border bg-background px-3 text-sm"
          value={parentId}
          onChange={(e) => setParentId(e.target.value)}
        >
          <option value="">{t("adminCategories.noParent")}</option>
          {categories
            .filter((c) => c.id !== editing?.id)
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.name.en} / {c.name.ar}
              </option>
            ))}
        </select>
      </div>
      <div className="flex gap-2 sm:col-span-2">
        <Button onClick={save} disabled={busy}>
          {t("adminCategories.save")}
        </Button>
        {editing && (
          <Button variant="outline" onClick={onDone}>
            {t("adminCategories.cancel")}
          </Button>
        )}
      </div>
    </div>
  );
}

function AdminCategoriesPage() {
  const { t, i18n } = useTranslation();
  const { data, isLoading, isError, error, refetch } = useCategories();
  const remove = useDeleteCategory();
  const [editing, setEditing] = useState<Category | null>(null);
  // Changing the key remounts the form, so it resets after save/cancel/edit.
  const [formKey, setFormKey] = useState(0);
  const lang = i18n.language.startsWith("ar") ? "ar" : "en";

  const resetForm = () => {
    setEditing(null);
    setFormKey((k) => k + 1);
  };

  function onDelete(c: Category) {
    if (!window.confirm(t("adminCategories.confirmDelete"))) return;
    remove.mutate(c.id, {
      onSuccess: () => toast.success(t("adminCategories.deleted")),
      onError: (e) => toast.error(errorMessage(e)),
    });
  }

  if (isError) return <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4">
      <h1 className="text-2xl font-bold">{t("adminCategories.title")}</h1>

      <CategoryForm key={`${editing?.id ?? "new"}-${formKey}`} editing={editing} categories={data ?? []} onDone={resetForm} />

      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <ul className="divide-y rounded-lg border">
          {(data ?? []).map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-2 p-3">
              <div>
                <div className="font-medium">{c.name[lang]}</div>
                <div className="text-xs text-muted-foreground" dir="ltr">
                  {c.slug}
                  {c.parent_id ? ` · ↳ ${data?.find((p) => p.id === c.parent_id)?.name[lang] ?? c.parent_id}` : ""}
                </div>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => setEditing(c)} aria-label={t("adminCategories.edit")}>
                  <Pencil className="size-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => onDelete(c)} aria-label={t("adminCategories.delete")}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </li>
          ))}
          {data?.length === 0 && <li className="p-4 text-sm text-muted-foreground">{t("adminCategories.empty")}</li>}
        </ul>
      )}
    </div>
  );
}