import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { ApiError, errorMessage } from "@/api/client";
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
import { useCheckout } from "@/hooks/usePayment";
import { createShippingSchema, type ShippingValues } from "@/schemas/shipping.schema";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ShippingDialog({ open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const checkout = useCheckout();
  const schema = useMemo(() => createShippingSchema(t), [t]);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ShippingValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", phone: "", address: "", city: "", notes: "" },
  });

  function onSubmit(values: ShippingValues) {
    checkout.mutate(
      { ...values, notes: values.notes || undefined },
      {
        onError: (error) => {
          if (error instanceof ApiError && error.fieldErrors) {
            for (const [field, message] of Object.entries(error.fieldErrors)) {
              setError(field as keyof ShippingValues, { message });
            }
            if (Object.keys(error.fieldErrors).length) return;
          }
          toast.error(errorMessage(error));
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !checkout.isPending && onOpenChange(next)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("shipping.title")}</DialogTitle>
          <DialogDescription>{t("shipping.description")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="shipping-name">{t("shipping.name")}</Label>
            <Input id="shipping-name" autoComplete="name" {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="shipping-phone">{t("shipping.phone")}</Label>
            <Input
              id="shipping-phone"
              type="tel"
              dir="ltr"
              autoComplete="tel"
              placeholder={t("shipping.phonePlaceholder")}
              {...register("phone")}
            />
            {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="shipping-address">{t("shipping.address")}</Label>
            <Input
              id="shipping-address"
              autoComplete="street-address"
              placeholder={t("shipping.addressPlaceholder")}
              {...register("address")}
            />
            {errors.address && <p className="text-sm text-destructive">{errors.address.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="shipping-city">{t("shipping.city")}</Label>
            <Input id="shipping-city" autoComplete="address-level2" {...register("city")} />
            {errors.city && <p className="text-sm text-destructive">{errors.city.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="shipping-notes">{t("shipping.notes")}</Label>
            <Textarea
              id="shipping-notes"
              rows={2}
              placeholder={t("shipping.notesPlaceholder")}
              {...register("notes")}
            />
            {errors.notes && <p className="text-sm text-destructive">{errors.notes.message}</p>}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={checkout.isPending} className="w-full sm:w-auto">
              {checkout.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                t("shipping.continueToPayment")
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}