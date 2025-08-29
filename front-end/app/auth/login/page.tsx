"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link";

import { login } from "@/lib/actions/auth";
import { useNotificationStore } from '@/lib/stores/notification';

import AuthFormContainer from "@/components/ui/authFormContainer";

import { AuthInput, AuthButton, Image } from "@/components/ui";

import parentStyles from "../style.module.css";
import styles from "./style.module.css";

export default function Home() {
  const router = useRouter()
  const { showNotification } = useNotificationStore()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const result = await login(email, password, rememberMe);

    if (result.success) {
      router.push("/dashboard");
      router.refresh();
    } else {
      showNotification(result.error || "Erro desconhecido", 'failed')
    }
  }

  return (
    <>
      <AuthFormContainer title="ACESSE SUA CONTA">
        <form className={parentStyles.form} onSubmit={handleSubmit}>
          <AuthInput
            onChange={(e) => setEmail(e.target.value)}
            type="text"
            placeholder="Nome de usuário ou e-mail"
            value={email}
          />
          <AuthInput
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Senha"
            value={password}
          />
          <AuthInput
              type="checkbox"
              checked={rememberMe}
              onChange={() => setRememberMe(!rememberMe)}
              label="Lembrar de mim"
          />
          <AuthButton type="submit">Entrar</AuthButton>
          <div className={styles.links}>
            <Link href="/auth/forgot-password" className={styles.forgotPasswordLink}>Esqueceu sua senha?</Link>
            <Link href="/auth/register" className={styles.createAccountLink}>Criar uma conta.</Link>
          </div>
        </form>
        <div className={styles.divider}><span>Conecte-se também com:</span></div>
        <div className={styles.oauthButtons}>
          <AuthButton type="button" onClick={() => window.location.href = `/api/v1/auth/google`} className={styles.oauthCircleButton} aria-label="Entrar com Google">
            <Image src="/images/google-icon.png" alt="Google" width={28} height={28} />
          </AuthButton>
          <AuthButton type="button" onClick={() => window.location.href = `/api/v1/auth/microsoft`} className={styles.oauthCircleButton} aria-label="Entrar com Microsoft">
            <Image src="/images/microsoft-icon.png" alt="Microsoft" width={28} height={28} />
          </AuthButton>
        </div>
      </AuthFormContainer>
    </>
  );
}
