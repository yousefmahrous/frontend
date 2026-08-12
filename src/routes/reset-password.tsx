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

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search["token"] === "string" ? search["token"] : "",
  }),
  head: () => ({
    meta: [
      { title: "إعادة تعيين كلمة المرور | مكتبة القراء" },
      { name: "description", content: "اختر كلمة مرور جديدة لحسابك في مكتبة القراء." },
      { property: "og:title", content: "إعادة تعيين كلمة المرور | مكتبة القراء" },
      { property: "og:description", content: "اختر كلمة مرور جديدة لحسابك." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
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
      <AuthShell title="رابط غير صالح" subtitle="الرابط ناقص أو منتهي">
        <p className="text-sm text-muted-foreground">
          افتح الرابط من الإيميل مرة تانية، أو اطلب رابط جديد.
        </p>
        <Button asChild className="mt-4 w-full">
          <Link to="/forgot-password">طلب رابط جديد</Link>
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="كلمة مرور جديدة" subtitle="اختر كلمة مرور قوية لحسابك">
      <form onSubmit={(event) => void onSubmit(event)} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
          <Input id="newPassword" type="password" dir="ltr" {...register("newPassword")} />
          {errors.newPassword && (
            <p className="text-sm text-destructive">{errors.newPassword.message}</p>
          )}
        </div>
        <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          تعيين كلمة المرور
        </Button>
      </form>
    </AuthShell>
  );
}