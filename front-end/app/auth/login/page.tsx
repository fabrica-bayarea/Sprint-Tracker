"use client"

import Link from "next/link";
import Image from "next/image";
import { Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useLogin } from "../../../hooks/auth/use-login";

export default function Login() {
  // handleOAuth removido do destructuring enquanto os botões Google/Microsoft
  // estão desabilitados (OAuth não configurado — dá 404). Re-adicionar quando
  // o OAuth for configurado em produção.
  const { register, handleSubmit, errors, control, isSubmitting } = useLogin();

  return (
    <main className="flex min-h-screen w-full bg-background">
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

          <h1 className="mb-8 text-center text-2xl font-bold text-foreground">
            ACESSE SUA CONTA
          </h1>

          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            <div className="space-y-1">
              <Input
                placeholder="Nome de usuário ou e-mail"
                className="border-input bg-card text-foreground focus-visible:ring-[#e02b2b]"
                {...register("email")}
              />
              {errors.email && <span className="text-xs text-red-500">{errors.email.message}</span>}
            </div>

            <div className="space-y-1">
              <Input
                type="password"
                placeholder="Senha"
                className="border-input bg-card text-foreground focus-visible:ring-[#e02b2b]"
                {...register("password")}
              />
              {errors.password && <span className="text-xs text-red-500">{errors.password.message}</span>}
            </div>

            <div className="flex items-center space-x-2">
              <Controller
                name="rememberMe"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="rememberMe"
                    checked={!!field.value}
                    onCheckedChange={field.onChange}
                    className="border-input data-[state=checked]:bg-[#e02b2b] data-[state=checked]:text-white"
                  />
                )}
              />
              <Label htmlFor="rememberMe" className="cursor-pointer text-sm font-normal text-foreground">
                Lembrar de mim
              </Label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 w-full rounded-lg bg-[#e02b2b] p-3 text-base font-bold text-white transition-colors hover:bg-[#c92525] disabled:opacity-50"
            >
              {isSubmitting ? "Carregando..." : "Entrar"}
            </button>

            <div className="mt-2 flex items-center justify-between">
              <Link href="/auth/forgot-password" className="text-sm text-muted-foreground transition-colors hover:text-[#e02b2b] hover:underline">
                Esqueceu sua senha?
              </Link>
              <Link href="/auth/register" className="text-sm text-[#e02b2b] font-medium transition-colors hover:underline">
                Criar uma conta
              </Link>
            </div>
          </form>

          {/*
            Login social (Google/Microsoft) removido do front a pedido do PO.
            Os provedores OAuth não estão configurados em produção (exigem
            client ID/secret e redirect URL), então os botões davam 404.
            Pra reativar: restaurar o bloco "Conecte-se com" + os botões
            (commit anterior no git) e re-adicionar `handleOAuth` no
            destructuring de useLogin() no topo deste arquivo.
          */}
        </div>
      </div>
    </main>
  );
}