import axios, { AxiosError } from "axios";

export const API_URL =
  (import.meta.env['VITE_API_URL'] as string | undefined) ?? "http://localhost:3000/api/v1";

export const SOCKET_URL = API_URL.replace(/\/api\/v1\/?$/, "");

export const BOOKS_PATH = "/books";

export const BOOKS_UPDATED_EVENT = "books_updated";

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});


let cachedCsrfToken: string | null = null;


const SAFE_METHODS = new Set(["get", "head", "options"]);

async function fetchCsrfToken(): Promise<string> {
  const response = await axios.get<{ csrfToken: string }>(`${API_URL}/csrf-token`, {
    withCredentials: true,
  });
  cachedCsrfToken = response.data.csrfToken;
  return cachedCsrfToken;
}

api.interceptors.request.use(async (config) => {
  const method = config.method?.toLowerCase() ?? "get";
  if (SAFE_METHODS.has(method)) return config;

  const token = cachedCsrfToken ?? (await fetchCsrfToken());
  config.headers.set("x-csrf-token", token);
  return config;
});


export type FieldErrors = Record<string, string>;

export class ApiError extends Error {
  status: number;
  fieldErrors?: FieldErrors | undefined;
  code?: string | undefined;
  isNetwork: boolean;

  constructor(
    message: string,
    status: number,
    fieldErrors?: FieldErrors,
    isNetwork = false,
    code?: string,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
    this.isNetwork = isNetwork;
    this.code = code;
  }
}

function extractFieldErrors(data: unknown): FieldErrors | undefined {
  if (!data || typeof data !== "object") return undefined;
  const raw = (data as Record<string, unknown>)['errors'];
  if (!raw) return undefined;
  const out: FieldErrors = {};

  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (item && typeof item === "object") {
        const rec = item as Record<string, unknown>;
        const path = Array.isArray(rec['path']) ? (rec['path'] as unknown[])[(rec['path'] as unknown[]).length - 1] : rec['path'] ?? rec['field'];
        if (typeof path === "string" && typeof rec['message'] === "string") out[path] = rec['message'];
      }
    }
  } else if (typeof raw === "object") {
    for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
      if (typeof value === "string") out[key] = value;
      else if (Array.isArray(value) && typeof value[0] === "string") out[key] = value[0] as string;
      else if (value && typeof value === "object") {
        const msg = (value as Record<string, unknown>)['message'];
        if (typeof msg === "string") out[key] = msg;
      }
    }
  }

  return Object.keys(out).length ? out : undefined;
}

export const authEvents = {
  onUnauthorized: null as null | (() => void),
};

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (!error.response) {
      return Promise.reject(new ApiError("تعذر الاتصال بالسيرفر", 0, undefined, true));
    }

    const status = error.response.status;
    const data = error.response.data as Record<string, unknown> | undefined;
    let message = typeof data?.['message'] === "string" ? (data['message'] as string) : "";

    if (!message) {
      if (status === 401) message = "انتهت الجلسة، سجّل دخول من جديد";
      else if (status === 403) message = "غير مصرح لك";
      else if (status === 429) message = "طلبات كتير، حاول تاني بعد شوية";
      else if (status === 404) message = "غير موجود";
      else message = "حصل خطأ غير متوقع";
    }

    const isMeCheck = error.config?.url?.includes("/auth/me");
    if (status === 401 && !isMeCheck) authEvents.onUnauthorized?.();

    const code = typeof data?.["code"] === "string" ? (data["code"] as string) : undefined;

    return Promise.reject(new ApiError(message, status, extractFieldErrors(data), false, code));
  },
);

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return "حصل خطأ غير متوقع";
}

export function resetCsrfToken() {
  cachedCsrfToken = null;
}