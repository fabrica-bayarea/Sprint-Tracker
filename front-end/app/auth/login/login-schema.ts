import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Campo obrigatório"),
  password: z.string().min(1, "Campo obrigatório"),
  rememberMe: z.boolean(),
});

export type LoginFormData = z.infer<typeof loginSchema>;