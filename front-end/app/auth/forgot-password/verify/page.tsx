"use client"

import Link from "next/link";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";
import { useVerifyReset } from "@/hooks/auth/use-verify-reset";

export default function VerifyCodeResetPassword() {
  const { step, verifyForm, resetForm, onVerify, onReset } = useVerifyReset();

  return (
    <main className="flex min-h-screen w-full bg-white">
      <div className="relative hidden w-[60%] flex-col justify-between bg-gradient-to-br from-[#e02b2b] to-[#991b1b] p-10 lg:flex">
        <div className="absolute left-10 top-10">
          <Image src="/images/iesb-logo.png" alt="IESB" width={100} height={120} className="object-contain" />
        </div>
        <div className="mt-auto">
          <span className="text-[14px] font-bold uppercase tracking-wider text-white/80">
            IESB - BAY AREA
          </span>
        </div>
      </div>

      <div className="flex w-full flex-col items-center justify-center p-6 sm:p-12 lg:w-[40%]">
        <div className="w-full max-w-[400px]">
          <Link href="/auth/login" className="mb-6 flex w-fit items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900">
            <ArrowLeft size={16} />
            Voltar
          </Link>

          <div className="mb-6 flex justify-center lg:hidden">
            <Image src="/images/iesb-logo.png" alt="IESB" width={80} height={96} className="object-contain" />
          </div>

          {step === 'verify' ? (
            <>
              <h1 className="mb-4 text-center text-2xl font-bold text-gray-900">VERIFICAR CÓDIGO</h1>
              <p className="mb-8 text-center text-sm leading-relaxed text-gray-600">
                Digite o código de verificação enviado para seu e-mail para continuar com a redefinição da senha.
              </p>
              <form className="flex flex-col gap-4" onSubmit={onVerify}>
                <div className="space-y-1">
                  <Input
                    type="text"
                    placeholder="Código de verificação"
                    maxLength={8}
                    className="border-gray-300 bg-white text-center text-lg font-bold tracking-[2px] text-black focus-visible:ring-[#e02b2b]"
                    {...verifyForm.register("code")}
                  />
                  {verifyForm.formState.errors.code && <span className="text-xs text-red-500">{verifyForm.formState.errors.code.message}</span>}
                </div>
                <button
                  type="submit"
                  disabled={verifyForm.formState.isSubmitting}
                  className="mt-2 w-full rounded-lg bg-[#e02b2b] p-3 text-base font-bold text-white transition-colors hover:bg-[#c92525] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {verifyForm.formState.isSubmitting ? "Verificando..." : "Verificar código"}
                </button>
              </form>
            </>
          ) : (
            <>
              <h1 className="mb-4 text-center text-2xl font-bold text-gray-900">REDEFINIR SENHA</h1>
              <p className="mb-8 text-center text-sm leading-relaxed text-gray-600">
                Agora você pode definir uma nova senha para sua conta.
              </p>
              <form className="flex flex-col gap-4" onSubmit={onReset}>
                <div className="space-y-1">
                  <Input
                    type="password"
                    placeholder="Nova senha"
                    className="border-gray-300 bg-white text-black focus-visible:ring-[#e02b2b]"
                    {...resetForm.register("newPassword")}
                  />
                  {resetForm.formState.errors.newPassword && <span className="text-xs text-red-500">{resetForm.formState.errors.newPassword.message}</span>}
                </div>
                <div className="space-y-1">
                  <Input
                    type="password"
                    placeholder="Confirmar nova senha"
                    className="border-gray-300 bg-white text-black focus-visible:ring-[#e02b2b]"
                    {...resetForm.register("confirmNewPassword")}
                  />
                  {resetForm.formState.errors.confirmNewPassword && <span className="text-xs text-red-500">{resetForm.formState.errors.confirmNewPassword.message}</span>}
                </div>
                <button
                  type="submit"
                  disabled={resetForm.formState.isSubmitting}
                  className="mt-2 w-full rounded-lg bg-[#e02b2b] p-3 text-base font-bold text-white transition-colors hover:bg-[#c92525] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {resetForm.formState.isSubmitting ? "Redefinindo..." : "Redefinir senha"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}