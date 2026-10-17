import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import type { AnalyticsRange } from "@/api/vendor.api";
import { errorMessage } from "@/api/client";
import { ErrorState } from "@/components/StateViews";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { useVendorAnalytics } from "@/hooks/useVendor";

const RANGES: AnalyticsRange[] = [7, 30, 90];
const STATUSES = ["pending", "processing", "shipped", "delivered"] as const;

const toMoney = (piastres: number) => piastres / 100;

export function VendorAnalytics() {
  const { t, i18n } = useTranslation();
  const [days, setDays] = useState<AnalyticsRange>(30);
  const { data, isLoading, isError, error, refetch } = useVendorAnalytics(days);

  const locale = i18n.language === "ar" ? "ar-EG" : "en-US";
  const currency = t("dashboard.currency");
  const money = (piastres: number) =>
    `${toMoney(piastres).toLocaleString(locale, { maximumFractionDigits: 2 })} ${currency}`;

  const chartConfig = {
    revenue: { label: t("dashboard.revenue"), color: "var(--chart-1)" },
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
              { label: t("dashboard.revenue"), value: money(data.totals.revenue) },
              { label: t("dashboard.orders"), value: data.totals.orders.toLocaleString(locale) },
              {
                label: t("dashboard.itemsSold"),
                value: data.totals.items_sold.toLocaleString(locale),
              },
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

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <p className="text-sm text-muted-foreground">{t("dashboard.net")}</p>
              <p className="mt-1 text-xl font-extrabold">{money(data.totals.net)}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <p className="text-sm text-muted-foreground">{t("dashboard.returns")}</p>
              <p className="mt-1 text-xl font-extrabold">
                {data.totals.returns.toLocaleString(locale)}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold">{t("dashboard.salesOverTime")}</h3>
            {data.totals.orders === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                {t("dashboard.noSales")}
              </p>
            ) : (
              <ChartContainer config={chartConfig} className="h-64 w-full">
                <BarChart
                  data={data.daily.map((d) => ({ ...d, revenue: toMoney(d.revenue) }))}
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
                  <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
                </BarChart>
              </ChartContainer>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold">{t("dashboard.topProducts")}</h3>
              {data.top_products.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  {t("dashboard.noSales")}
                </p>
              ) : (
                <ol className="space-y-2">
                  {data.top_products.map((product) => (
                    <li
                      key={product.product_id}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="truncate font-medium">{product.title}</span>
                      <span className="shrink-0 text-muted-foreground">
                        {t("dashboard.unitsSold", { count: product.quantity })} ·{" "}
                        {money(product.revenue)}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold">{t("dashboard.fulfillment")}</h3>
              <ul className="space-y-2">
                {STATUSES.map((status) => (
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
        </>
      )}
    </section>
  );
}
