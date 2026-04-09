"use client";

import { CurrentSprint } from "@/components/features/sprints/current-sprint";
import { useSprintStore } from "@/stores/use-sprint-store";

export default function SprintsPage() {
  const { view } = useSprintStore();

  return (
    <div className="p-4">
      {view === 'Atual' && <CurrentSprint />}
      {view === 'Histórico' && <div>Renderizando Histórico</div>}
      {view === 'Burndown' && <div>Renderizando Gráfico Burndown</div>}
    </div>
  );
}