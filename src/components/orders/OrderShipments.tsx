import { MapPin, Truck } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { Order } from "@/api/order.api";
import { Badge } from "@/components/ui/badge";
import { getFulfillmentStatusMeta } from "@/lib/status";

export function OrderShipments({ order }: { order: Order }) {
  const { t } = useTranslation();

  if (!order.paid_at || order.shipments.length === 0) return null;

  const statusMeta = getFulfillmentStatusMeta(t);

  return (
    <div className="mt-3 space-y-3 border-t border-border pt-3">
      <p className="flex items-center gap-2 text-sm font-bold">
        <Truck className="size-4 text-accent" />
        {t("fulfillment.shipments")}
      </p>

      {order.shipments.map((shipment) => {
        const meta = statusMeta[shipment.fulfillment_status];
        return (
          <div key={shipment.id} className="space-y-2 rounded-lg bg-secondary/40 p-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium">
                {t("fulfillment.shipmentFrom", { store: shipment.vendor?.store_name ?? "" })}
              </span>
              <Badge className={meta.className}>{meta.label}</Badge>
            </div>

            <p className="text-muted-foreground">
              {shipment.items.map((item) => `${item.title} × ${item.quantity}`).join(t("common.listSeparator"))}
            </p>

            {shipment.carrier && (
              <p className="text-muted-foreground">
                {t("fulfillment.carrier")}: <span className="text-foreground">{shipment.carrier}</span>
                {shipment.tracking_number && (
                  <>
                    {" · "}
                    {t("fulfillment.trackingNumber")}:{" "}
                    <span dir="ltr" className="font-mono text-foreground">
                      {shipment.tracking_number}
                    </span>
                  </>
                )}
              </p>
            )}
          </div>
        );
      })}

      {order.shipping && (
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <MapPin className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="font-medium text-foreground">{t("fulfillment.shippingAddress")}</p>
            <p>
              {order.shipping.name} · <span dir="ltr">{order.shipping.phone}</span>
            </p>
            <p>
              {[order.shipping.address, order.shipping.city].join(t("common.listSeparator"))}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}