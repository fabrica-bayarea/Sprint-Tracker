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
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
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
    const result = await register(data.fullname, data.userName, data.email, data.password);

    if (result.success) {
      toast.success("Conta criada com sucesso!");
      router.push("/dashboard");
    } else {
      toast.error(result.error || "Erro desconhecido");
    }
  };

  return {
    registerField,
    handleSubmit: handleSubmit(onSubmit),
    control,
    errors,
    password,
    passwordRequirements,
  };
}