"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";

import { verifyCodeResetPassword, resetPassword } from "@/lib/actions/auth";

import AuthFormContainer from "@/components/ui/authFormContainer";
import AuthInput from "@/components/ui/authInput";
import AuthButton from "@/components/ui/authButton";

import styles from "./style.module.css";
import { toast } from "sonner";

export default function VerifyCodeResetPassword() {
  const router = useRouter()
  const [code, setCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmNewPassword, setconfirmNewPassword] = useState("")
  const [step, setStep] = useState<'verify' | 'reset'>('verify')
  const [isLoading, setIsLoading] = useState(false)

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault()

    if (!code.trim()) {
      toast.error("Por favor, insira o código de verificação")
      return
    }

    setIsLoading(true)

    try {
      const result = await verifyCodeResetPassword(code);

      if (result.success) {
        setStep('reset')
        toast.success("Código verificado com sucesso! Agora defina sua nova senha.")
      } else {
        toast.error(result.error || "Código inválido")
      }
    } finally {
      setIsLoading(false)
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()

    if (!newPassword.trim()) {
      toast.error("Por favor, insira a nova senha")
      return
    }

    if (newPassword !== confirmNewPassword) {
      toast.error("As senhas não coincidem")
      return
    }

    if (newPassword.length < 8) {
      toast.error("A senha deve ter pelo menos 8 caracteres")
      return
    }

    setIsLoading(true)

    try {
      const result = await resetPassword(newPassword, confirmNewPassword);

      if (result.success) {
        toast.success("Senha redefinida com sucesso!")
        router.push("/auth/login");
      } else {
        toast.error(result.error || "Erro ao redefinir senha")
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (step === 'verify') {
    return (
      <AuthFormContainer title="VERIFICAR CÓDIGO" showBackToLogin={true}>
        <div className={styles.verifyText}>
          <p>
            Digite o código de verificação enviado para seu e-mail para continuar com a redefinição da senha.
          </p>
        </div>
        <form className={styles.form} onSubmit={handleVerifyCode}>
          <AuthInput
            onChange={(e) => setCode(e.target.value)}
            type="text"
            placeholder="Código de verificação"
            value={code}
            maxLength={8}
          />
          <AuthButton type="submit" disabled={isLoading}>
            {isLoading ? "Verificando..." : "Verificar código"}
          </AuthButton>
        </form>
      </AuthFormContainer>
    );
  }

  return (
    <AuthFormContainer title="REDEFINIR SENHA" showBackToLogin={true}>
      <div className={styles.resetText}>
        <p>
          Agora você pode definir uma nova senha para sua conta.
        </p>
      </div>
      <form className={styles.form} onSubmit={handleResetPassword}>
        <AuthInput
          onChange={(e) => setNewPassword(e.target.value)}
          type="password"
          placeholder="Nova senha"
          value={newPassword}
        />
        <AuthInput
          onChange={(e) => setconfirmNewPassword(e.target.value)}
          type="password"
          placeholder="Confirmar nova senha"
          value={confirmNewPassword}
        />
        <AuthButton type="submit" disabled={isLoading}>
          {isLoading ? "Redefinindo..." : "Redefinir senha"}
        </AuthButton>
      </form>
    </AuthFormContainer>
  );
}
