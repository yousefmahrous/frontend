import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { signup } from "@/api/auth.api";
import { ApiError, errorMessage } from "@/api/client";
import { signupSchema, type SignupValues } from "@/schemas/auth.schema";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/signup")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "إنشاء حساب | مكتبة القراء" },
      { name: "description", content: "أنشئ حسابك في مكتبة القراء وابدأ تصفح الكتب فورًا." },
      { property: "og:title", content: "إنشاء حساب | مكتبة القراء" },
      { property: "og:description", content: "أنشئ حسابك في مكتبة القراء." },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const res = await signup(values);
      toast.success(res.message);
      void navigate({ to: "/login" });
    } catch (error) {
      if (error instanceof ApiError && error.fieldErrors) {
        for (const [field, message] of Object.entries(error.fieldErrors)) {
          setError(field as keyof SignupValues, { message });
        }
        return;
      }
      toast.error(errorMessage(error));
    }
  });

  return (
    <AuthShell title="إنشاء حساب" subtitle="خطوة واحدة وتبدأ رحلتك مع الكتب">
      <form onSubmit={(event) => void onSubmit(event)} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="name">الاسم</Label>
          <Input id="name" {...register("name")} />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">الإيميل</Label>
          <Input id="email" type="email" dir="ltr" {...register("email")} />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">كلمة المرور</Label>
          <Input id="password" type="password" dir="ltr" {...register("password")} />
          {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
        </div>
        <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          إنشاء الحساب
        </Button>
      </form>

      <p className="mt-5 text-sm text-muted-foreground">
        عندك حساب؟{" "}
        <Link to="/login" className="font-medium text-accent hover:underline">
          تسجيل الدخول
        </Link>
      </p>
    </AuthShell>
  );
}