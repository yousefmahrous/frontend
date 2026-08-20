import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";

import { Protected } from "@/components/Guards";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/checkout/success")({
  ssr: false,
  head: () => ({
    meta: [{ title: "تم الدفع | مكتبة القراء" }],
  }),
  component: () => (
    <Protected>
      <SuccessPage />
    </Protected>
  ),
});

function SuccessPage() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-4 py-20 text-center">
      <CheckCircle2 className="size-16 text-green-600" />
      <h1 className="text-2xl font-extrabold">تم الدفع بنجاح</h1>
      <p className="text-muted-foreground">
        شكرًا ليك! أوردرك جاري تأكيده دلوقتي. لو محتاج تتابع حالته، هتلاقيه في حسابك.
      </p>
      <Button asChild>
        <Link to="/books">تصفح المزيد من الكتب</Link>
      </Button>
    </div>
  );
}