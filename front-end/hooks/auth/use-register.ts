import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { register } from "@/lib/actions/auth";
import { RegisterFormData, registerSchema } from "../../app/auth/register/register-schema";

export function useRegister() {
  const router = useRouter();

  const {
    register: registerField,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
    defaultValues: {
      fullname: "",
      userName: "",
      email: "",
      confirmEmail: "",
      password: "",
      confirmPassword: "",
      agreeTerms: false,
    }
  });

  const password = watch("password", "");

  const passwordRequirements = {
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  };

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const result = await register(data.fullname, data.userName, data.email, data.password);

      if (result?.success) {
        toast.success("Conta criada com sucesso!");
        router.push("/dashboard");
      } else {
        toast.error(result?.error || "Erro ao realizar o registro");
      }
    } catch (error) {
      toast.error("Ocorreu um erro inesperado");
    }
  };

  const onErrors = (err: any) => {
    console.log(JSON.stringify(err, null, 2));
  };

  return {
    registerField,
    handleSubmit: handleSubmit(onSubmit, onErrors),
    control,
    errors,
    isSubmitting,
    password,
    passwordRequirements,
  };
}