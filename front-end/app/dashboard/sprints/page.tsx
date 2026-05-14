"use client";

import { BurndownSprint } from "@/features/sprints/burndown/burndown-sprint";
import { CurrentSprint } from "@/features/sprints/current/current-sprint";
import { SprintHistory } from "@/features/sprints/history/sprint-history";
import { useSprintStore } from "@/stores/use-sprint-store";

export default function SprintsPage() {
  const { view } = useSprintStore();

  return (
    <div className="p-10 w-full max-w-full min-w-0">
      {view === 'Atual' && <CurrentSprint />}
      {view === 'Histórico' && <SprintHistory />}
      {view === 'Burndown' && <BurndownSprint />}
    </div>
  );
}