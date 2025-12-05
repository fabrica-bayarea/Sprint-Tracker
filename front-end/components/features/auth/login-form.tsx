"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link";

import { login, loginLdap } from "@/lib/actions/auth";
import { useWarningStore } from '@/lib/stores/warning';

import AuthFormContainer from "@/components/ui/authFormContainer";

import { AuthInput, AuthButton, Image } from "@/components/ui";

import styles from "./style.module.css";

type LoginMethod = 'standard' | 'ldap';

interface LoginMethodToggleProps {
  method: LoginMethod;
  setMethod: (method: LoginMethod) => void;
}

function LoginMethodToggle({ method, setMethod }: LoginMethodToggleProps) {
  return (
    <div className={styles.methodToggleContainer}>
      <button
        type="button"
        onClick={() => setMethod('standard')}
        className={`${styles.methodToggleButton} ${method === 'standard' ? styles.methodToggleButtonActive : ''}`}
      >
        Padrão
      </button>
      <button
        type="button"
        onClick={() => setMethod('ldap')}
        className={`${styles.methodToggleButton} ${method === 'ldap' ? styles.methodToggleButtonActive : ''}`}
      >
        LDAP
      </button>
    </div>
  );
}

interface OAuthLoginProps {
  isGoogleEnabled: boolean;
  isMicrosoftEnabled: boolean;
  isProduction: boolean;
  baseUrlApi: string;
}

function OAuthLogin({ 
  isGoogleEnabled, 
  isMicrosoftEnabled, 
  isProduction, 
  baseUrlApi 
}: OAuthLoginProps) {
  if (!isGoogleEnabled && !isMicrosoftEnabled) return null;

  return (
    <>
      <div className={styles.divider}><span>Conecte-se também com:</span></div>
      <div className={styles.oauthButtons}>
        {isGoogleEnabled && (
          <AuthButton 
            type="button" 
            onClick={() => {
              if (isProduction) {
                window.location.href = `/api/v1/auth/google`
                return
              }else{
                window.location.href = `${baseUrlApi}/v1/auth/google`
              }
            }} 
            className={styles.oauthCircleButton} 
            aria-label="Entrar com Google"
          >
            <Image src="/images/google-icon.png" alt="Google" width={28} height={28} />
          </AuthButton>
        )}
        {isMicrosoftEnabled && (
          <AuthButton 
            type="button"
            onClick={() => {
              if (isProduction) {
                window.location.href = `/api/v1/auth/microsoft`
                return
              }else{
                window.location.href = `${baseUrlApi}/v1/auth/microsoft`
              }
            }}
            className={styles.oauthCircleButton} 
            aria-label="Entrar com Microsoft"
          >
            <Image src="/images/microsoft-icon.png" alt="Microsoft" width={28} height={28} />
          </AuthButton>
        )}
      </div>
    </>
  );
}

interface LoginFormProps {
  isLdapEnabled: boolean;
  isGoogleEnabled: boolean;
  isMicrosoftEnabled: boolean;
  isProduction: boolean;
  baseUrlApi: string;
}

export default function LoginForm({
  isLdapEnabled, 
  isGoogleEnabled, 
  isMicrosoftEnabled,
  isProduction,
  baseUrlApi
}: LoginFormProps) {
  const router = useRouter()
  const { showWarning } = useWarningStore()
  
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('standard')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const result = loginMethod === 'standard' 
      ? await login(email, password, rememberMe)
      : await loginLdap(email, password);

    if (result.success) {
      router.push("/dashboard");
      router.refresh();
    } else {
      showWarning(result.error || "Erro desconhecido", 'failed')
    }
  }

  return (
    <AuthFormContainer title="ACESSE SUA CONTA">
      {isLdapEnabled && (
        <LoginMethodToggle method={loginMethod} setMethod={setLoginMethod} />
      )}
      
      <form className={styles.form} onSubmit={handleSubmit}>
        <AuthInput
          onChange={(e) => setEmail(e.target.value)}
          type="text"
          placeholder={loginMethod === 'ldap' ? "Matrícula" : "Nome de usuário ou e-mail"}
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
      
      <OAuthLogin
        isGoogleEnabled={isGoogleEnabled} 
        isMicrosoftEnabled={isMicrosoftEnabled} 
        isProduction={isProduction}
        baseUrlApi={baseUrlApi}
      />
    </AuthFormContainer>
  );
}
