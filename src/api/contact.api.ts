import { api } from "./client";
import type { ContactValues } from "@/schemas/contact.schema";

export const CONTACT_PATH = "/contact";

export async function sendContactMessage(payload: ContactValues) {
  const { data } = await api.post<{ success: boolean; message: string }>(CONTACT_PATH, payload);
  return data;
}