import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { forgotPassword } from "@/lib/actions/auth";
import { ForgotPasswordFormData, forgotPasswordSchema } from "@/app/auth/forgot-password/forgot-password-schema";

export function useForgotPassword() {
  const router = useRouter();

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    const result = await forgotPassword(data.email);

    if (result.success) {
      toast.success("E-mail enviado com sucesso! Verifique sua caixa de entrada.");
      router.push("/auth/forgot-password/verify");
      router.refresh();
    } else {
      toast.error(result.error || "Erro desconhecido");
    }
  };

  return {
    ...form,
    onSubmit: form.handleSubmit(onSubmit),
  };
}