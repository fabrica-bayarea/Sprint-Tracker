"use client";

import { useEffect, useState } from "react";

import { getUserProfile } from "@/lib/actions/profile";

import EditProfileForm from "@/features/edit-profile/form-edit-user/edit-profile-form";
import DeleteAccountButton from "@/features/edit-profile/delete-profile/delete-account-button";
import { toast } from "sonner";

export default function EditProfilePage() {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    async function fetchUserProfile() {
      const response = await getUserProfile();

      if (!response.success) {
        toast.error(response.error || "Erro ao carregar perfil")
      } else {
        setProfile(response.data);
      }
    }

    fetchUserProfile();
    // Roda só no mount. NÃO incluir `profile` (gera loop infinito:
    // setProfile -> re-render -> effect dispara -> setProfile -> ...).
  }, []);

  return (
    <div className="p-8 max-w-225 my-12.5 mx-auto bg-card rounded-[10px] shadow-[0_3px_8px_rgba(0,0,0,0.233)] font-sans">
      <p className="text-muted-foreground text-[0.9rem] mb-2">
        Dashboard &gt; edit-profile
      </p>
      <h1 className="text-[1.8rem] mb-4">Informações Pessoais</h1>
      {profile && <EditProfileForm profile={profile} />}
      <DeleteAccountButton />
    </div>
  );
}