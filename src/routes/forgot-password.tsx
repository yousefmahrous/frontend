import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { forgotPassword } from "@/api/auth.api";
import { ApiError, errorMessage } from "@/api/client";
import { forgotPasswordSchema, type ForgotPasswordValues } from "@/schemas/auth.schema";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import en from "@/i18n/locales/en.json";
import ar from "@/i18n/locales/ar.json";
import { DEFAULT_LANG, type Lang } from "@/i18n/i18n";
import { useTranslation } from "react-i18next";
export const Route = createFileRoute("/forgot-password")({
  ssr: false,
  head: ({ match }) => {
    const lang = (match.context as { lang?: Lang }).lang ?? DEFAULT_LANG;
    const meta = (lang === "ar" ? ar : en).pageMeta.forgotPasswordPage;
    return {
      meta: [
        { title: meta.title },
        { name: "description", content: meta.description },
        { property: "og:title", content: meta.title },
        { property: "og:description", content: meta.ogDescription },
      ],
    };
  },
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const res = await forgotPassword(values);
      toast.success(res.message);
    } catch (error) {
      if (error instanceof ApiError && error.fieldErrors?.["email"]) {
        setError("email", { message: error.fieldErrors["email"] });
        return;
      }
      toast.error(errorMessage(error));
    }
  });

  return (
    <AuthShell title={t("forgotPassword.title")} subtitle={t("forgotPassword.subtitle")}>
      <form onSubmit={(event) => void onSubmit(event)} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="email">{t("common.email")}</Label>
          <Input id="email" type="email" dir="ltr" {...register("email")} />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>
        <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {t("forgotPassword.sendLink")}
        </Button>
      </form>

      {isSubmitSuccessful && (
        <p className="mt-4 rounded-md bg-secondary p-3 text-sm text-secondary-foreground">
          {t("forgotPassword.checkEmail")}
        </p>
      )}

      <p className="mt-5 text-sm text-muted-foreground">
        <Link to="/login" className="font-medium text-accent hover:underline">
          {t("forgotPassword.backToLogin")}
        </Link>
      </p>
    </AuthShell>
  );
}