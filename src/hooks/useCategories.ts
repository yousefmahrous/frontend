import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createCategory,
  deleteCategory,
  fetchCategories,
  updateCategory,
  type CategoryInput,
} from "@/api/categories.api";

const KEY = ["categories"];

export function useCategories() {
  return useQuery({ queryKey: KEY, queryFn: fetchCategories, staleTime: 60_000 });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => void qc.invalidateQueries({ queryKey: KEY });
}

export function useCreateCategory() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: (p: CategoryInput) => createCategory(p), onSuccess: invalidate });
}

export function useUpdateCategory() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, ...p }: CategoryInput & { id: number }) => updateCategory(id, p),
    onSuccess: invalidate,
  });
}

export function useDeleteCategory() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: (id: number) => deleteCategory(id), onSuccess: invalidate });
}