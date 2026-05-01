import { Task } from "./task";

export interface Sprint {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  items: Task[];
}

export interface SprintCardProps {
  sprint: any;
  allSprints: any[];
  onEdit: (taskId: string, updatedData: any) => void;
  onDelete: (taskId: string) => void;
  onMove: (taskIds: string[], targetSprintId: string) => void;
  onAddTask: (sprintId: string, title: string) => void;
}