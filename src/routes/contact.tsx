import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Mail } from "lucide-react";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { sendContactMessage } from "@/api/contact.api";
import { ApiError, errorMessage } from "@/api/client";
import { createContactSchema, type ContactValues } from "@/schemas/contact.schema";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import en from "@/i18n/locales/en.json";
import ar from "@/i18n/locales/ar.json";
import { DEFAULT_LANG, type Lang } from "@/i18n/i18n";
import { useTranslation } from "react-i18next";
export const Route = createFileRoute("/contact")({
  ssr: false,
  head: ({ match }) => {
    const lang = (match.context as { lang?: Lang }).lang ?? DEFAULT_LANG;
    const meta = (lang === "ar" ? ar : en).pageMeta.contactPage;
    return {
      meta: [
        { title: meta.title },
        { name: "description", content: meta.description },
        { property: "og:title", content: meta.title },
        { property: "og:description", content: meta.ogDescription },
      ],
    };
  },
  component: ContactPage,
});

function ContactPage() {
  const { t, i18n } = useTranslation();
  const contactSchema = useMemo(() => createContactSchema(t), [t, i18n.language]);
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
    <AuthShell title={t("contact.title")} subtitle={t("contact.subtitle")}>
      <form onSubmit={(event) => void onSubmit(event)} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="name">{t("common.name")}</Label>
          <Input id="name" type="text" {...register("name")} />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">{t("common.email")}</Label>
          <Input id="email" type="email" dir="ltr" {...register("email")} />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="subject">{t("contact.subject")}</Label>
          <Input id="subject" type="text" {...register("subject")} />
          {errors.subject && <p className="text-sm text-destructive">{errors.subject.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">{t("contact.message")}</Label>
          <Textarea id="message" rows={5} {...register("message")} />
          {errors.message && <p className="text-sm text-destructive">{errors.message.message}</p>}
        </div>

        <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
          {t("contact.submit")}
        </Button>
      </form>

      {isSubmitSuccessful && (
        <p className="mt-4 rounded-md bg-secondary p-3 text-sm text-secondary-foreground">
          {t("contact.successMsg")}
        </p>
      )}
    </AuthShell>
  );
}