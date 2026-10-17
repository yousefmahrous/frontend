import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { VendorOnly } from "@/components/Guards";
import { DashboardShell } from "@/components/DashboardShell";
import { VendorAnalytics } from "@/components/vendor/VendorAnalytics";
import { vendorDashboardLinks } from "@/lib/dashboard-links";
import { Skeleton } from "@/components/ui/skeleton";
import { useVendorEarnings } from "@/hooks/useVendor";

export const Route = createFileRoute("/vendor/dashboard")({
  ssr: false,
  component: () => (
    <VendorOnly>
      <VendorDashboardPage />
    </VendorOnly>
  ),
});

const formatPrice = (amountInPiastres: number) => (amountInPiastres / 100).toFixed(2);

function VendorDashboardPage() {
  const { t } = useTranslation();
  const earnings = useVendorEarnings();

  const cards = earnings.data
    ? [
        { key: "available", value: earnings.data.available, highlight: true },
        { key: "pending", value: earnings.data.pending },
        { key: "paidOut", value: earnings.data.paid_out },
      ]
    : [];

  return (
    <DashboardShell
      title={t("dashboard.vendorTitle")}
      subtitle={t("dashboard.vendorSubtitle")}
      links={vendorDashboardLinks(t)}
    >
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {earnings.isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))
          : cards.map((card) => (
              <div
                key={card.key}
                className={`rounded-xl border p-4 shadow-sm ${
                  card.highlight ? "border-accent bg-accent/5" : "border-border bg-card"
                }`}
              >
                <p className="text-sm text-muted-foreground">{t(`dashboard.${card.key}`)}</p>
                <p className="mt-1 text-2xl font-extrabold">
                  {formatPrice(card.value)}{" "}
                  <span className="text-sm font-medium">{t("dashboard.currency")}</span>
                </p>
              </div>
            ))}
      </div>

      <VendorAnalytics />
    </DashboardShell>
  );
}
