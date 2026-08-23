import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Clock, Loader2, XCircle } from "lucide-react";

import { Protected } from "@/components/Guards";
import { Button } from "@/components/ui/button";
import { useLatestOrder, useOrder } from "@/hooks/useOrder";

export const Route = createFileRoute("/checkout/success")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({
    order_id:
      typeof search["order_id"] === "string" ? Number(search["order_id"]) : undefined,
  }),
  head: () => ({
    meta: [{ title: "حالة الدفع | مكتبة القراء" }],
  }),
  component: () => (
    <Protected>
      <SuccessPage />
    </Protected>
  ),
});

function SuccessPage() {
  const { order_id } = Route.useSearch();

  const byId = useOrder(order_id);
  const useFallback = !order_id || byId.isError;
  const fallback = useLatestOrder(useFallback);

  const order = useFallback ? fallback.data : byId.data;
  const isLoading = useFallback ? fallback.isLoading : byId.isLoading;
  const isError = useFallback ? fallback.isError : byId.isError;

  if (isError) {
    return (
      <StatusView
        icon={<XCircle className="size-16 text-destructive" />}
        title="مش لاقيين الأوردر ده"
        description="اتأكد إنك جاي من رابط دفع صحيح، أو راجع أوردراتك من حسابك."
      />
    );
  }

  if (isLoading || !order) {
    return (
      <StatusView
        icon={<Loader2 className="size-16 animate-spin text-muted-foreground" />}
        title="بنتأكد من حالة الدفع..."
        description="لحظات وهنعرض لك النتيجة."
      />
    );
  }

  if (order.status === "paid") {
    return (
      <StatusView
        icon={<CheckCircle2 className="size-16 text-green-600" />}
        title="تم الدفع بنجاح"
        description="شكرًا ليك! أوردرك اتأكد وهيتم تجهيزه."
      />
    );
  }

  if (order.status === "pending") {
    return (
      <StatusView
        icon={<Clock className="size-16 animate-pulse text-amber-500" />}
        title="بنتأكد من الدفع"
        description="عملية الدفع وصلتنا وبنستنى تأكيد نهائي من بوابة الدفع، ده بياخد كام ثانية عادةً."
      />
    );
  }

  return (
    <StatusView
      icon={<XCircle className="size-16 text-destructive" />}
      title="الدفع مكملش"
      description="يبدو إن العملية اتلغت أو مكتملتش. ممكن ترجع للعربية وتحاول تاني."
      showCartLink
    />
  );
}

function StatusView({
  icon,
  title,
  description,
  showCartLink,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  showCartLink?: boolean;
}) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-4 py-20 text-center">
      {icon}
      <h1 className="text-2xl font-extrabold">{title}</h1>
      <p className="text-muted-foreground">{description}</p>
      <Button asChild>
        <Link to={showCartLink ? "/cart" : "/books"}>
          {showCartLink ? "الرجوع للعربية" : "تصفح المزيد من الكتب"}
        </Link>
      </Button>
    </div>
  );
}