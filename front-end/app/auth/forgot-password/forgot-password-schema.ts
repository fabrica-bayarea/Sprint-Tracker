import { z } from "zod";

export const forgotPasswordSchema = z.object({
  email: z.string().email("E-mail inválido"),
});

export const verifyCodeSchema = z.object({
  code: z.string().min(1, "Insira o código de verificação"),
});

export const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, "A senha deve ter pelo menos 8 caracteres"),
  confirmNewPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "As senhas não coincidem",
  path: ["confirmNewPassword"],
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type VerifyCodeFormData = z.infer<typeof verifyCodeSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;