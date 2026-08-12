import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("الإيميل غير صحيح"),
  password: z.string().min(6, "كلمة المرور لازم 6 أحرف على الأقل"),
});

export const signupSchema = z.object({
  name: z.string().trim().min(3, "الاسم لازم 3 أحرف على الأقل"),
  email: z.string().trim().email("الإيميل غير صحيح"),
  password: z.string().min(6, "كلمة المرور لازم 6 أحرف على الأقل"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("الإيميل غير صحيح"),
});

export const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, "كلمة المرور لازم 6 أحرف على الأقل"),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(6, "كلمة المرور الحالية لازم 6 أحرف على الأقل"),
  newPassword: z.string().min(6, "كلمة المرور الجديدة لازم 6 أحرف على الأقل"),
});

export type LoginValues = z.infer<typeof loginSchema>;
export type SignupValues = z.infer<typeof signupSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;