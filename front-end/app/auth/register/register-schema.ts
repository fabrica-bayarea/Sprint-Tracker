import { z } from "zod";

export const registerSchema = z.object({
  fullname: z.string().min(3, "Nome muito curto"),
  userName: z.string().min(3, "Username muito curto"),
  email: z.string().email("E-mail inválido"),
  confirmEmail: z.string().email("Confirme o e-mail"),
  password: z.string()
    .min(8, "Mínimo 8 caracteres")
    .regex(/[A-Z]/, "Falta letra maiúscula")
    .regex(/[a-z]/, "Falta letra minúscula")
    .regex(/[0-9]/, "Falta um número")
    .regex(/[^A-Za-z0-9]/, "Falta caractere especial"),
  confirmPassword: z.string(),
  agreeTerms: z.boolean().refine((val) => val === true, "Aceite os termos"),
}).refine((data) => data.email === data.confirmEmail, {
  message: "Os e-mails não coincidem",
  path: ["confirmEmail"],
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

export type RegisterFormData = z.infer<typeof registerSchema>;