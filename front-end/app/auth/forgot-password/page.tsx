"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";

import { forgotPassword } from "@/lib/actions/auth";
import { useWarningStore } from '@/lib/stores/warning';

import AuthFormContainer from "@/components/ui/authFormContainer";
import AuthInput from "@/components/ui/authInput";
import AuthButton from "@/components/ui/authButton";

import styles from "./style.module.css";

export default function ForgotPassword() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { showWarning } = useWarningStore()

  async function handleSubmit(e: React.FormEvent) {
      e.preventDefault()

      if (!email.trim()) {
        showWarning("Por favor, insira seu e-mail", 'failed')
        return
      }

      setIsLoading(true)

      try {
        const result = await forgotPassword(email);

        if (result.success) {
          showWarning("E-mail enviado com sucesso! Verifique sua caixa de entrada.", 'success')
          router.push("/auth/forgot-password/verify");
          router.refresh();
        } else {
          showWarning(result.error || "Erro desconhecido", 'failed')
        }
      } finally {
        setIsLoading(false)
      }
    }
  return (
    <>
      <AuthFormContainer title="ESQUECEU SUA SENHA?" showBackToLogin={true}>
      <div className={styles.forgotPasswordText}>
        <p>
          Para redefinir sua senha, insira seu e-mail cadastrado e clique em &quot;Enviar e-mail&quot;. Você receberá um e-mail
          com instruções para a redefinição.
        </p>
      </div>
      <form className={styles.form} onSubmit={handleSubmit}>
        <AuthInput
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="Insira o seu email"
          value={email}
        />
        <AuthButton type="submit" disabled={isLoading}>
          {isLoading ? "Enviando..." : "Enviar e-mail"}
        </AuthButton>
      </form>
    </AuthFormContainer>
    </>
  );
}
