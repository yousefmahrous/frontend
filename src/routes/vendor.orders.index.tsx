import { createFileRoute } from "@tanstack/react-router";

import { VendorOnly } from "@/components/Guards";
import { OrdersBoard } from "@/components/vendor/OrdersBoard";

export const Route = createFileRoute("/vendor/orders/")({
  ssr: false,
  component: () => (
    <VendorOnly>
      <OrdersBoard />
    </VendorOnly>
  ),
});