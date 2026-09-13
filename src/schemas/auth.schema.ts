import { z } from "zod";
import type { TFunction } from "i18next";

export const createLoginSchema = (t: TFunction) =>
  z.object({
    email: z.string().trim().email(t("validation.email.invalid")),
    password: z.string().min(6, t("validation.password.min", { count: 6 })),
  });

export const createSignupSchema = (t: TFunction) =>
  z.object({
    name: z.string().trim().min(3, t("validation.name.min", { count: 3 })),
    email: z.string().trim().email(t("validation.email.invalid")),
    password: z.string().min(6, t("validation.password.min", { count: 6 })),
  });

export const createForgotPasswordSchema = (t: TFunction) =>
  z.object({
    email: z.string().trim().email(t("validation.email.invalid")),
  });

export const createResendVerificationSchema = (t: TFunction) =>
  z.object({
    email: z.string().trim().email(t("validation.email.invalid")),
  });

export const createResetPasswordSchema = (t: TFunction) =>
  z.object({
    newPassword: z.string().min(6, t("validation.password.min", { count: 6 })),
  });

export const createChangePasswordSchema = (t: TFunction) =>
  z.object({
    oldPassword: z.string().min(6, t("validation.currentPassword.min", { count: 6 })),
    newPassword: z.string().min(6, t("validation.newPassword.min", { count: 6 })),
  });

export type LoginValues = z.infer<ReturnType<typeof createLoginSchema>>;
export type SignupValues = z.infer<ReturnType<typeof createSignupSchema>>;
export type ForgotPasswordValues = z.infer<ReturnType<typeof createForgotPasswordSchema>>;
export type ResendVerificationValues = z.infer<ReturnType<typeof createResendVerificationSchema>>;
export type ResetPasswordValues = z.infer<ReturnType<typeof createResetPasswordSchema>>;
export type ChangePasswordValues = z.infer<ReturnType<typeof createChangePasswordSchema>>;