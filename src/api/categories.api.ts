import { api } from "./client";

export interface Category {
  id: number;
  slug: string;
  name: { ar: string; en: string };
  parent_id: number | null;
}

export type CategoryInput = Pick<Category, "slug" | "name"> & { parent_id?: number | null };

export async function fetchCategories() {
  const { data } = await api.get<{ success: boolean; data: Category[] }>("/categories");
  return data.data;
}

export async function createCategory(payload: CategoryInput) {
  await api.post("/categories", payload);
}

export async function updateCategory(id: number, payload: CategoryInput) {
  await api.put(`/categories/${id}`, payload);
}

export async function deleteCategory(id: number) {
  await api.delete(`/categories/${id}`);
}