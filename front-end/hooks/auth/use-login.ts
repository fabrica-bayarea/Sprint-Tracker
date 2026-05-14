"use client"

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { login } from "@/lib/actions/auth";
import { LoginFormData, loginSchema } from "../../app/auth/login/login-schema";

export function useLogin() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const result = await login(data.email, data.password, data.rememberMe);

      console.log(result);

      if (result && (result.success || !result.error)) {
        router.push("/dashboard");
      } else {
        toast.error(result?.error || "Erro desconhecido");
      }
    } catch (error) {
      toast.error("Ocorreu um erro inesperado");
    }
  };

  const onErrors = (err: any) => {
    console.log(JSON.stringify(err, null, 2));
  };

  const handleOAuth = (provider: string) => {
    window.location.href = `/api/v1/auth/${provider}`;
  };

  return {
    register,
    handleSubmit: handleSubmit(onSubmit, onErrors),
    control,
    errors,
    isSubmitting,
    handleOAuth,
  };
}