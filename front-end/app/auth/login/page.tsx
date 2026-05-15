"use client"

import Link from "next/link";
import Image from "next/image";
import { Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useLogin } from "../../../hooks/auth/use-login";

export default function Login() {
  const { register, handleSubmit, errors, handleOAuth, control, isSubmitting } = useLogin();

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

          <div className="my-8 flex w-full items-center gap-3 text-sm font-medium text-muted-foreground before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">
            <span className="px-2">Conecte-se com</span>
          </div>

          <div className="flex justify-center gap-4">
            <button
              type="button"
              onClick={() => handleOAuth('google')}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition-all hover:bg-muted hover:shadow-md"
            >
              <svg viewBox="0 0 24 24" width="22" height="22" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => handleOAuth('microsoft')}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition-all hover:bg-muted hover:shadow-md"
            >
              <svg viewBox="0 0 21 21" width="22" height="22" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 0h10v10H0z" fill="#f25022" /><path d="M11 0h10v10H11z" fill="#7fba00" /><path d="M0 11h10v10H0z" fill="#00a4ef" /><path d="M11 11h10v10H11z" fill="#ffb900" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}