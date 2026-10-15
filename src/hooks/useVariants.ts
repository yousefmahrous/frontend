import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { VariantPayload } from "@/api/products.api";
import { addVariant, deleteVariant, updateVariant, type VariantScope } from "@/api/variants.api";
import { productsKeys } from "@/hooks/useProducts";

export function useVariantActions(scope: VariantScope, productId: string) {
  const queryClient = useQueryClient();
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: productsKeys.all });
    void queryClient.invalidateQueries({ queryKey: ["vendor", "products"] });
  };

  const add = useMutation({
    mutationFn: (payload: VariantPayload) => addVariant(scope, productId, payload),
    onSuccess: refresh,
  });
  const update = useMutation({
    mutationFn: ({ variantId, payload }: { variantId: number; payload: VariantPayload }) =>
      updateVariant(scope, productId, variantId, payload),
    onSuccess: refresh,
  });
  const remove = useMutation({
    mutationFn: (variantId: number) => deleteVariant(scope, productId, variantId),
    onSuccess: refresh,
  });

  return { add, update, remove };
}