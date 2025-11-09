"use client";

import { useEffect, useState } from "react";

import { getUserProfile, UserProfile } from "@/lib/actions/me";
import { useWarningStore } from '@/lib/stores/warning';

import EditProfileForm from "@/components/features/dashboard/editProfile/formEditUser";
import DeleteAccountButton from "@/components/features/dashboard/editProfile/deleteProfile";
import Link from "next/link";

import styles from "./style.module.css";

export default function EditProfilePage() {
  const { showWarning } = useWarningStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    async function fetchUserProfile() {
      const response = await getUserProfile();

      if (!response.success) {
        showWarning(response.error || "Erro ao carregar perfil", "failed");
      } else {
        setProfile(response.data);
      }
    }

    fetchUserProfile();
  }, [showWarning]);

  return (
    <div className={styles.container}>
      <Link href="/dashboard" className={styles.backToDashboard}>
        <span>
          <svg
            width="38"
            height="38"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Voltar
        </span>
      </Link>

      <h1 className={styles.title}>Informações Pessoais</h1>
      {profile && <EditProfileForm profile={profile} />}
      <DeleteAccountButton />
    </div>
  );
}
