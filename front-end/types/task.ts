
export interface TaskData {
  listId: string;
  title: string;
  description?: string;
  position: number;
  status: string;
  dueDate?: string;
  assigneeId?: string | null;
}

export interface UpdateTaskData {
  listId?: string;
  title?: string;
  description?: string;
  position?: number;
  status?: string;
  dueDate?: string;
  assigneeId?: string | null;
}

export interface Task {
  id: string;
  listId: string;
  title: string;
  description?: string;
  position: number;
  status: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  priority?: Priority;
  assigneeId?: string | null;
}

export type Priority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface BacklogTask extends Task {
  priority: Priority;
  code: string;
  commentsCount?: number;
}

export interface ColumnType {
  id: string;
  title: string;
}
