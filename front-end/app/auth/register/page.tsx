"use client"

import Link from "next/link";
import Image from "next/image";
import { Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useRegister } from "../../../hooks/auth/use-register";

export default function Register() {
  const { registerField, handleSubmit, errors, password, isSubmitting, passwordRequirements, control } = useRegister();

  const getReqClass = (met: boolean) => {
    if (!password) return "text-gray-400";
    return met ? "text-green-500" : "text-red-500";
  };

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
          <div className="mb-8 flex justify-center lg:hidden">
            <Image src="/images/iesb-logo.png" alt="IESB" width={80} height={96} className="object-contain" />
          </div>

          <h1 className="mb-8 text-center text-2xl font-bold text-gray-900">
            CRIE SUA CONTA
          </h1>

          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="space-y-1">
              <Input
                placeholder="Nome completo"
                className="border-gray-300 bg-white text-black focus-visible:ring-[#e02b2b]"
                {...registerField("fullname")}
              />
              {errors.fullname && <span className="text-xs text-red-500">{errors.fullname.message}</span>}
            </div>

            <div className="space-y-1">
              <Input
                placeholder="Nome de usuário"
                className="border-gray-300 bg-white text-black focus-visible:ring-[#e02b2b]"
                {...registerField("userName")}
              />
              {errors.userName && <span className="text-xs text-red-500">{errors.userName.message}</span>}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Input
                  type="email"
                  placeholder="E-mail"
                  className="border-gray-300 bg-white text-black focus-visible:ring-[#e02b2b]"
                  {...registerField("email")}
                />
                {errors.email && <span className="text-xs text-red-500">{errors.email.message}</span>}
              </div>

              <div className="space-y-1">
                <Input
                  type="email"
                  placeholder="Confirme o E-mail"
                  className="border-gray-300 bg-white text-black focus-visible:ring-[#e02b2b]"
                  {...registerField("confirmEmail")}
                />
                {errors.confirmEmail && <span className="text-xs text-red-500">{errors.confirmEmail.message}</span>}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Input
                  type="password"
                  placeholder="Senha"
                  className="border-gray-300 bg-white text-black focus-visible:ring-[#e02b2b]"
                  {...registerField("password")}
                />
              </div>
              <div className="space-y-1">
                <Input
                  type="password"
                  placeholder="Confirme a senha"
                  className="border-gray-300 bg-white text-black focus-visible:ring-[#e02b2b]"
                  {...registerField("confirmPassword")}
                />
                {errors.confirmPassword && <span className="text-xs text-red-500">{errors.confirmPassword.message}</span>}
              </div>
            </div>

            <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-[12px] leading-relaxed">
              <div className={`flex items-center gap-1.5 ${getReqClass(passwordRequirements.hasUppercase)}`}>
                <span>{passwordRequirements.hasUppercase ? '✔' : '✖'}</span> Pelo menos 1 letra maiúscula
              </div>
              <div className={`flex items-center gap-1.5 ${getReqClass(passwordRequirements.hasLowercase)}`}>
                <span>{passwordRequirements.hasLowercase ? '✔' : '✖'}</span> Pelo menos 1 letra minúscula
              </div>
              <div className={`flex items-center gap-1.5 ${getReqClass(passwordRequirements.hasNumber)}`}>
                <span>{passwordRequirements.hasNumber ? '✔' : '✖'}</span> Pelo menos 1 número
              </div>
              <div className={`flex items-center gap-1.5 ${getReqClass(passwordRequirements.hasSpecial)}`}>
                <span>{passwordRequirements.hasSpecial ? '✔' : '✖'}</span> Pelo menos 1 caractere especial
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Controller
                  name="agreeTerms"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="terms"
                      checked={!!field.value}
                      onCheckedChange={field.onChange}
                      className="border-gray-300 data-[state=checked]:bg-[#e02b2b] data-[state=checked]:text-white"
                    />
                  )}
                />
                <Label htmlFor="terms" className="cursor-pointer text-sm font-normal text-gray-600">
                  Concordo com os termos de serviço
                </Label>
              </div>
              {errors.agreeTerms && <p className="text-xs text-red-500">{errors.agreeTerms.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 w-full rounded-lg bg-[#e02b2b] p-3 text-base font-bold text-white transition-colors hover:bg-[#c92525] disabled:opacity-50"
            >
              {isSubmitting ? "Carregando..." : "Cadastrar"}
            </button>

            <div className="mt-2 text-center">
              <Link href="/auth/login" className="text-sm text-gray-500 transition-colors hover:text-[#e02b2b] hover:underline">
                Já tem uma conta? <span className="font-bold text-[#e02b2b]">Entrar</span>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}