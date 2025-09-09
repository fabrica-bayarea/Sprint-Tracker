"use client";

import { useEffect, useState } from "react";

import { getUserProfile } from "@/lib/actions/profile";
import { useWarningStore } from '@/lib/stores/warning';

import EditProfileForm from "@/components/features/dashboard/editProfile/formEditUser";
import DeleteAccountButton from "@/components/features/dashboard/editProfile/deleteProfile";

import styles from "./style.module.css";

export default function EditProfilePage() {
  const { showWarning } = useWarningStore()
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    async function fetchUserProfile() {
      const response = await getUserProfile();

      if (!response.success) {
        showWarning(response.error || "Erro ao carregar perfil", 'failed')
      } else {
        setProfile(response.data);
      }
    }

    fetchUserProfile();
  }, [showWarning]);

  return (
    <div className={styles.container}>
      {/* TODO: criar um componente para mostrar para isso */}
      <p className={styles.history}>
        Dashboard &gt; edit-profile
      </p>
      <h1 className={styles.title}>Informações Pessoais</h1>
      {profile && <EditProfileForm profile={profile} />}
      <DeleteAccountButton />
    </div>
  );
}
