import { MapPin, RotateCcw, Truck } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import type { Order } from "@/api/order.api";
import { RefundRequestDialog } from "@/components/orders/RefundRequestDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { isWithinReturnWindow } from "@/lib/returns";
import { getFulfillmentStatusMeta, getReturnStatusMeta } from "@/lib/status";

export function OrderShipments({ order }: { order: Order }) {
  const { t } = useTranslation();
  const [returningId, setReturningId] = useState<number | null>(null);

  // Orders that were never paid (or legacy orders) have nothing to track yet.
  if (!order.paid_at || order.shipments.length === 0) return null;

  const statusMeta = getFulfillmentStatusMeta(t);
  const returnMeta = getReturnStatusMeta(t);
  const canReturn = order.status === "paid" && isWithinReturnWindow(order.paid_at);

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

            {shipment.return_status ? (
              <Badge className={returnMeta[shipment.return_status].className}>
                {returnMeta[shipment.return_status].label}
              </Badge>
            ) : (
              canReturn && (
                <Button variant="outline" size="sm" onClick={() => setReturningId(shipment.id)}>
                  <RotateCcw className="ms-1 size-3.5" />
                  {t("orders.requestRefund")}
                </Button>
              )
            )}
          </div>
        );
      })}

      <RefundRequestDialog
        orderId={order.id}
        vendorOrderId={returningId}
        open={returningId !== null}
        onOpenChange={(open) => !open && setReturningId(null)}
      />

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