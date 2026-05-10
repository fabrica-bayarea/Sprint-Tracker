import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { verifyCodeResetPassword, resetPassword } from "@/lib/actions/auth";
import { ResetPasswordFormData, resetPasswordSchema, VerifyCodeFormData, verifyCodeSchema } from "@/app/auth/forgot-password/forgot-password-schema";

export function useVerifyReset() {
  const router = useRouter();
  const [step, setStep] = useState<'verify' | 'reset'>('verify');

  const verifyForm = useForm<VerifyCodeFormData>({
    resolver: zodResolver(verifyCodeSchema),
    defaultValues: { code: "" },
  });

  const resetForm = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: "", confirmNewPassword: "" },
  });

  const onVerify = async (data: VerifyCodeFormData) => {
    const result = await verifyCodeResetPassword(data.code);
    if (result.success) {
      setStep('reset');
      toast.success("Código verificado com sucesso! Agora defina sua nova senha.");
    } else {
      toast.error(result.error || "Código inválido");
    }
  };

  const onReset = async (data: ResetPasswordFormData) => {
    const result = await resetPassword(data.newPassword, data.confirmNewPassword);
    if (result.success) {
      toast.success("Senha redefinida com sucesso!");
      router.push("/auth/login");
    } else {
      toast.error(result.error || "Erro ao redefinir senha");
    }
  };

  return {
    step,
    verifyForm,
    resetForm,
    onVerify: verifyForm.handleSubmit(onVerify),
    onReset: resetForm.handleSubmit(onReset),
  };
}