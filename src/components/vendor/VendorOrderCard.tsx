import { Loader2, MapPin } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { errorMessage } from "@/api/client";
import type { FulfillmentPayload, VendorOrder } from "@/api/vendor.api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdateFulfillment } from "@/hooks/useVendor";
import { getFulfillmentStatusMeta } from "@/lib/status";

const formatPrice = (amountInPiastres: number) => (amountInPiastres / 100).toFixed(2);

export function VendorOrderCard({ order }: { order: VendorOrder }) {
  const { t, i18n } = useTranslation();
  const update = useUpdateFulfillment();
  const [shipOpen, setShipOpen] = useState(false);
  const [carrier, setCarrier] = useState("");
  const [tracking, setTracking] = useState("");
  const [carrierError, setCarrierError] = useState("");

  const meta = getFulfillmentStatusMeta(t)[order.fulfillment_status];
  const onHold = order.order_status !== "paid";
  const date = new Date(order.paid_at ?? order.created_at).toLocaleDateString(
    i18n.language === "ar" ? "ar-EG" : "en-US",
    { year: "numeric", month: "long", day: "numeric" },
  );

  function submit(payload: FulfillmentPayload, onDone?: () => void) {
    update.mutate(
      { id: order.id, ...payload },
      {
        onSuccess: () => {
          toast.success(t("vendorOrders.updated"));
          onDone?.();
        },
        onError: (error) => toast.error(errorMessage(error)),
      },
    );
  }

  function confirmShip() {
    if (!carrier.trim()) {
      setCarrierError(t("vendorOrders.carrierRequired"));
      return;
    }
    submit(
      { status: "shipped", carrier: carrier.trim(), tracking_number: tracking.trim() || undefined },
      () => setShipOpen(false),
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
        <div>
          <p className="font-bold">{t("vendorOrders.orderNumber", { id: order.order_id })}</p>
          <p className="text-xs text-muted-foreground">{date}</p>
        </div>
        <Badge className={meta.className}>{meta.label}</Badge>
      </div>

      <div className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
        <MapPin className="mt-0.5 size-4 shrink-0" />
        <div>
          <p className="font-medium text-foreground">
            {order.shipping.name} · <span dir="ltr">{order.shipping.phone}</span>
          </p>
          <p>{[order.shipping.address, order.shipping.city].join(t("common.listSeparator"))}</p>
          {order.shipping.notes && (
            <p>
              {t("vendorOrders.notes")}: {order.shipping.notes}
            </p>
          )}
        </div>
      </div>

      <ul className="my-3 space-y-1">
        {order.items.map((item) => (
          <li key={item.book_id} className="flex items-center justify-between text-sm">
            <span>
              {item.title} <span className="text-muted-foreground">× {item.quantity}</span>
            </span>
            <span className="text-muted-foreground">
              {formatPrice(item.unit_price * item.quantity)} {t("bookDetails.currency")}
            </span>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between border-t border-border pt-3">
        <span className="text-sm text-muted-foreground">{t("vendorOrders.subtotal")}</span>
        <span className="font-extrabold">
          {formatPrice(order.subtotal)} {t("bookDetails.currency")}
        </span>
      </div>

      {order.carrier && (
        <p className="mt-2 text-sm text-muted-foreground">
          {t("fulfillment.carrier")}: <span className="text-foreground">{order.carrier}</span>
          {order.tracking_number && (
            <>
              {" · "}
              {t("fulfillment.trackingNumber")}:{" "}
              <span dir="ltr" className="font-mono text-foreground">
                {order.tracking_number}
              </span>
            </>
          )}
        </p>
      )}

      {onHold ? (
        <p className="mt-3 text-sm text-amber-700">{t("vendorOrders.onHold")}</p>
      ) : (
        <div className="mt-3 flex gap-2 border-t border-border pt-3">
          {order.fulfillment_status === "pending" && (
            <Button size="sm" disabled={update.isPending} onClick={() => submit({ status: "processing" })}>
              {update.isPending ? <Loader2 className="size-4 animate-spin" /> : t("vendorOrders.markProcessing")}
            </Button>
          )}
          {order.fulfillment_status === "processing" && (
            <Button size="sm" onClick={() => setShipOpen(true)}>
              {t("vendorOrders.markShipped")}
            </Button>
          )}
          {order.fulfillment_status === "shipped" && (
            <Button size="sm" disabled={update.isPending} onClick={() => submit({ status: "delivered" })}>
              {update.isPending ? <Loader2 className="size-4 animate-spin" /> : t("vendorOrders.markDelivered")}
            </Button>
          )}
        </div>
      )}

      <Dialog open={shipOpen} onOpenChange={(next) => !update.isPending && setShipOpen(next)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("vendorOrders.shipDialogTitle", { id: order.order_id })}</DialogTitle>
            <DialogDescription>{t("vendorOrders.shipDialogDesc")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`carrier-${order.id}`}>{t("vendorOrders.carrier")}</Label>
              <Input
                id={`carrier-${order.id}`}
                value={carrier}
                placeholder={t("vendorOrders.carrierPlaceholder")}
                onChange={(e) => {
                  setCarrier(e.target.value);
                  setCarrierError("");
                }}
              />
              {carrierError && <p className="text-sm text-destructive">{carrierError}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor={`tracking-${order.id}`}>{t("vendorOrders.trackingNumber")}</Label>
              <Input
                id={`tracking-${order.id}`}
                dir="ltr"
                value={tracking}
                onChange={(e) => setTracking(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button disabled={update.isPending} onClick={confirmShip}>
              {update.isPending ? <Loader2 className="size-4 animate-spin" /> : t("vendorOrders.confirmShip")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}