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

export const Route = createFileRoute("/verify-email")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search["token"] === "string" ? search["token"] : "",
  }),
  head: () => ({
    meta: [
      { title: "تأكيد البريد الإلكتروني | مكتبة القراء" },
      { name: "description", content: "تأكيد بريدك الإلكتروني لتفعيل حسابك في مكتبة القراء." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: VerifyEmailPage,
});

function ResendForm() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const onResend = async () => {
    const parsed = resendVerificationSchema.safeParse({ email });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "الإيميل غير صحيح");
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
      <p className="text-sm text-muted-foreground">محتاج رابط تأكيد جديد؟ اكتب إيميلك:</p>
      <div className="space-y-2">
        <Label htmlFor="resend-email">الإيميل</Label>
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
        {sent ? "تم إرسال الرابط" : "إرسال رابط تأكيد جديد"}
      </Button>
    </div>
  );
}

function VerifyEmailPage() {
  const { token } = Route.useSearch();

  const { data, isPending, isError, error } = useQuery({
    queryKey: ["auth", "verify-email", token],
    queryFn: () => verifyEmail(token),
    enabled: Boolean(token),
    retry: false,
  });

  if (!token) {
    return (
      <AuthShell title="رابط غير صالح" subtitle="الرابط ناقص أو منتهي">
        <p className="text-sm text-muted-foreground">
          افتح الرابط من الإيميل مرة تانية، أو اطلب رابط جديد.
        </p>
        <ResendForm />
      </AuthShell>
    );
  }

  if (isPending) {
    return (
      <AuthShell title="بنأكد بريدك الإلكتروني..." subtitle="لحظات وهنخلص">
        <div className="flex items-center justify-center py-6">
          <Loader2 className="size-8 animate-spin text-accent" />
        </div>
      </AuthShell>
    );
  }

  if (isError) {
    return (
      <AuthShell title="فشل تأكيد البريد" subtitle="حصلت مشكلة">
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <XCircle className="size-10 text-destructive" />
          <p className="text-sm text-muted-foreground">
            {error instanceof ApiError ? error.message : "رابط التأكيد غير صالح أو انتهت صلاحيته"}
          </p>
        </div>
        <ResendForm />
      </AuthShell>
    );
  }

  return (
    <AuthShell title="تم تأكيد بريدك الإلكتروني 🎉" subtitle="حسابك بقى مفعّل">
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <CheckCircle2 className="size-10 text-primary" />
        <p className="text-sm text-muted-foreground">{data?.message}</p>
      </div>
      <Button asChild className="mt-2 w-full">
        <Link to="/login">تسجيل الدخول</Link>
      </Button>
    </AuthShell>
  );
}