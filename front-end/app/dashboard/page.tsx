"use client";

import { Check, Trash2, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Section from '@/features/dashboard/selectedDashboard/section';
import styles from './style.module.css';
import { useDashboard } from "@/features/dashboard/hooks/use-dashboard";
import { Loader } from "@/components/ui/loader";

export default function Dashboard() {
  const router = useRouter();
  const {
    data,
    pendencias,
    isLoading,
    handleDeleteTask,
    handleMarkAsDone
  } = useDashboard();

  if (isLoading) {
    return <div className="grid place-items-center h-full"><Loader /></div>;
  }

  return (
    <main className={styles.dashboardMainCustom}>
      <Section title="Pendências">
        <div className={styles.pendenciasList}>
          {pendencias.length === 0 ? (
            <div className={styles.noPendenciasMessage}>
              <CheckCircle2 size={48} className={styles.noPendenciasIcon} />
              <h3>Parabéns! Você está em dia!</h3>
            </div>
          ) : (
            pendencias.map((p) => (
              <div className={styles.pendenciaRow} key={p.id}>
                <span className={styles.pendenciaTitulo}>{p.titulo}</span>
                <span className={styles.pendenciaAtrasadoWrapper}>
                  {p.atrasado && <span className={styles.pendenciaAtrasado}>Atrasado!</span>}
                </span>
                <span className={styles.pendenciaGrupo}>{p.grupo}/<span>{p.andamento}</span></span>
                <button
                  className={styles.pendenciaAction}
                  onClick={() => handleDeleteTask(p.id)}
                  title="Deletar tarefa"
                >
                  <Trash2 size={18} />
                </button>
                <button
                  className={styles.pendenciaAction}
                  onClick={() => handleMarkAsDone(p.id)}
                  title="Marcar como concluída"
                >
                  <Check size={18} />
                </button>
                <span className={styles.pendenciaData}>{p.data}</span>
              </div>
            ))
          )}
        </div>
      </Section>

      <Section
        title="Espaços de trabalho"
        actionButton={() => router.push("dashboard/new-board")}
      >
        <div className={styles.boardsGridCustom}>
          {data?.data?.length === 0 ? (
            <div className={styles.noBoardsMessage}>
              <h3>Você não está em nenhum board</h3>
              <p>Que tal criar o seu primeiro espaço de trabalho?</p>
            </div>
          ) : (
            data?.data?.map((b) => (
              <div
                className={`${styles.boardCardCustom} ${styles.noImage}`}
                key={b.id}
                onClick={() => router.push(`/dashboard/${b.id}`)}
              >
                <div className={styles.boardImgCustom}></div>
                <div className={styles.boardInfoCustom}>
                  <span className={styles.boardNameCustom}>{b.name}</span>
                  <span className={styles.boardMembrosCustom}>1 Membros</span>
                </div>
              </div>
            ))
          )}
        </div>
      </Section>
    </main>
  );
}