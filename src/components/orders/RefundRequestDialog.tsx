import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { errorMessage } from "@/api/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useRequestRefund } from "@/hooks/useRefund";

type Props = {
  orderId: number;
  vendorOrderId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function RefundRequestDialog({ orderId, vendorOrderId, open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const [reason, setReason] = useState("");
  const requestRefundMutation = useRequestRefund();

  function handleSubmit() {
    if (!reason.trim()) {
      toast.error(t("orders.reasonRequired"));
      return;
    }

    requestRefundMutation.mutate(
      { orderId, reason: reason.trim(), vendorOrderId: vendorOrderId ?? undefined },
      {
        onSuccess: () => {
          toast.success(t("orders.refundRequestSent"));
          setReason("");
          onOpenChange(false);
        },
        onError: (err) => toast.error(errorMessage(err)),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("orders.refundDialogTitle", { id: orderId })}</DialogTitle>
          <DialogDescription>{t("orders.refundDialogDesc")}</DialogDescription>
        </DialogHeader>

        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={t("orders.reasonPlaceholder")}
          rows={4}
        />

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={requestRefundMutation.isPending}>
            {requestRefundMutation.isPending ? t("orders.sending") : t("orders.sendRequest")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}