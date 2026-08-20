import { useMutation } from "@tanstack/react-query";

import { createCheckoutSession } from "@/api/payment.api";

export function useCheckout() {
  return useMutation({
    mutationFn: createCheckoutSession,
    onSuccess: (data) => {
      window.location.href = data.url;
    },
  });
}