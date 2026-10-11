import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { ApiError, errorMessage } from "@/api/client";
import type { VendorBalance } from "@/api/payout.api";
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
import { Textarea } from "@/components/ui/textarea";
import { useRecordPayout } from "@/hooks/usePayout";

type Props = {
  balance: VendorBalance | null;
  onClose: () => void;
};

const formatPrice = (amountInPiastres: number) => (amountInPiastres / 100).toFixed(2);

export function RecordPayoutDialog({ balance, onClose }: Props) {
  const { t } = useTranslation();
  const record = useRecordPayout();
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [referenceError, setReferenceError] = useState("");

  function close() {
    if (record.isPending) return;
    setReference("");
    setNote("");
    setReferenceError("");
    onClose();
  }

  function submit() {
    if (!balance) return;
    if (!reference.trim()) {
      setReferenceError(t("adminPayouts.referenceRequired"));
      return;
    }
    record.mutate(
      { vendorId: balance.vendor.id, reference: reference.trim(), note: note.trim() || undefined },
      {
        onSuccess: (data) => {
          toast.success(
            `${t("adminPayouts.recorded")}: ${formatPrice(data.amount)} ${t("bookDetails.currency")}`,
          );
          close();
        },
        onError: (error) => {
          if (error instanceof ApiError && error.fieldErrors?.["reference"]) {
            setReferenceError(error.fieldErrors["reference"]);
            return;
          }
          toast.error(errorMessage(error));
        },
      },
    );
  }

  return (
    <Dialog open={balance !== null} onOpenChange={(open) => !open && close()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t("adminPayouts.dialogTitle", { store: balance?.vendor.store_name ?? "" })}
          </DialogTitle>
          <DialogDescription>{t("adminPayouts.dialogDesc")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg bg-secondary/50 p-3">
            <p className="text-sm text-muted-foreground">{t("adminPayouts.amountToPay")}</p>
            <p className="text-2xl font-extrabold">
              {formatPrice(balance?.available ?? 0)} {t("bookDetails.currency")}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payout-reference">{t("adminPayouts.reference")}</Label>
            <Input
              id="payout-reference"
              dir="ltr"
              value={reference}
              placeholder={t("adminPayouts.referencePlaceholder")}
              onChange={(e) => {
                setReference(e.target.value);
                setReferenceError("");
              }}
            />
            {referenceError && <p className="text-sm text-destructive">{referenceError}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="payout-note">{t("adminPayouts.note")}</Label>
            <Textarea id="payout-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button disabled={record.isPending} onClick={submit}>
            {record.isPending ? <Loader2 className="size-4 animate-spin" /> : t("adminPayouts.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}