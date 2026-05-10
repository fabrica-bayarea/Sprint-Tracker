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
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    const result = await login(data.email, data.password, data.rememberMe);

    if (result.success) {
      router.push("/dashboard");
    } else {
      toast.error(result.error || "Erro desconhecido");
    }
  };

  const handleOAuth = (provider: string) => {
    window.location.href = `/api/v1/auth/${provider}`;
  };

  return {
    register,
    handleSubmit: handleSubmit(onSubmit),
    control,
    errors,
    handleOAuth,
  };
}