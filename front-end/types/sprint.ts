import { TaskResponse } from "./task";

export interface Sprint {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  items: TaskResponse[];
}

export interface SprintCardProps {
  sprint: any;
  allSprints: any[];
  onRename: (taskId: string, newTitle: string) => void;
  onDelete: (taskId: string) => void;
  onMove: (taskIds: string[], targetSprintId: string) => void;
  onAddTask: (sprintId: string, title: string) => void;
}