import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import { errorMessage } from "@/api/client";
import { Protected } from "@/components/Guards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useApplyVendor, useMyVendor } from "@/hooks/useVendor";
import type { VendorStatus } from "@/api/vendor.api";

export const Route = createFileRoute("/vendor/apply")({
  ssr: false,
  component: () => (
    <Protected>
      <VendorApplyPage />
    </Protected>
  ),
});

const STATUS_BADGE: Record<VendorStatus, string> = {
  pending: "bg-amber-100 text-amber-700 hover:bg-amber-100",
  active: "bg-green-100 text-green-700 hover:bg-green-100",
  suspended: "bg-destructive/10 text-destructive hover:bg-destructive/10",
  rejected: "bg-destructive/10 text-destructive hover:bg-destructive/10",
};

function VendorApplyPage() {
  const { t } = useTranslation();
  const { data: vendor, isLoading } = useMyVendor();
  const applyVendor = useApplyVendor();
  const [storeName, setStoreName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const canApply = !vendor || vendor.status === "rejected";

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = storeName.trim();
    if (trimmed.length < 3 || trimmed.length > 60) {
      setError(t("validation.generic.between", { min: 3, max: 60 }) || "");
      return;
    }
    setError(null);
    try {
      await applyVendor.mutateAsync(trimmed);
      toast.success(t("vendorApply.appliedSuccess"));
      setStoreName("");
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="mb-2 text-2xl font-bold md:text-3xl">{t("vendorApply.title")}</h1>
      <p className="mb-8 text-sm text-muted-foreground">{t("vendorApply.intro")}</p>

      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <>
          {vendor && (
            <div className="mb-8 rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">{t("vendorApply.storeName")}</p>
                  <p className="font-medium">{vendor.store_name}</p>
                </div>
                <Badge className={STATUS_BADGE[vendor.status]}>
                  {t(`adminVendors.status_${vendor.status}`)}
                </Badge>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                {t(`vendorGuard.status_${vendor.status}`, t("vendorGuard.notActive"))}
              </p>
            </div>
          )}

          {canApply && (
            <form onSubmit={(e) => void submit(e)} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="store_name">{t("vendorApply.storeNameLabel")}</Label>
                <Input
                  id="store_name"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder={t("vendorApply.storeNamePlaceholder")}
                />
                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>
              <Button type="submit" disabled={applyVendor.isPending}>
                {vendor?.status === "rejected" ? t("vendorApply.reapply") : t("vendorApply.submit")}
              </Button>
            </form>
          )}
        </>
      )}
    </div>
  );
}