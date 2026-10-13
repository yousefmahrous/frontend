import { createFileRoute } from "@tanstack/react-router";
import { Percent } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { errorMessage } from "@/api/client";
import type { CommissionVendor } from "@/api/settings.api";
import { AdminOnly } from "@/components/Guards";
import { ErrorState } from "@/components/StateViews";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCommissionSettings,
  useUpdateCommissionSettings,
  useUpdateVendorCommission,
} from "@/hooks/useSettings";

export const Route = createFileRoute("/admin/commission/")({
  ssr: false,
  component: () => (
    <AdminOnly>
      <AdminCommissionPage />
    </AdminOnly>
  ),
});

// Percent <-> basis points (1% = 100 bps); null when the text isn't a valid 0-100 percent.
const percentToBps = (text: string): number | null => {
  const n = Number(text.trim());
  if (text.trim() === "" || !Number.isFinite(n) || n < 0 || n > 100) return null;
  return Math.round(n * 100);
};
const bpsToPercent = (bps: number) => String(bps / 100);

function DefaultsForm({ defaultBps, holdDays }: { defaultBps: number; holdDays: number }) {
  const { t } = useTranslation();
  const update = useUpdateCommissionSettings();
  const [percent, setPercent] = useState(bpsToPercent(defaultBps));
  const [days, setDays] = useState(String(holdDays));

  function save() {
    const bps = percentToBps(percent);
    const hold = Number(days);
    if (bps === null) {
      toast.error(t("adminCommission.invalidPercent"));
      return;
    }
    if (!Number.isInteger(hold) || hold < 0 || hold > 90) {
      toast.error(t("adminCommission.invalidDays"));
      return;
    }
    update.mutate(
      { default_commission_bps: bps, payout_hold_days: hold },
      {
        onSuccess: () => toast.success(t("adminCommission.saved")),
        onError: (e) => toast.error(errorMessage(e)),
      },
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="default-percent">{t("adminCommission.defaultRate")}</Label>
          <Input id="default-percent" dir="ltr" inputMode="decimal" value={percent} onChange={(e) => setPercent(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="hold-days">{t("adminCommission.holdDays")}</Label>
          <Input id="hold-days" dir="ltr" inputMode="numeric" value={days} onChange={(e) => setDays(e.target.value)} />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{t("adminCommission.futureOnly")}</p>
      <Button disabled={update.isPending} onClick={save}>
        {t("adminCommission.save")}
      </Button>
    </div>
  );
}

function VendorRateRow({ vendor, defaultBps }: { vendor: CommissionVendor; defaultBps: number }) {
  const { t } = useTranslation();
  const update = useUpdateVendorCommission();
  const [text, setText] = useState(vendor.commission_bps === null ? "" : bpsToPercent(vendor.commission_bps));

  function submit(bps: number | null) {
    update.mutate(
      { vendorId: vendor.id, bps },
      {
        onSuccess: () => {
          if (bps === null) setText("");
          toast.success(t("adminCommission.saved"));
        },
        onError: (e) => toast.error(errorMessage(e)),
      },
    );
  }

  function save() {
    const bps = percentToBps(text);
    if (bps === null) {
      toast.error(t("adminCommission.invalidPercent"));
      return;
    }
    submit(bps);
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3">
      <div className="min-w-32 flex-1">
        <p className="font-medium">{vendor.store_name}</p>
        <p className="text-xs text-muted-foreground">
          {vendor.commission_bps === null
            ? t("adminCommission.usingDefault", { percent: defaultBps / 100 })
            : t("adminCommission.customRate", { percent: vendor.commission_bps / 100 })}
        </p>
      </div>
      <Input
        className="w-24"
        dir="ltr"
        inputMode="decimal"
        value={text}
        placeholder={bpsToPercent(defaultBps)}
        onChange={(e) => setText(e.target.value)}
      />
      <span className="text-sm text-muted-foreground">%</span>
      <Button size="sm" disabled={update.isPending} onClick={save}>
        {t("adminCommission.save")}
      </Button>
      {vendor.commission_bps !== null && (
        <Button size="sm" variant="outline" disabled={update.isPending} onClick={() => submit(null)}>
          {t("adminCommission.useDefault")}
        </Button>
      )}
    </div>
  );
}

function AdminCommissionPage() {
  const { t } = useTranslation();
  const { data, isLoading, isError, error, refetch } = useCommissionSettings();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex items-center gap-3">
        <Percent className="size-6 text-accent" />
        <h1 className="text-2xl font-extrabold">{t("adminCommission.title")}</h1>
      </div>

      {isLoading ? (
        <Skeleton className="h-48 w-full rounded-xl" />
      ) : isError || !data ? (
        <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
      ) : (
        <>
          <DefaultsForm
            key={`${data.default_commission_bps}-${data.payout_hold_days}`}
            defaultBps={data.default_commission_bps}
            holdDays={data.payout_hold_days}
          />

          <h2 className="mb-3 mt-10 text-lg font-bold">{t("adminCommission.perVendor")}</h2>
          <div className="space-y-3">
            {data.vendors.map((vendor) => (
              <VendorRateRow
                key={`${vendor.id}-${vendor.commission_bps}`}
                vendor={vendor}
                defaultBps={data.default_commission_bps}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}