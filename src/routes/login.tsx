import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useMemo, useState } from "react";

import { login, loginWith2fa, needs2fa, resendVerification } from "@/api/auth.api";
import { ApiError, errorMessage } from "@/api/client";
import { createLoginSchema, type LoginValues } from "@/schemas/auth.schema";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OtpCodeInput, OTP_LENGTH } from "@/components/OtpCodeInput";
import { useAuth } from "@/context/auth-context";

import en from "@/i18n/locales/en.json";
import ar from "@/i18n/locales/ar.json";
import { DEFAULT_LANG, type Lang } from "@/i18n/i18n";
import { useTranslation } from "react-i18next";
export const Route = createFileRoute("/login")({
  ssr: false,
  head: ({ match }) => {
    const lang = (match.context as { lang?: Lang }).lang ?? DEFAULT_LANG;
    const meta = (lang === "ar" ? ar : en).pageMeta.loginPage;
    return {
      meta: [
        { title: meta.title },
        { name: "description", content: meta.description },
        { property: "og:title", content: meta.title },
        { property: "og:description", content: meta.ogDescription },
      ],
    };
  },
  component: LoginPage,
});

function LoginPage() {
  const { t, i18n } = useTranslation();
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [step, setStep] = useState<"credentials" | "twofa">("credentials");
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const loginSchema = useMemo(() => createLoginSchema(t), [t, i18n.language]);
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setUnverifiedEmail(null);
    try {
      const res = await login(values);
      if (needs2fa(res)) {
        setCode("");
        setStep("twofa");
        return;
      }
      setUser(res.user);
      toast.success(res.message);
      void navigate({ to: "/products" });
    } catch (error) {
      if (error instanceof ApiError && error.code === "EMAIL_NOT_VERIFIED") {
        setUnverifiedEmail(values.email);
        toast.error(error.message);
        return;
      }
      if (error instanceof ApiError && error.fieldErrors) {
        for (const [field, message] of Object.entries(error.fieldErrors)) {
          setError(field as keyof LoginValues, { message });
        }
        return;
      }
      toast.error(errorMessage(error));
    }
  });

  const backToCredentials = () => {
    setCode("");
    setValue("password", "");
    setStep("credentials");
  };

  const onVerifyCode = async (value: string) => {
    if (verifying || value.length !== OTP_LENGTH) return;
    setVerifying(true);
    try {
      const res = await loginWith2fa({ code: value });
      setUser(res.user);
      toast.success(res.message);
      void navigate({ to: "/products" });
    } catch (error) {
      if (error instanceof ApiError && error.code === "PENDING_2FA_EXPIRED") {
        toast.error(error.message);
        backToCredentials();
        return;
      }
      toast.error(errorMessage(error));
      setCode("");
    } finally {
      setVerifying(false);
    }
  };

  const onResendVerification = async () => {
    if (!unverifiedEmail) return;
    setResending(true);
    try {
      const res = await resendVerification({ email: unverifiedEmail });
      toast.success(res.message);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setResending(false);
    }
  };

  if (step === "twofa") {
    return (
      <AuthShell title={t("login.twofa.title")} subtitle={t("login.twofa.subtitle")}>
        <div className="space-y-4">
          <div className="space-y-3">
            <Label htmlFor="twofa-code" className="block text-center">
              {t("login.twofa.codeLabel")}
            </Label>
            <OtpCodeInput
              id="twofa-code"
              value={code}
              onChange={setCode}
              onComplete={(value) => void onVerifyCode(value)}
              disabled={verifying}
              autoFocus
            />
          </div>
          <Button
            type="button"
            className="w-full gap-2"
            disabled={verifying || code.length !== OTP_LENGTH}
            onClick={() => void onVerifyCode(code)}
          >
            {verifying && <Loader2 className="size-4 animate-spin" />}
            {t("login.twofa.submit")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            disabled={verifying}
            onClick={backToCredentials}
          >
            {t("login.twofa.back")}
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title={t("common.login")} subtitle={t("login.subtitle")}>
      <form onSubmit={(event) => void onSubmit(event)} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="email">{t("common.email")}</Label>
          <Input id="email" type="email" dir="ltr" {...register("email")} />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">{t("common.password")}</Label>
          <Input id="password" type="password" dir="ltr" {...register("password")} />
          {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
        </div>
        <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {t("login.submit")}
        </Button>
      </form>

      {unverifiedEmail && (
        <div className="mt-4 space-y-2 rounded-md bg-secondary p-3 text-sm text-secondary-foreground">
          <p>{t("login.emailNotVerified")}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={resending}
            onClick={() => void onResendVerification()}
          >
            {resending && <Loader2 className="size-4 animate-spin" />}
            {t("login.resendVerification")}
          </Button>
        </div>
      )}

      <div className="mt-5 space-y-2 text-sm text-muted-foreground">
        <Link to="/forgot-password" className="block font-medium text-accent hover:underline">
          {t("login.forgotPassword")}
        </Link>
        <p>
          {t("login.noAccount")}{" "}
          <Link to="/signup" className="font-medium text-accent hover:underline">
            {t("login.createNewAccount")}
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
