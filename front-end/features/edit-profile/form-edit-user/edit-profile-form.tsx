"use client";

import { useState } from "react";
import { updateUserProfile } from "@/lib/actions/profile";
import { Input, Image } from "@/components/ui";
import { toast } from "sonner";

interface UserProfile {
  name: string;
  userName: string;
  email: string;
  photoUrl?: string;
}

export default function EditProfileForm({ profile }: { profile: UserProfile }) {
  const [form, setForm] = useState<UserProfile>({
    name: profile?.name || "",
    userName: profile?.userName || "",
    email: profile?.email || "",
    photoUrl: profile?.photoUrl || "/images/iesb-icon.png",
  });
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value, files } = e.target;
    if (name === "foto" && files && files[0]) {
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const formData = {
      name: form.name || "",
      userName: form.userName || "",
      email: form.email || "",
    };

    const response = await updateUserProfile(formData);

    if (response.success) {
      toast.success("Perfil atualizado com sucesso!");
    } else {
      toast.error(response.error || "Erro desconhecido");
    }

    setLoading(false);
  }

  return (
    <>
      <form className="flex items-center justify-between" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-4 w-[48%]">
          <Input
            type="text"
            name="name"
            label="Nome"
            placeholder="Digite seu nome"
            value={form.name}
            onChange={handleChange}
          />
          <Input
            type="text"
            name="userName"
            label="Nome de usuário"
            placeholder="Escolha um nome de usuário"
            value={form.userName}
            onChange={handleChange}
          />
          <Input
            type="email"
            name="email"
            label="Email"
            placeholder="Seu e-mail"
            value={form.email}
            onChange={handleChange}
          />
          <button 
            type="submit" 
            className="bg-[#d32f2f] text-white border-none text-[1.1rem] font-bold rounded-[10px] py-3 px-6.25 cursor-pointer self-center w-full transition-colors duration-300 hover:bg-[#b71c1c] disabled:opacity-50 disabled:cursor-not-allowed" 
            disabled={loading}
          >
            {loading ? "Atualizando..." : "Atualizar"}
          </button>
        </div>
        <div className="flex flex-col gap-4 w-[48%]">
          <div className="mt-7.5 h-full flex flex-col gap-4 items-center border border-[#ddd] p-4 rounded-[15px]">
            <span>Foto de perfil</span>
            <Image
              src={form.photoUrl || "/images/iesb-icon.png"}
              alt="Foto de perfil"
              className="w-37.5 h-37.5 rounded-[20px] object-cover shadow-[0_2px_6px_rgba(0,0,0,0.15)]"
              width={100}
              height={100}
              loading="eager"
            />
            <input type="file" id="foto" name="foto" accept="image/*" onChange={handleChange} />
          </div>
        </div>
      </form>
    </>
  );
}