"use client";

import { useState } from "react";
import { useRouter } from "next/navigation"

import { deleteUserProfile } from "@/lib/actions/profile";
import { toast } from "sonner";

export default function DeleteAccountButton() {
  const router = useRouter()
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function handleDelete() {
    if (!window.confirm("Tem certeza que deseja deletar sua conta? Esta ação não pode ser desfeita.")) return;
    setDeleteLoading(true);

    const result = await deleteUserProfile();

    if (result.success) {
      router.push("/auth/login");
      await new Promise((resolve) => setTimeout(resolve, 5000));
      router.refresh();
    } else {
      toast.error(result.error || "Erro desconhecido")
    }

    setDeleteLoading(false);
  }

  return (
    <div className="text-red-600 mt-10 border border-red-600 p-5 flex text-[1.1rem] rounded-[10px] justify-between items-center">
      <div>
        <h2 className="m-0 text-[1.3rem]">Deletar conta</h2>
        <p className="m-0 text-[0.9rem]">Delete sua conta e informação do sistema</p>
      </div>
      <button
        type="button"
        className="bg-red-600 text-white border-none text-[1rem] font-bold rounded-lg px-[30px] py-[10px] cursor-pointer transition-colors duration-300 hover:bg-[#a80000] disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={handleDelete}
        disabled={deleteLoading}
      >
        {deleteLoading ? "Deletando..." : "Deletar"}
      </button>
    </div>
  );
}