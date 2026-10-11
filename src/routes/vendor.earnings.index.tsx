import { createFileRoute } from "@tanstack/react-router";
import { Wallet } from "lucide-react";
import { useTranslation } from "react-i18next";

import { errorMessage } from "@/api/client";
import { VendorOnly } from "@/components/Guards";
import { EmptyState, ErrorState } from "@/components/StateViews";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyPayouts, useVendorEarnings } from "@/hooks/useVendor";

export const Route = createFileRoute("/vendor/earnings/")({
  ssr: false,
  component: () => (
    <VendorOnly>
      <VendorEarningsPage />
    </VendorOnly>
  ),
});

const formatPrice = (amountInPiastres: number) => (amountInPiastres / 100).toFixed(2);

function VendorEarningsPage() {
  const { t, i18n } = useTranslation();
  const earnings = useVendorEarnings();
  const payouts = useMyPayouts({ page: 1, limit: 20 });
  const currency = t("bookDetails.currency");
  const locale = i18n.language === "ar" ? "ar-EG" : "en-US";

  const cards = earnings.data
    ? [
        { key: "available", value: earnings.data.available, highlight: true },
        { key: "pending", value: earnings.data.pending },
        { key: "onHold", value: earnings.data.on_hold },
        { key: "paidOut", value: earnings.data.paid_out },
      ]
    : [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex items-center gap-3">
        <Wallet className="size-6 text-accent" />
        <h1 className="text-2xl font-extrabold">{t("vendorEarnings.title")}</h1>
      </div>

      {earnings.isLoading ? (
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : earnings.isError ? (
        <ErrorState message={errorMessage(earnings.error)} onRetry={() => void earnings.refetch()} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            {cards.map((card) => (
              <div
                key={card.key}
                className={`rounded-xl border p-4 shadow-sm ${
                  card.highlight ? "border-accent bg-accent/5" : "border-border bg-card"
                }`}
              >
                <p className="text-sm text-muted-foreground">{t(`vendorEarnings.${card.key}`)}</p>
                <p className="mt-1 text-2xl font-extrabold">
                  {formatPrice(card.value)} <span className="text-sm font-medium">{currency}</span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{t(`vendorEarnings.${card.key}Hint`)}</p>
              </div>
            ))}
          </div>

          {earnings.data && (
            <div className="mt-4 space-y-1 text-sm text-muted-foreground">
              <p>{t("vendorEarnings.commissionNote", { percent: earnings.data.commission_bps / 100 })}</p>
              <p>{t("vendorEarnings.holdNote", { days: earnings.data.hold_days })}</p>
            </div>
          )}
        </>
      )}

      <h2 className="mb-3 mt-10 text-lg font-bold">{t("vendorEarnings.payouts")}</h2>

      {payouts.isLoading ? (
        <Skeleton className="h-24 w-full rounded-xl" />
      ) : payouts.isError ? (
        <ErrorState message={errorMessage(payouts.error)} onRetry={() => void payouts.refetch()} />
      ) : payouts.data?.items.length === 0 ? (
        <EmptyState title={t("vendorEarnings.noPayouts")} />
      ) : (
        <div className="space-y-3">
          {payouts.data?.items.map((payout) => (
            <div
              key={payout.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card p-4"
            >
              <div>
                <p className="font-bold">
                  {formatPrice(payout.amount)} {currency}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(payout.created_at).toLocaleDateString(locale, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                  {" · "}
                  {t("vendorEarnings.ordersCount", { count: payout.orders_count })}
                </p>
              </div>
              {payout.reference && (
                <p className="text-sm text-muted-foreground">
                  {t("vendorEarnings.reference")}:{" "}
                  <span dir="ltr" className="font-mono text-foreground">
                    {payout.reference}
                  </span>
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}