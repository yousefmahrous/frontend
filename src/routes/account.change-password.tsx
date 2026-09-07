import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { changePassword } from "@/api/auth.api";
import { ApiError, errorMessage } from "@/api/client";
import { changePasswordSchema, type ChangePasswordValues } from "@/schemas/auth.schema";
import { AuthShell } from "@/components/AuthShell";
import { Protected } from "@/components/Guards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/auth-context";

import en from "@/i18n/locales/en.json";
import ar from "@/i18n/locales/ar.json";
import { DEFAULT_LANG, type Lang } from "@/i18n/i18n";
import { useTranslation } from "react-i18next";
export const Route = createFileRoute("/account/change-password")({
  ssr: false,
  head: ({ match }) => {
    const lang = (match.context as { lang?: Lang }).lang ?? DEFAULT_LANG;
    const meta = (lang === "ar" ? ar : en).pageMeta.accountChangePassword;
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
  component: () => (
    <Protected>
      <ChangePasswordPage />
    </Protected>
  ),
});

function ChangePasswordPage() {
  const { t } = useTranslation();
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { oldPassword: "", newPassword: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await changePassword(values);
      setUser(null);
      toast.success(t("accountChangePassword.successToast"));
      void navigate({ to: "/login" });
    } catch (error) {
      if (error instanceof ApiError && error.fieldErrors) {
        for (const [field, message] of Object.entries(error.fieldErrors)) {
          setError(field as keyof ChangePasswordValues, { message });
        }
        return;
      }
      toast.error(errorMessage(error));
    }
  });

  return (
    <AuthShell title={t("accountChangePassword.title")} subtitle={t("accountChangePassword.reLoginNote")}>
      <form onSubmit={(event) => void onSubmit(event)} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="oldPassword">{t("accountChangePassword.currentPassword")}</Label>
          <Input id="oldPassword" type="password" dir="ltr" {...register("oldPassword")} />
          {errors.oldPassword && (
            <p className="text-sm text-destructive">{errors.oldPassword.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="newPassword">{t("accountChangePassword.newPassword")}</Label>
          <Input id="newPassword" type="password" dir="ltr" {...register("newPassword")} />
          {errors.newPassword && (
            <p className="text-sm text-destructive">{errors.newPassword.message}</p>
          )}
        </div>
        <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {t("nav.changePassword")}
        </Button>
      </form>
    </AuthShell>
  );
}