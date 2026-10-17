import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import type { AnalyticsRange, VendorStatus } from "@/api/vendor.api";
import { errorMessage } from "@/api/client";
import { ErrorState } from "@/components/StateViews";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminAnalytics } from "@/hooks/useVendor";

const RANGES: AnalyticsRange[] = [7, 30, 90];
const VENDOR_STATUSES: VendorStatus[] = ["pending", "active", "suspended", "rejected"];
const FULFILLMENT_STATUSES = ["pending", "processing", "shipped", "delivered"] as const;

const toMoney = (piastres: number) => piastres / 100;

export function AdminAnalytics() {
  const { t, i18n } = useTranslation();
  const [days, setDays] = useState<AnalyticsRange>(30);
  const { data, isLoading, isError, error, refetch } = useAdminAnalytics(days);

  const locale = i18n.language === "ar" ? "ar-EG" : "en-US";
  const currency = t("dashboard.currency");
  const money = (piastres: number) =>
    `${toMoney(piastres).toLocaleString(locale, { maximumFractionDigits: 2 })} ${currency}`;

  const chartConfig = {
    revenue: { label: t("dashboard.platformSales"), color: "var(--chart-1)" },
    commission: { label: t("dashboard.commission"), color: "var(--chart-2)" },
  } satisfies ChartConfig;

  return (
    <section className="mb-8 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">{t("dashboard.analytics")}</h2>
        <div className="flex gap-1">
          {RANGES.map((range) => (
            <Button
              key={range}
              size="sm"
              variant={range === days ? "default" : "outline"}
              onClick={() => setDays(range)}
            >
              {t(`dashboard.range${range}`)}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      ) : isError || !data ? (
        <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { label: t("dashboard.platformSales"), value: money(data.totals.revenue) },
              { label: t("dashboard.commission"), value: money(data.totals.commission) },
              { label: t("dashboard.orders"), value: data.totals.orders.toLocaleString(locale) },
              { label: t("dashboard.avgOrder"), value: money(data.totals.average_order_value) },
            ].map((card) => (
              <div
                key={card.label}
                className="rounded-xl border border-border bg-card p-4 shadow-sm"
              >
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <p className="mt-1 text-xl font-extrabold">{card.value}</p>
              </div>
            ))}
          </div>

          {data.pending_refunds > 0 && (
            <Link
              to="/admin/refunds"
              className="flex items-center justify-between rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 hover:bg-amber-100"
            >
              <span>{t("dashboard.pendingRefunds")}</span>
              <span className="text-lg font-extrabold">
                {data.pending_refunds.toLocaleString(locale)}
              </span>
            </Link>
          )}

          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold">{t("dashboard.salesOverTime")}</h3>
            {data.totals.orders === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                {t("dashboard.noSales")}
              </p>
            ) : (
              <ChartContainer config={chartConfig} className="h-64 w-full">
                <BarChart
                  data={data.daily.map((d) => ({
                    ...d,
                    revenue: toMoney(d.revenue),
                    commission: toMoney(d.commission),
                  }))}
                  margin={{ left: 4, right: 4 }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={24}
                    tickFormatter={(value: string) =>
                      new Date(`${value}T00:00:00`).toLocaleDateString(locale, {
                        day: "numeric",
                        month: "short",
                      })
                    }
                  />
                  <YAxis tickLine={false} axisLine={false} width={48} allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
                  <Bar dataKey="commission" fill="var(--color-commission)" radius={4} />
                </BarChart>
              </ChartContainer>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold">{t("dashboard.topVendors")}</h3>
              {data.top_vendors.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  {t("dashboard.noSales")}
                </p>
              ) : (
                <ol className="space-y-2">
                  {data.top_vendors.map((vendor) => (
                    <li
                      key={vendor.vendor_id}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="truncate font-medium">{vendor.store_name}</span>
                      <span className="shrink-0 text-muted-foreground">
                        {t("dashboard.ordersCount", { count: vendor.orders })} ·{" "}
                        {money(vendor.revenue)}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <h3 className="mb-3 text-sm font-semibold">{t("dashboard.vendorsByStatus")}</h3>
                <ul className="space-y-2">
                  {VENDOR_STATUSES.map((status) => (
                    <li key={status} className="flex items-center justify-between text-sm">
                      <span>{t(`dashboard.vendorStatus_${status}`)}</span>
                      <span className="font-bold">
                        {data.vendors[status].toLocaleString(locale)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <h3 className="mb-3 text-sm font-semibold">{t("dashboard.fulfillment")}</h3>
                <ul className="space-y-2">
                  {FULFILLMENT_STATUSES.map((status) => (
                    <li key={status} className="flex items-center justify-between text-sm">
                      <span>{t(`dashboard.status_${status}`)}</span>
                      <span className="font-bold">
                        {data.fulfillment[status].toLocaleString(locale)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
