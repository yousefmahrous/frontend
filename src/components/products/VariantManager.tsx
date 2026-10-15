import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { errorMessage } from "@/api/client";
import type { ProductVariant, VariantPayload } from "@/api/products.api";
import type { VariantScope } from "@/api/variants.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useVariantActions } from "@/hooks/useVariants";

interface Pair {
  name: string;
  value: string;
}

function VariantEditor({
  initial,
  optionNameHints,
  busy,
  onSave,
  onCancel,
}: {
  initial: ProductVariant | null;
  optionNameHints: string[];
  busy: boolean;
  onSave: (payload: VariantPayload) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const [pairs, setPairs] = useState<Pair[]>(
    initial
      ? Object.entries(initial.options).map(([name, value]) => ({ name, value }))
      : optionNameHints.map((name) => ({ name, value: "" })),
  );
  const [sku, setSku] = useState(initial?.sku ?? "");
  const [price, setPrice] = useState(initial ? String(initial.price / 100) : "");
  const [stock, setStock] = useState(initial ? String(initial.stock) : "");
  const [error, setError] = useState<string | null>(null);

  const updatePair = (index: number, patch: Partial<Pair>) =>
    setPairs((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  function save() {
    const options: Record<string, string> = {};
    for (const pair of pairs) {
      const name = pair.name.trim();
      const value = pair.value.trim();
      if (!name && !value) continue;
      if (!name || !value) return setError(t("productForm.variants.errorOptions"));
      options[name] = value;
    }
    const priceNumber = Number(price);
    const stockNumber = Number(stock);
    if (
      price.trim() === "" ||
      !Number.isFinite(priceNumber) ||
      priceNumber < 0 ||
      stock.trim() === "" ||
      !Number.isInteger(stockNumber) ||
      stockNumber < 0
    ) {
      return setError(t("productForm.variants.errorNumbers"));
    }
    setError(null);
    onSave({ sku: sku.trim() === "" ? null : sku.trim(), options, price: priceNumber, stock: stockNumber });
  }

  return (
    <div className="space-y-3 rounded-lg border p-3">
      {pairs.map((pair, index) => (
        <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-2">
          <div className="space-y-1">
            <Label className="text-xs">{t("variantManager.optionName")}</Label>
            <Input value={pair.name} onChange={(e) => updatePair(index, { name: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{t("variantManager.optionValue")}</Label>
            <Input value={pair.value} onChange={(e) => updatePair(index, { value: e.target.value })} />
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t("productForm.variants.remove")}
              onClick={() => setPairs((rows) => rows.filter((_, i) => i !== index))}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => setPairs((rows) => [...rows, { name: "", value: "" }])}
      >
        <Plus className="size-4" />
        {t("variantManager.addOption")}
      </Button>

      <div className="grid gap-2 sm:grid-cols-3">
        <div className="space-y-1">
          <Label className="text-xs">{t("productForm.variants.sku")}</Label>
          <Input dir="ltr" value={sku} onChange={(e) => setSku(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{t("productForm.variants.price")}</Label>
          <Input type="number" min={0} step="0.01" dir="ltr" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{t("productForm.variants.stock")}</Label>
          <Input type="number" min={0} dir="ltr" value={stock} onChange={(e) => setStock(e.target.value)} />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button type="button" onClick={save} disabled={busy}>
          {t("variantManager.save")}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          {t("variantManager.cancel")}
        </Button>
      </div>
    </div>
  );
}

export function VariantManager({
  scope,
  productId,
  variants,
}: {
  scope: VariantScope;
  productId: string;
  variants: ProductVariant[];
}) {
  const { t } = useTranslation();
  const { add, update, remove } = useVariantActions(scope, productId);
  const [editing, setEditing] = useState<number | "new" | null>(null);

  const optionNameHints = Array.from(new Set(variants.flatMap((v) => Object.keys(v.options))));
  const busy = add.isPending || update.isPending;

  async function save(payload: VariantPayload) {
    try {
      if (editing === "new") await add.mutateAsync(payload);
      else if (typeof editing === "number") await update.mutateAsync({ variantId: editing, payload });
      toast.success(t("variantManager.saved"));
      setEditing(null);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  async function onDelete(variantId: number) {
    if (!window.confirm(t("variantManager.confirmDelete"))) return;
    try {
      await remove.mutateAsync(variantId);
      toast.success(t("variantManager.deleted"));
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold">{t("variantManager.title")}</h2>

      <ul className="divide-y rounded-lg border">
        {variants.map((v) => (
          <li key={v.id} className="p-3">
            {editing === v.id ? (
              <VariantEditor
                key={v.id}
                initial={v}
                optionNameHints={optionNameHints}
                busy={busy}
                onSave={(payload) => void save(payload)}
                onCancel={() => setEditing(null)}
              />
            ) : (
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="font-medium">
                    {Object.keys(v.options).length > 0
                      ? Object.entries(v.options)
                          .map(([name, value]) => `${name}: ${value}`)
                          .join(" · ")
                      : t("variantManager.noOptions")}
                  </div>
                  <div className="text-xs text-muted-foreground" dir="ltr">
                    {v.sku ? `${v.sku} · ` : ""}
                    {(v.price / 100).toFixed(2)} · {t("productForm.variants.stock")}: {v.stock}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" aria-label={t("variantManager.edit")} onClick={() => setEditing(v.id)}>
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={t("productForm.variants.remove")}
                    disabled={remove.isPending}
                    onClick={() => void onDelete(v.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      {editing === "new" ? (
        <VariantEditor
          initial={null}
          optionNameHints={optionNameHints}
          busy={busy}
          onSave={(payload) => void save(payload)}
          onCancel={() => setEditing(null)}
        />
      ) : (
        <Button type="button" variant="outline" className="gap-2" onClick={() => setEditing("new")}>
          <Plus className="size-4" />
          {t("variantManager.add")}
        </Button>
      )}
    </section>
  );
}