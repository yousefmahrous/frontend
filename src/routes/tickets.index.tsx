import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2, MessageSquarePlus, MessagesSquare } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { ApiError, errorMessage } from "@/api/client";
import type { Ticket, TicketStatus } from "@/api/ticket.api";
import { Protected } from "@/components/Guards";
import { EmptyState, ErrorState } from "@/components/StateViews";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useCreateTicket, useMyTickets } from "@/hooks/useTicket";
import { getTicketStatusMeta } from "@/lib/status";
import { createTicketSchema, type CreateTicketValues } from "../schemas/ticket.schema";

import en from "@/i18n/locales/en.json";
import ar from "@/i18n/locales/ar.json";
import { DEFAULT_LANG, type Lang } from "@/i18n/i18n";

export const Route = createFileRoute("/tickets/")({
  ssr: false,
  head: ({ match }) => {
    const lang = (match.context as { lang?: Lang }).lang ?? DEFAULT_LANG;
    const meta = (lang === "ar" ? ar : en).pageMeta.ticketsPage;
    return { meta: [{ title: meta.title }] };
  },
  component: () => (
    <Protected>
      <TicketsPage />
    </Protected>
  ),
});

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function TicketsPage() {
  const { t } = useTranslation();
  const { data: tickets, isLoading, isError, error, refetch } = useMyTickets();
  const [dialogOpen, setDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-10">
        <Skeleton className="h-8 w-40" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-14">
        <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
      </div>
    );
  }

  const items = tickets ?? [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <MessagesSquare className="size-6 text-accent" />
          <div>
            <h1 className="text-2xl font-extrabold">{t("ticket.pageTitle")}</h1>
            <p className="text-sm text-muted-foreground">{t("ticket.pageSubtitle")}</p>
          </div>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <MessageSquarePlus className="size-4" />
              {t("ticket.newTicket")}
            </Button>
          </DialogTrigger>
          <NewTicketDialogContent onCreated={() => setDialogOpen(false)} />
        </Dialog>
      </div>

      {items.length === 0 ? (
        <EmptyState title={t("ticket.empty")} description={t("ticket.emptyDesc")} />
      ) : (
        <div className="space-y-3">
          {items.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))}
        </div>
      )}
    </div>
  );
}

function TicketCard({ ticket }: { ticket: Ticket }) {
  const { t } = useTranslation();
  const meta = getTicketStatusMeta(t)[ticket.status];

  return (
    <Link
      to="/tickets/$id"
      params={{ id: String(ticket.id) }}
      className="block rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:bg-secondary/40"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-bold">{ticket.subject}</p>
        <Badge className={meta.className}>{meta.label}</Badge>
      </div>
      {ticket.last_message && (
        <p className="mt-2 truncate text-sm text-muted-foreground">{ticket.last_message.body}</p>
      )}
      <p className="mt-2 text-xs text-muted-foreground">{formatDate(ticket.updated_at)}</p>
    </Link>
  );
}

function NewTicketDialogContent({ onCreated }: { onCreated: () => void }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const ticketSchema = useMemo(() => createTicketSchema(t), [t, i18n.language]);
  const createTicketMutation = useCreateTicket();

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateTicketValues>({
    resolver: zodResolver(ticketSchema),
    defaultValues: { subject: "", message: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const ticket = await createTicketMutation.mutateAsync(values);
      toast.success(t("ticket.createdToast"));
      reset();
      onCreated();
      void navigate({ to: "/tickets/$id", params: { id: String(ticket.id) } });
    } catch (error) {
      if (error instanceof ApiError && error.fieldErrors) {
        for (const [field, msg] of Object.entries(error.fieldErrors)) {
          setError(field as keyof CreateTicketValues, { message: msg });
        }
        if (Object.keys(error.fieldErrors).length) return;
      }
      toast.error(errorMessage(error));
    }
  });

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{t("ticket.newTicketDialogTitle")}</DialogTitle>
        <DialogDescription>{t("ticket.newTicketDialogDesc")}</DialogDescription>
      </DialogHeader>

      <form onSubmit={(event) => void onSubmit(event)} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="subject">{t("ticket.subjectLabel")}</Label>
          <Input id="subject" type="text" placeholder={t("ticket.subjectPlaceholder")} {...register("subject")} />
          {errors.subject && <p className="text-sm text-destructive">{errors.subject.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">{t("ticket.messageLabel")}</Label>
          <Textarea
            id="message"
            rows={5}
            placeholder={t("ticket.messagePlaceholder")}
            {...register("message")}
          />
          {errors.message && <p className="text-sm text-destructive">{errors.message.message}</p>}
        </div>

        <DialogFooter>
          <Button type="submit" className="gap-2" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            {isSubmitting ? t("ticket.submitting") : t("ticket.submit")}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}