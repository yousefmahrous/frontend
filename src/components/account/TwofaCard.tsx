import { Loader2, ShieldCheck, ShieldOff } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { errorMessage } from "@/api/client";
import { OtpCodeInput, OTP_LENGTH } from "@/components/OtpCodeInput";
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
import {
  useDisableTwofa,
  useEnableTwofa,
  useStartTwofaSetup,
  useTwofaStatus,
} from "@/hooks/useTwofa";

interface SetupData {
  secret: string;
  qrDataUrl: string;
}

export function TwofaCard() {
  const { t } = useTranslation();
  const status = useTwofaStatus();
  const startSetup = useStartTwofaSetup();
  const enable = useEnableTwofa();
  const disable = useDisableTwofa();

  const [setup, setSetup] = useState<SetupData | null>(null);
  const [setupCode, setSetupCode] = useState("");

  const [disableOpen, setDisableOpen] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [disableCode, setDisableCode] = useState("");

  const enabled = status.data === true;

  const onStart = async () => {
    try {
      const data = await startSetup.mutateAsync();
      setSetupCode("");
      setSetup(data);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const onCancelSetup = () => {
    setSetup(null);
    setSetupCode("");
  };

  const onConfirmSetup = async (code: string) => {
    if (enable.isPending || code.length !== OTP_LENGTH) return;
    try {
      await enable.mutateAsync({ code });
      toast.success(t("account.twofa.enabledToast"));
      onCancelSetup();
    } catch (error) {
      toast.error(errorMessage(error));
      setSetupCode("");
    }
  };

  const closeDisable = () => {
    setDisableOpen(false);
    setDisablePassword("");
    setDisableCode("");
  };

  const onDisable = async () => {
    if (disable.isPending || !disablePassword || disableCode.length !== OTP_LENGTH) return;
    try {
      await disable.mutateAsync({ password: disablePassword, code: disableCode });
      toast.success(t("account.twofa.disabledToast"));
      closeDisable();
    } catch (error) {
      toast.error(errorMessage(error));
      setDisableCode("");
    }
  };

  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 size-5 text-accent" />
          <div>
            <h2 className="font-semibold">{t("account.twofa.title")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("account.twofa.description")}</p>
          </div>
        </div>
        {!status.isLoading && !status.isError && (
          <Badge variant={enabled ? "default" : "secondary"}>
            {enabled ? t("account.twofa.statusEnabled") : t("account.twofa.statusDisabled")}
          </Badge>
        )}
      </div>

      {status.isLoading && (
        <div className="mt-4 flex justify-center">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {status.isError && (
        <div className="mt-4 space-y-2 text-sm">
          <p className="text-destructive">{t("account.twofa.loadError")}</p>
          <Button variant="outline" size="sm" onClick={() => void status.refetch()}>
            {t("account.twofa.retry")}
          </Button>
        </div>
      )}

      {status.isSuccess && !enabled && !setup && (
        <Button
          className="mt-4 gap-2"
          disabled={startSetup.isPending}
          onClick={() => void onStart()}
        >
          {startSetup.isPending && <Loader2 className="size-4 animate-spin" />}
          {t("account.twofa.enable")}
        </Button>
      )}

      {status.isSuccess && !enabled && setup && (
        <div className="mt-5 space-y-4">
          <div>
            <p className="font-medium">{t("account.twofa.scanTitle")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("account.twofa.scanHint")}</p>
          </div>
          <div className="flex justify-center">
            <img
              src={setup.qrDataUrl}
              alt={t("account.twofa.qrAlt")}
              className="size-48 rounded-lg border border-border bg-white p-2"
            />
          </div>
          <div className="text-center text-sm">
            <p className="text-muted-foreground">{t("account.twofa.manualKey")}</p>
            <code
              dir="ltr"
              className="mt-1 inline-block select-all break-all rounded bg-secondary px-2 py-1"
            >
              {setup.secret}
            </code>
          </div>
          <div className="space-y-3">
            <Label htmlFor="setup-code" className="block text-center">
              {t("account.twofa.codeLabel")}
            </Label>
            <OtpCodeInput
              id="setup-code"
              value={setupCode}
              onChange={setSetupCode}
              onComplete={(code) => void onConfirmSetup(code)}
              disabled={enable.isPending}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              className="gap-2"
              disabled={enable.isPending || setupCode.length !== OTP_LENGTH}
              onClick={() => void onConfirmSetup(setupCode)}
            >
              {enable.isPending && <Loader2 className="size-4 animate-spin" />}
              {t("account.twofa.confirm")}
            </Button>
            <Button variant="ghost" disabled={enable.isPending} onClick={onCancelSetup}>
              {t("common.cancel")}
            </Button>
          </div>
        </div>
      )}

      {status.isSuccess && enabled && (
        <Button variant="outline" className="mt-4 gap-2" onClick={() => setDisableOpen(true)}>
          <ShieldOff className="size-4" />
          {t("account.twofa.disable")}
        </Button>
      )}

      <Dialog
        open={disableOpen}
        onOpenChange={(open) => (open ? setDisableOpen(true) : closeDisable())}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("account.twofa.disableTitle")}</DialogTitle>
            <DialogDescription>{t("account.twofa.disableDescription")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="disable-password">{t("common.password")}</Label>
              <Input
                id="disable-password"
                type="password"
                dir="ltr"
                autoComplete="current-password"
                value={disablePassword}
                onChange={(event) => setDisablePassword(event.target.value)}
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="disable-code" className="block text-center">
                {t("account.twofa.codeLabel")}
              </Label>
              <OtpCodeInput
                id="disable-code"
                value={disableCode}
                onChange={setDisableCode}
                disabled={disable.isPending}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" disabled={disable.isPending} onClick={closeDisable}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              className="gap-2"
              disabled={disable.isPending || !disablePassword || disableCode.length !== OTP_LENGTH}
              onClick={() => void onDisable()}
            >
              {disable.isPending && <Loader2 className="size-4 animate-spin" />}
              {t("account.twofa.disableConfirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
