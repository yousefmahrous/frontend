import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { resetPassword } from "@/api/auth.api";
import { ApiError, errorMessage } from "@/api/client";
import { resetPasswordSchema, type ResetPasswordValues } from "@/schemas/auth.schema";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import en from "@/i18n/locales/en.json";
import ar from "@/i18n/locales/ar.json";
import { DEFAULT_LANG, type Lang } from "@/i18n/i18n";
import { useTranslation } from "react-i18next";
export const Route = createFileRoute("/reset-password")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search["token"] === "string" ? search["token"] : "",
  }),
  head: ({ match }) => {
    const lang = (match.context as { lang?: Lang }).lang ?? DEFAULT_LANG;
    const meta = (lang === "ar" ? ar : en).pageMeta.resetPasswordPage;
    return {
      meta: [
        { title: meta.title },
        { name: "description", content: meta.description },
        { property: "og:title", content: meta.title },
        { property: "og:description", content: meta.ogDescription },
        { name: "robots", content: "noindex" },
      ],
    };
  },
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { t } = useTranslation();
  const { token } = Route.useSearch();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const res = await resetPassword({ token, newPassword: values.newPassword });
      toast.success(res.message);
      void navigate({ to: "/login" });
    } catch (error) {
      if (error instanceof ApiError && error.fieldErrors?.["newPassword"]) {
        setError("newPassword", { message: error.fieldErrors["newPassword"] });
        return;
      }
      toast.error(errorMessage(error));
    }
  });

  if (!token) {
    return (
      <AuthShell title={t("resetPassword.invalidLink")} subtitle={t("resetPassword.linkExpired")}>
        <p className="text-sm text-muted-foreground">
          {t("resetPassword.reopenLinkNote")}
        </p>
        <Button asChild className="mt-4 w-full">
          <Link to="/forgot-password">{t("resetPassword.requestNewLink")}</Link>
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell title={t("resetPassword.newPasswordTitle")} subtitle={t("resetPassword.subtitle")}>
      <form onSubmit={(event) => void onSubmit(event)} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="newPassword">{t("resetPassword.newPasswordLabel")}</Label>
          <Input id="newPassword" type="password" dir="ltr" {...register("newPassword")} />
          {errors.newPassword && (
            <p className="text-sm text-destructive">{errors.newPassword.message}</p>
          )}
        </div>
        <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {t("resetPassword.submit")}
        </Button>
      </form>
    </AuthShell>
  );
}