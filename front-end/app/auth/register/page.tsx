"use client"

import Link from "next/link";
import { Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useRegister } from "../../../hooks/auth/use-register";

export default function Register() {
  const { registerField, handleSubmit, errors, password, passwordRequirements, control } = useRegister();

  const getReqClass = (met: boolean) => {
    if (!password) return "text-[#e8e8e8]";
    return met ? "text-[#4ade80]" : "text-[#f87171]";
  };

  return (
    <div className="relative z-1 mx-5 mb-5 w-[90%] max-w-112.5 rounded-lg bg-[#e02b2b] p-[30px_25px] md:p-10">
      <Link href="/auth/login" className="mb-3.75 flex w-min items-center gap-1 rounded-lg pr-3 text-[15px] font-medium text-white no-underline transition-all hover:bg-white/10">
        <svg width="38" height="38" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Voltar
      </Link>

      <h1 className="mb-5 text-center text-[20px] font-bold text-white md:text-2xl">
        CRIE SUA CONTA
      </h1>

      <form className="flex flex-col gap-3.75" onSubmit={handleSubmit}>
        <Input placeholder="Nome completo" className="bg-white text-black" {...registerField("fullname")} />
        {errors.fullname && <span className="text-xs text-white/90 -mt-3">{errors.fullname.message}</span>}

        <Input placeholder="Nome de usuário" className="bg-white text-black" {...registerField("userName")} />
        <Input type="email" placeholder="E-mail" className="bg-white text-black" {...registerField("email")} />
        <Input type="email" placeholder="Confirme o e-mail" className="bg-white text-black" {...registerField("confirmEmail")} />
        <Input type="password" placeholder="Senha" className="bg-white text-black" {...registerField("password")} />

        <div className="px-3 text-[13px] leading-relaxed text-white">
          <div className={`mb-0.5 ${getReqClass(passwordRequirements.hasUppercase)}`}>
            {passwordRequirements.hasUppercase ? '✔' : '✖'} Pelo menos 1 letra maiúscula
          </div>
          <div className={`mb-0.5 ${getReqClass(passwordRequirements.hasLowercase)}`}>
            {passwordRequirements.hasLowercase ? '✔' : '✖'} Pelo menos 1 letra minúscula
          </div>
          <div className={`mb-0.5 ${getReqClass(passwordRequirements.hasNumber)}`}>
            {passwordRequirements.hasNumber ? '✔' : '✖'} Pelo menos 1 número
          </div>
          <div className={`mb-0.5 ${getReqClass(passwordRequirements.hasSpecial)}`}>
            {passwordRequirements.hasSpecial ? '✔' : '✖'} Pelo menos 1 caractere especial
          </div>
        </div>

        <Input type="password" placeholder="Confirme a senha" className="bg-white text-black" {...registerField("confirmPassword")} />

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
                  className="border-white data-[state=checked]:bg-white data-[state=checked]:text-[#e02b2b]"
                />
              )}
            />
            <Label htmlFor="terms" className="cursor-pointer text-[13px] text-white">
              Concordo com os termos de serviço
            </Label>
          </div>
          {errors.agreeTerms && <p className="text-xs text-white/90">{errors.agreeTerms.message}</p>}
        </div>

        <button
          type="submit"
          className="mt-2.5 w-full rounded-lg bg-white p-2.5 text-base font-bold text-[#e02b2b] transition-colors hover:bg-[#f0f0f0] md:p-3"
        >
          Cadastrar
        </button>
      </form>

      <span className="mt-6.25 block text-center text-[14px] font-bold text-white uppercase">
        IESB - BAY AREA
      </span>
    </div>
  );
}