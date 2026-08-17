import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { sendContactMessage } from "@/api/contact.api";
import { ApiError, errorMessage } from "@/api/client";
import { contactSchema, type ContactValues } from "@/schemas/contact.schema";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/contact")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "تواصل معنا | مكتبة القراء" },
      { name: "description", content: "ابعتلنا رسالتك وهنرد عليك في أقرب وقت." },
      { property: "og:title", content: "تواصل معنا | مكتبة القراء" },
      { property: "og:description", content: "تواصل مع فريق مكتبة القراء." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", subject: "", message: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const res = await sendContactMessage(values);
      toast.success(res.message);
      reset();
    } catch (error) {
      if (error instanceof ApiError && error.fieldErrors) {
        for (const [field, msg] of Object.entries(error.fieldErrors)) {
          setError(field as keyof ContactValues, { message: msg });
        }
        if (Object.keys(error.fieldErrors).length) return;
      }
      toast.error(errorMessage(error));
    }
  });

  return (
    <AuthShell title="تواصل معنا" subtitle="عندك سؤال أو اقتراح؟ ابعتلنا رسالة وهنرد عليك في أقرب وقت">
      <form onSubmit={(event) => void onSubmit(event)} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="name">الاسم</Label>
          <Input id="name" type="text" {...register("name")} />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">الإيميل</Label>
          <Input id="email" type="email" dir="ltr" {...register("email")} />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="subject">الموضوع</Label>
          <Input id="subject" type="text" {...register("subject")} />
          {errors.subject && <p className="text-sm text-destructive">{errors.subject.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">الرسالة</Label>
          <Textarea id="message" rows={5} {...register("message")} />
          {errors.message && <p className="text-sm text-destructive">{errors.message.message}</p>}
        </div>

        <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
          إرسال الرسالة
        </Button>
      </form>

      {isSubmitSuccessful && (
        <p className="mt-4 rounded-md bg-secondary p-3 text-sm text-secondary-foreground">
          تم إرسال رسالتك بنجاح، هنرد عليك في أقرب وقت.
        </p>
      )}
    </AuthShell>
  );
}