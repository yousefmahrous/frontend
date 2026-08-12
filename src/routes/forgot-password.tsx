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

export const Route = createFileRoute("/forgot-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "نسيت كلمة المرور | مكتبة القراء" },
      { name: "description", content: "أرسل رابط استعادة كلمة المرور لبريدك الإلكتروني." },
      { property: "og:title", content: "نسيت كلمة المرور | مكتبة القراء" },
      { property: "og:description", content: "استعد كلمة مرور حسابك في مكتبة القراء." },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
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
    <AuthShell title="نسيت كلمة المرور" subtitle="هنبعتلك رابط إعادة التعيين على إيميلك">
      <form onSubmit={(event) => void onSubmit(event)} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="email">الإيميل</Label>
          <Input id="email" type="email" dir="ltr" {...register("email")} />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>
        <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          إرسال الرابط
        </Button>
      </form>

      {isSubmitSuccessful && (
        <p className="mt-4 rounded-md bg-secondary p-3 text-sm text-secondary-foreground">
          راجع بريدك الإلكتروني، الرابط بيوصل خلال دقايق.
        </p>
      )}

      <p className="mt-5 text-sm text-muted-foreground">
        <Link to="/login" className="font-medium text-accent hover:underline">
          رجوع لتسجيل الدخول
        </Link>
      </p>
    </AuthShell>
  );
}