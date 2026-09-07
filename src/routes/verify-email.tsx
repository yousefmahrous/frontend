import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { resendVerification, verifyEmail } from "@/api/auth.api";
import { ApiError, errorMessage } from "@/api/client";
import { resendVerificationSchema } from "@/schemas/auth.schema";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import en from "@/i18n/locales/en.json";
import ar from "@/i18n/locales/ar.json";
import { DEFAULT_LANG, type Lang } from "@/i18n/i18n";
import { useTranslation } from "react-i18next";
export const Route = createFileRoute("/verify-email")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search["token"] === "string" ? search["token"] : "",
  }),
  head: ({ match }) => {
    const lang = (match.context as { lang?: Lang }).lang ?? DEFAULT_LANG;
    const meta = (lang === "ar" ? ar : en).pageMeta.verifyEmailPage;
    return {
      meta: [
        { title: meta.title },
        { name: "description", content: meta.description },
        { name: "robots", content: "noindex" },
      ],
    };
  },
  component: VerifyEmailPage,
});

function ResendForm() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const onResend = async () => {
    const parsed = resendVerificationSchema.safeParse({ email });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? t("verifyEmail.invalidEmail"));
      return;
    }
    setSending(true);
    try {
      const res = await resendVerification(parsed.data);
      toast.success(res.message);
      setSent(true);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mt-6 space-y-3 border-t border-border pt-6">
      <p className="text-sm text-muted-foreground">{t("verifyEmail.needNewLink")}</p>
      <div className="space-y-2">
        <Label htmlFor="resend-email">{t("common.email")}</Label>
        <Input
          id="resend-email"
          type="email"
          dir="ltr"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>
      <Button
        type="button"
        variant="secondary"
        className="w-full gap-2"
        disabled={sending || sent}
        onClick={() => void onResend()}
      >
        {sending && <Loader2 className="size-4 animate-spin" />}
        {sent ? t("verifyEmail.linkSent") : t("verifyEmail.sendNewLink")}
      </Button>
    </div>
  );
}

function VerifyEmailPage() {
  const { t } = useTranslation();
  const { token } = Route.useSearch();

  const { data, isPending, isError, error } = useQuery({
    queryKey: ["auth", "verify-email", token],
    queryFn: () => verifyEmail(token),
    enabled: Boolean(token),
    retry: false,
  });

  if (!token) {
    return (
      <AuthShell title={t("verifyEmail.invalidLink")} subtitle={t("verifyEmail.linkExpired")}>
        <p className="text-sm text-muted-foreground">
          {t("resetPassword.reopenLinkNote")}
        </p>
        <ResendForm />
      </AuthShell>
    );
  }

  if (isPending) {
    return (
      <AuthShell title={t("verifyEmail.confirmingBody")} subtitle={t("verifyEmail.momentsLeft")}>
        <div className="flex items-center justify-center py-6">
          <Loader2 className="size-8 animate-spin text-accent" />
        </div>
      </AuthShell>
    );
  }

  if (isError) {
    return (
      <AuthShell title={t("verifyEmail.failed")} subtitle={t("verifyEmail.problem")}>
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <XCircle className="size-10 text-destructive" />
          <p className="text-sm text-muted-foreground">
            {error instanceof ApiError ? error.message : t("verifyEmail.invalidTokenMsg")}
          </p>
        </div>
        <ResendForm />
      </AuthShell>
    );
  }

  return (
    <AuthShell title={t("verifyEmail.success")} subtitle={t("verifyEmail.accountActive")}>
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <CheckCircle2 className="size-10 text-primary" />
        <p className="text-sm text-muted-foreground">{data?.message}</p>
      </div>
      <Button asChild className="mt-2 w-full">
        <Link to="/login">{t("common.login")}</Link>
      </Button>
    </AuthShell>
  );
}