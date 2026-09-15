import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Loader2, Send, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { errorMessage } from "@/api/client";
import type { TicketMessage, TicketStatus } from "@/api/ticket.api";
import { Protected } from "@/components/Guards";
import { ErrorState } from "@/components/StateViews";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/auth-context";
import { useSendTicketMessage, useTicketDetail, useUpdateTicketStatus } from "@/hooks/useTicket";
import { useTicketSocket } from "@/hooks/useTicketSocket";
import { cn } from "@/lib/utils";

import en from "@/i18n/locales/en.json";
import ar from "@/i18n/locales/ar.json";
import { DEFAULT_LANG, type Lang } from "@/i18n/i18n";

export const Route = createFileRoute("/tickets/$id")({
  ssr: false,
  head: ({ match }) => {
    const lang = (match.context as { lang?: Lang }).lang ?? DEFAULT_LANG;
    const meta = (lang === "ar" ? ar : en).pageMeta.ticketDetailPage;
    return { meta: [{ title: meta.title }] };
  },
  component: () => (
    <Protected>
      <TicketChatPage />
    </Protected>
  ),
});

function getStatusMeta(
  t: (key: string) => string,
): Record<TicketStatus, { label: string; className: string }> {
  return {
    opened: {
      label: t("ticket.statusOpened"),
      className: "bg-blue-100 text-blue-700 hover:bg-blue-100",
    },
    pending: {
      label: t("ticket.statusPending"),
      className: "bg-amber-100 text-amber-700 hover:bg-amber-100",
    },
    under_review: {
      label: t("ticket.statusUnderReview"),
      className: "bg-purple-100 text-purple-700 hover:bg-purple-100",
    },
    resolved: {
      label: t("ticket.statusResolved"),
      className: "bg-green-100 text-green-700 hover:bg-green-100",
    },
  };
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
}

function TicketChatPage() {
  const { t } = useTranslation();
  const { id } = Route.useParams();
  const ticketId = Number(id);
  const { user, isAdmin } = useAuth();

  const { data: ticket, isLoading, isError, error, refetch } = useTicketDetail(ticketId);
  useTicketSocket(ticketId);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 px-4 py-10">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (isError || !ticket) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-14">
        <ErrorState
          message={isError ? errorMessage(error) : t("ticket.notFound")}
          onRetry={() => void refetch()}
        />
      </div>
    );
  }

  const meta = getStatusMeta(t)[ticket.status];
  const currentUserId = user ? Number(user.id) : null;

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-2xl flex-col px-4 py-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            to={isAdmin ? "/admin/tickets" : "/tickets"}
            className="flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary"
            aria-label={t("ticket.backToList")}
          >
            <ArrowRight className="size-5" />
          </Link>
          <div>
            <h1 className="font-bold">{ticket.subject}</h1>
            <p className="text-xs text-muted-foreground">
              {isAdmin ? t("adminTickets.title") : t("ticket.pageTitle")}
            </p>
          </div>
        </div>
        {isAdmin ? (
          <TicketStatusControl ticketId={ticketId} status={ticket.status} />
        ) : (
          <Badge className={meta.className}>{meta.label}</Badge>
        )}
      </div>

      <MessageList
        messages={ticket.messages ?? []}
        isAdmin={isAdmin}
        currentUserId={currentUserId}
        customerName={ticket.user?.name}
      />

      {ticket.status === "resolved" ? (
        <p className="mt-4 rounded-md bg-secondary p-3 text-center text-sm text-secondary-foreground">
          {t("ticket.closedNotice")}
        </p>
      ) : (
        <MessageComposer ticketId={ticketId} />
      )}
    </div>
  );
}

function MessageList({
  messages,
  isAdmin,
  currentUserId,
  customerName,
}: {
  messages: TicketMessage[];
  isAdmin: boolean;
  currentUserId: number | null;
  customerName?: string;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  return (
    <div className="flex-1 space-y-3 overflow-y-auto rounded-xl border border-border bg-card/40 p-4">
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          isAdmin={isAdmin}
          currentUserId={currentUserId}
          customerName={customerName}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}

function MessageBubble({
  message,
  isAdmin,
  currentUserId,
  customerName,
}: {
  message: TicketMessage;
  isAdmin: boolean;
  currentUserId: number | null;
  customerName?: string;
}) {
  const { t } = useTranslation();

  if (message.sender_type === "system") {
    return (
      <div className="flex items-center justify-center gap-1.5 py-1 text-center text-xs text-muted-foreground">
        <Sparkles className="size-3" />
        {message.body}
      </div>
    );
  }

  const isOwnMessage = isAdmin ? message.sender_type === "admin" : message.sender_type === "user";
  const senderLabel = isOwnMessage
    ? t("ticket.you")
    : message.sender_type === "admin"
      ? t("ticket.support")
      : (customerName ?? t("adminTickets.customerFallback"));

  return (
    <div className={cn("flex flex-col gap-1", isOwnMessage ? "items-end" : "items-start")}>
      <span className="text-xs text-muted-foreground">{senderLabel}</span>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2 text-sm",
          isOwnMessage
            ? "rounded-tl-none bg-primary text-primary-foreground"
            : "rounded-tr-none bg-secondary text-secondary-foreground",
        )}
      >
        {message.body}
      </div>
      <span className="text-[10px] text-muted-foreground">{formatTime(message.created_at)}</span>
    </div>
  );
}

function TicketStatusControl({ ticketId, status }: { ticketId: number; status: TicketStatus }) {
  const { t } = useTranslation();
  const statusMeta = getStatusMeta(t);
  const updateStatusMutation = useUpdateTicketStatus(ticketId);

  function handleChange(value: string) {
    if (value === status) return;
    updateStatusMutation.mutate(value as TicketStatus, {
      onSuccess: () => toast.success(t("adminTickets.statusUpdatedToast")),
      onError: (error) => toast.error(errorMessage(error)),
    });
  }

  return (
    <Select value={status} onValueChange={handleChange} disabled={updateStatusMutation.isPending}>
      <SelectTrigger className="w-44">
        <SelectValue>
          <Badge className={statusMeta[status].className}>{statusMeta[status].label}</Badge>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="opened">{t("ticket.statusOpened")}</SelectItem>
        <SelectItem value="pending">{t("ticket.statusPending")}</SelectItem>
        <SelectItem value="under_review">{t("ticket.statusUnderReview")}</SelectItem>
        <SelectItem value="resolved">{t("ticket.statusResolved")}</SelectItem>
      </SelectContent>
    </Select>
  );
}

function MessageComposer({ ticketId }: { ticketId: number }) {
  const { t } = useTranslation();
  const [body, setBody] = useState("");
  const sendMessageMutation = useSendTicketMessage(ticketId);

  function handleSend() {
    const trimmed = body.trim();
    if (!trimmed) return;

    sendMessageMutation.mutate(trimmed, {
      onSuccess: () => setBody(""),
      onError: (error) => toast.error(errorMessage(error)),
    });
  }

  return (
    <div className="mt-4 flex items-end gap-2">
      <Textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            handleSend();
          }
        }}
        placeholder={t("ticket.chatPlaceholder")}
        rows={2}
        className="resize-none"
      />
      <Button
        type="button"
        size="icon"
        className="shrink-0"
        onClick={handleSend}
        disabled={sendMessageMutation.isPending || !body.trim()}
        aria-label={t("ticket.send")}
      >
        {sendMessageMutation.isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Send className="size-4" />
        )}
      </Button>
    </div>
  );
}