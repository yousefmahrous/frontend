import { createFileRoute, Link } from "@tanstack/react-router";
import { XCircle } from "lucide-react";

import { Protected } from "@/components/Guards";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/checkout/cancel")({
  ssr: false,
  head: () => ({
    meta: [{ title: "تم إلغاء الدفع | مكتبة القراء" }],
  }),
  component: () => (
    <Protected>
      <CancelPage />
    </Protected>
  ),
});

function CancelPage() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-4 py-20 text-center">
      <XCircle className="size-16 text-destructive" />
      <h1 className="text-2xl font-extrabold">اتلغى الدفع</h1>
      <p className="text-muted-foreground">مفيش مشكلة، ممكن ترجع وتحاول تاني وقت ما تحب.</p>
      <Button asChild>
        <Link to="/cart">الرجوع للعربية</Link>
      </Button>
    </div>
  );
}