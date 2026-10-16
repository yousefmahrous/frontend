import { api, resetCsrfToken } from "./client";

export type UserRole = "customer" | "admin";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export function roleLabel(role: UserRole | undefined): string {
  return role === "admin" ? "أدمن" : "عميل";
}

export async function signup(payload: { name: string; email: string; password: string }) {
  const { data } = await api.post<{ message: string; user: AppUser }>("/auth/signup", payload);
  return data;
}

export interface LoginSuccess {
  message: string;
  user: AppUser;
}

export interface LoginRequires2fa {
  requires2fa: true;
}

export type LoginResponse = LoginSuccess | LoginRequires2fa;

export function needs2fa(res: LoginResponse): res is LoginRequires2fa {
  return "requires2fa" in res && res.requires2fa;
}

export async function login(payload: { email: string; password: string }) {
  const { data } = await api.post<LoginResponse>("/auth/login", payload);
  resetCsrfToken();
  return data;
}

export async function loginWith2fa(payload: { code: string }) {
  const { data } = await api.post<LoginSuccess>("/auth/login/2fa", payload);
  resetCsrfToken();
  return data;
}

export async function logout() {
  const { data } = await api.post<{ message?: string }>("/auth/logout", {});
  resetCsrfToken();
  return data;
}

export async function getMe() {
  const { data } = await api.get<{ success: boolean; user: AppUser }>("/auth/me");
  return data.user;
}

export async function verifyEmail(token: string) {
  const { data } = await api.get<{ message: string }>("/auth/verify-email", {
    params: { token },
  });
  return data;
}

export async function resendVerification(payload: { email: string }) {
  const { data } = await api.post<{ message: string }>("/auth/resend-verification", payload);
  return data;
}

export async function forgotPassword(payload: { email: string }) {
  const { data } = await api.post<{ message: string }>("/auth/forgot-password", payload);
  return data;
}

export async function resetPassword(payload: { token: string; newPassword: string }) {
  const { data } = await api.post<{ message: string }>("/auth/reset-password", payload);
  return data;
}

export async function changePassword(payload: { oldPassword: string; newPassword: string }) {
  const { data } = await api.post<{ message: string }>("/auth/change-password", payload);
  return data;
}

export async function getTwofaStatus() {
  const { data } = await api.get<{ enabled: boolean }>("/auth/2fa/status");
  return data.enabled;
}

export async function startTwofaSetup() {
  const { data } = await api.post<{ secret: string; qrDataUrl: string }>("/auth/2fa/setup", {});
  return data;
}

export async function enableTwofa(payload: { code: string }) {
  const { data } = await api.post<{ enabled: true }>("/auth/2fa/enable", payload);
  return data;
}

export async function disableTwofa(payload: { password: string; code: string }) {
  const { data } = await api.post<{ enabled: false }>("/auth/2fa/disable", payload);
  return data;
}
