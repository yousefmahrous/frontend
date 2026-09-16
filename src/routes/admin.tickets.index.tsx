import { createFileRoute, Link } from "@tanstack/react-router";
import { LifeBuoy } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { errorMessage } from "@/api/client";
import type { TicketStatus } from "@/api/ticket.api";
import { AdminOnly } from "@/components/Guards";
import { EmptyState, ErrorState } from "@/components/StateViews";
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
import { getTicketStatusMeta } from "@/lib/status";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAdminTickets } from "@/hooks/useTicket";

import en from "@/i18n/locales/en.json";
import ar from "@/i18n/locales/ar.json";
import { DEFAULT_LANG, type Lang } from "@/i18n/i18n";

export const Route = createFileRoute("/admin/tickets/")({
  ssr: false,
  head: ({ match }) => {
    const lang = (match.context as { lang?: Lang }).lang ?? DEFAULT_LANG;
    const meta = (lang === "ar" ? ar : en).pageMeta.adminTicketsIndex;
    return {
      meta: [
        { title: meta.title },
        { name: "description", content: meta.description },
        { name: "robots", content: "noindex" },
      ],
    };
  },
  component: () => (
    <AdminOnly>
      <AdminTicketsPage />
    </AdminOnly>
  ),
});

const LIMIT = 15;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" });
}

function AdminTicketsPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<TicketStatus | "">("");

  const { data, isLoading, isError, error, refetch } = useAdminTickets({
    page,
    limit: LIMIT,
    status,
  });

  const tickets = data?.items ?? [];
  const pagination = data?.pagination;
  const statusMeta = getTicketStatusMeta(t);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold md:text-3xl">
            <LifeBuoy className="size-6 text-accent" />
            {t("adminTickets.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {pagination ? t("adminTickets.countLabel", { count: pagination.totalCount }) : t("adminTickets.loading")}
          </p>
        </div>

        <Select
          value={status || "all"}
          onValueChange={(value) => {
            setStatus(value === "all" ? "" : (value as TicketStatus));
            setPage(1);
          }}
        >
          <SelectTrigger className="w-52">
            <SelectValue placeholder={t("common.allStatuses")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.allStatuses")}</SelectItem>
            <SelectItem value="opened">{t("ticket.statusOpened")}</SelectItem>
            <SelectItem value="pending">{t("ticket.statusPending")}</SelectItem>
            <SelectItem value="under_review">{t("ticket.statusUnderReview")}</SelectItem>
            <SelectItem value="resolved">{t("ticket.statusResolved")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-16 w-full" />
            ))}
          </div>
        ) : isError ? (
          <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
        ) : !tickets.length ? (
          <EmptyState
            variant={status ? "search" : "empty"}
            title={t("adminTickets.empty")}
            description={status ? t("adminTickets.noneWithStatus") : t("adminTickets.noneYet")}
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">{t("adminTickets.subject")}</TableHead>
                  <TableHead className="text-right">{t("common.customer")}</TableHead>
                  <TableHead className="text-right">{t("adminTickets.lastMessage")}</TableHead>
                  <TableHead className="text-right">{t("common.status")}</TableHead>
                  <TableHead className="text-right">{t("common.date")}</TableHead>
                  <TableHead className="text-right">{t("adminTickets.action")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => {
                  const meta = statusMeta[ticket.status];
                  return (
                    <TableRow key={ticket.id}>
                      <TableCell className="max-w-56 truncate font-medium" title={ticket.subject}>
                        {ticket.subject}
                      </TableCell>
                      <TableCell>
                        {ticket.user ? (
                          <div>
                            <p className="font-medium">{ticket.user.name}</p>
                            <p className="text-xs text-muted-foreground">{ticket.user.email}</p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">{t("common.deletedUser")}</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-64 truncate text-muted-foreground" title={ticket.last_message?.body}>
                        {ticket.last_message?.body ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge className={meta.className}>{meta.label}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(ticket.updated_at)}</TableCell>
                      <TableCell>
                        <Button asChild size="sm" variant="outline">
                          <Link to="/tickets/$id" params={{ id: String(ticket.id) }}>
                            {t("adminTickets.view")}
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            disabled={!pagination.hasPreviousPage}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          >
            {t("adminTickets.prev")}
          </Button>
          <span className="text-sm text-muted-foreground">
            {t("adminTickets.pageOf", { current: pagination.currentPage, total: pagination.totalPages })}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={!pagination.hasNextPage}
            onClick={() => setPage((prev) => prev + 1)}
          >
            {t("adminTickets.next")}
          </Button>
        </div>
      )}
    </div>
  );
}