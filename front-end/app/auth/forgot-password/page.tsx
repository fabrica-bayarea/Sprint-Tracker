"use client"

import Link from "next/link";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";
import { useForgotPassword } from "@/hooks/auth/use-forgot-password";

export default function ForgotPassword() {
  const { register, onSubmit, formState: { errors, isSubmitting } } = useForgotPassword();

  return (
    <main className="flex min-h-screen w-full bg-white">
      <div className="relative hidden w-[60%] flex-col justify-between bg-linear-to-br from-[#e02b2b] to-[#991b1b] p-10 lg:flex">
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
        <div className="w-full max-w-100">
          <Link href="/auth/login" className="mb-6 flex w-fit items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900">
            <ArrowLeft size={16} />
            Voltar
          </Link>

          <div className="mb-6 flex justify-center lg:hidden">
            <Image src="/images/iesb-logo.png" alt="IESB" width={80} height={96} className="object-contain" />
          </div>

          <h1 className="mb-4 text-center text-2xl font-bold text-gray-900">
            ESQUECEU SUA SENHA?
          </h1>
          <p className="mb-8 text-center text-sm leading-relaxed text-gray-600">
            Para redefinir sua senha, insira seu e-mail cadastrado e clique em &quot;Enviar e-mail&quot;. Você receberá um e-mail com instruções.
          </p>

          <form className="flex flex-col gap-4" onSubmit={onSubmit}>
            <div className="space-y-1">
              <Input
                type="email"
                placeholder="Insira o seu e-mail"
                className="border-gray-300 bg-white text-black focus-visible:ring-[#e02b2b]"
                {...register("email")}
              />
              {errors.email && <span className="text-xs text-red-500">{errors.email.message}</span>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 w-full rounded-lg bg-[#e02b2b] p-3 text-base font-bold text-white transition-colors hover:bg-[#c92525] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Enviando..." : "Enviar e-mail"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}