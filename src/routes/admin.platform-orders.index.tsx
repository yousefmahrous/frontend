import { createFileRoute } from "@tanstack/react-router";

import { AdminOnly } from "@/components/Guards";
import { OrdersBoard } from "@/components/vendor/OrdersBoard";

export const Route = createFileRoute("/admin/platform-orders/")({
  ssr: false,
  component: () => (
    <AdminOnly>
      <OrdersBoard platform />
    </AdminOnly>
  ),
});