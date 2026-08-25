import { createFileRoute } from "@tanstack/react-router";
import { ClipboardList } from "lucide-react";
import { useState } from "react";

import { errorMessage } from "@/api/client";
import type { OrderStatus } from "@/api/order.api";
import { AdminOnly } from "@/components/Guards";
import { EmptyState, ErrorState } from "@/components/StateViews";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAdminOrders } from "@/hooks/useOrder";

export const Route = createFileRoute("/admin/orders/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "إدارة الأوردرات | مكتبة القراء" },
      { name: "description", content: "لوحة إدارة أوردرات كل المستخدمين." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <AdminOnly>
      <AdminOrdersPage />
    </AdminOnly>
  ),
});

const LIMIT = 15;

const STATUS_META: Record<OrderStatus, { label: string; className: string }> = {
  paid: { label: "تم الدفع", className: "bg-green-100 text-green-700 hover:bg-green-100" },
  pending: { label: "بانتظار الدفع", className: "bg-amber-100 text-amber-700 hover:bg-amber-100" },
  failed: {
    label: "فشل الدفع",
    className: "bg-destructive/10 text-destructive hover:bg-destructive/10",
  },
  cancelled: { label: "ملغي", className: "bg-secondary text-muted-foreground hover:bg-secondary" },
};

function formatPrice(amountInPiastres: number) {
  return (amountInPiastres / 100).toFixed(2);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function AdminOrdersPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<OrderStatus | "">("");

  const { data, isLoading, isError, error, refetch } = useAdminOrders({
    page,
    limit: LIMIT,
    status,
  });

  const orders = data?.items ?? [];
  const pagination = data?.pagination;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold md:text-3xl">
            <ClipboardList className="size-6 text-accent" />
            إدارة الأوردرات
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {pagination ? `${pagination.totalCount} أوردر` : "جاري التحميل…"}
          </p>
        </div>

        <Select
          value={status || "all"}
          onValueChange={(value) => {
            setStatus(value === "all" ? "" : (value as OrderStatus));
            setPage(1);
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="كل الحالات" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الحالات</SelectItem>
            <SelectItem value="paid">تم الدفع</SelectItem>
            <SelectItem value="pending">بانتظار الدفع</SelectItem>
            <SelectItem value="failed">فشل الدفع</SelectItem>
            <SelectItem value="cancelled">ملغي</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-14 w-full" />
            ))}
          </div>
        ) : isError ? (
          <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
        ) : !orders.length ? (
          <EmptyState
            variant={status ? "search" : "empty"}
            title="مفيش أوردرات"
            description={status ? "مفيش أوردرات بالحالة دي." : "لسه محدش عمل أوردر."}
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">#</TableHead>
                  <TableHead className="text-right">العميل</TableHead>
                  <TableHead className="text-right">الكتب</TableHead>
                  <TableHead className="text-right">الإجمالي</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">التاريخ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => {
                  const meta = STATUS_META[order.status];
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">#{order.id}</TableCell>
                      <TableCell>
                        {order.user ? (
                          <div>
                            <p className="font-medium">{order.user.name}</p>
                            <p className="text-xs text-muted-foreground">{order.user.email}</p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">مستخدم محذوف</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {order.items.map((item) => `${item.title} ×${item.quantity}`).join("، ")}
                      </TableCell>
                      <TableCell dir="ltr" className="text-muted-foreground">
                        {formatPrice(order.total_amount)} جنيه
                      </TableCell>
                      <TableCell>
                        <Badge className={meta.className}>{meta.label}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(order.created_at)}
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
            السابق
          </Button>
          <span className="text-sm text-muted-foreground">
            صفحة {pagination.currentPage} من {pagination.totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={!pagination.hasNextPage}
            onClick={() => setPage((prev) => prev + 1)}
          >
            التالي
          </Button>
        </div>
      )}
    </div>
  );
}