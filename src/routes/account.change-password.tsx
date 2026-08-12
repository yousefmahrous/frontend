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

export const Route = createFileRoute("/account/change-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "تغيير كلمة المرور | مكتبة االقراء" },
      { name: "description", content: "غيّر كلمة مرور حسابك في مكتبة القراء بشكل آمن." },
      { property: "og:title", content: "تغيير كلمة المرور | مكتبة االقراء" },
      { property: "og:description", content: "غيّر كلمة مرور حسابك بشكل آمن." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <Protected>
      <ChangePasswordPage />
    </Protected>
  ),
});

function ChangePasswordPage() {
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
      toast.success("غيّرت كلمة المرور، سجّل دخول تاني");
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
    <AuthShell title="تغيير كلمة المرور" subtitle="بعد التغيير هتحتاج تسجّل دخول من جديد">
      <form onSubmit={(event) => void onSubmit(event)} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="oldPassword">كلمة المرور الحالية</Label>
          <Input id="oldPassword" type="password" dir="ltr" {...register("oldPassword")} />
          {errors.oldPassword && (
            <p className="text-sm text-destructive">{errors.oldPassword.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
          <Input id="newPassword" type="password" dir="ltr" {...register("newPassword")} />
          {errors.newPassword && (
            <p className="text-sm text-destructive">{errors.newPassword.message}</p>
          )}
        </div>
        <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          تغيير كلمة المرور
        </Button>
      </form>
    </AuthShell>
  );
}