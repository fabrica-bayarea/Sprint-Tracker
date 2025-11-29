"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Eye, EyeOff } from "lucide-react";

import { register } from "@/lib/actions/auth";
import { useWarningStore } from '@/lib/stores/warning';

import AuthFormContainer from "@/components/ui/authFormContainer";
import AuthInput from "@/components/ui/authInput";
import AuthButton from "@/components/ui/authButton";

import parentStyles from "../style.module.css";
import styles from "./style.module.css";

export default function Register() {
  const router = useRouter()
  const { showWarning } = useWarningStore()
  const [fullname, setFullName] = useState("")
  const [userName, setUserName] = useState("")
  const [email, setEmail] = useState("")
  const [confirmEmail, setconfirmEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setconfirmConfirmPassword] = useState("")
  const [isSuccess, setIsSuccess] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  function getPasswordRequirements(password: string) {
    return {
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[^A-Za-z0-9]/.test(password),
    };
  }
  const passwordRequirements = getPasswordRequirements(password);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!agreeTerms) {
      showWarning("Você precisa concordar com os termos de serviço.", 'failed')
      return;
    }

    if (confirmEmail != email) {
      showWarning("E-mails não coincidem", 'failed');
      return;
    }
    if (confirmPassword != password) {
      showWarning("Senhas não coincidem", 'failed')
      return;
    }
    const result = await register(fullname, userName, email, password);

    if (result.success) {
      setIsSuccess(true);
      await new Promise((resolve) => setTimeout(resolve, 3000));

      router.push("/dashboard");
      router.refresh();
    } else {
      showWarning(result.error || "Erro desconhecido", 'failed')
    }
  }

  if (isSuccess) {
    return (
        <AuthFormContainer title="">
          <div className={styles.successDiv}>
            <CheckCircle size={64} color="#fff" />
            <div className={styles.title}>
              CONTA CRIADA COM SUCESSO!
            </div>
            <div style={{ color: '#fff', textAlign: 'center', fontSize: 15, marginTop: 8 }}>
              Aguarde!<br />Estamos redirecionando você para sua conta!
            </div>
          </div>
        </AuthFormContainer>
      );
  }

  return (
    <>
      <AuthFormContainer title="CRIE SUA CONTA" showBackToLogin={true}>
        <form className={parentStyles.form} onSubmit={handleSubmit}>
          <AuthInput
            onChange={(e) => setFullName(e.target.value)}
            type="text"
            placeholder="Nome completo"
            value={fullname}
          />
          <AuthInput
            onChange={(e) => setUserName(e.target.value)}
            type="text"
            placeholder="Nome de usuário"
            value={userName}
          />
          <AuthInput
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="E-mail"
            value={email}
          />
          <AuthInput
            onChange={(e) => setconfirmEmail(e.target.value)}
            type="email"
            placeholder="Confirme o e-mail"
            value={confirmEmail}
          />

          <div className={styles.passwordWrapper}>
            <AuthInput
              onChange={(e) => setPassword(e.target.value)}
              type={showPassword ? "text" : "password"}
              placeholder="Senha"
              value={password}
            />
            <button
              type="button"
              className={styles.eyeButton}
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1} 
            >
              {showPassword ? <EyeOff size={20} color="#888" /> : <Eye size={20} color="#888" />}
            </button>
          </div>

          <div className={styles.passwordRequirements}>
             <div className={`${styles.requirementItem} ${password ? (passwordRequirements.hasUppercase ? styles.requirementMet : styles.requirementNotMet) : styles.requirementNeutral}`}>
              {passwordRequirements.hasUppercase ? '✔' : '✖'} Pelo menos 1 letra maiúscula
            </div>
            <div className={`${styles.requirementItem} ${password ? (passwordRequirements.hasLowercase ? styles.requirementMet : styles.requirementNotMet) : styles.requirementNeutral}`}>
              {passwordRequirements.hasLowercase ? '✔' : '✖'} Pelo menos 1 letra minúscula
            </div>
            <div className={`${styles.requirementItem} ${password ? (passwordRequirements.hasNumber ? styles.requirementMet : styles.requirementNotMet) : styles.requirementNeutral}`}>
              {passwordRequirements.hasNumber ? '✔' : '✖'} Pelo menos 1 número
            </div>
            <div className={`${styles.requirementItem} ${password ? (passwordRequirements.hasSpecial ? styles.requirementMet : styles.requirementNotMet) : styles.requirementNeutral}`}>
              {passwordRequirements.hasSpecial ? '✔' : '✖'} Pelo menos 1 caractere especial
            </div>
          </div>

          <div className={styles.passwordWrapper}>
            <AuthInput
              onChange={(e) => setconfirmConfirmPassword(e.target.value)}
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirme a senha"
              value={confirmPassword}
            />
             <button
              type="button"
              className={styles.eyeButton}
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              tabIndex={-1}
            >
              {showConfirmPassword ? <EyeOff size={20} color="#888" /> : <Eye size={20} color="#888" />}
            </button>
          </div>

          <AuthInput
            type="checkbox"
            checked={agreeTerms}
            onChange={() => setAgreeTerms(!agreeTerms)}
            label="Concordo com os termos de serviço."
          />
          <AuthButton type="submit">Cadastrar</AuthButton>
        </form>
      </AuthFormContainer>
    </>
  );
}