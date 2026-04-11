export interface TaskData {
  listId: string;
  title: string;
  description?: string;
  position: number;
  status: string;
  dueDate?: string;
}

export interface UpdateTaskData {
  listId?: string;
  title?: string;
  description?: string;
  position?: number;
  status?: string;
  dueDate?: string;
}

export interface TaskResponse {
  id: string;
  listId: string;
  title: string;
  description?: string;
  position: number;
  status: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  priority?: "HIGH" | "MEDIUM" | "LOW";
}

export interface ColumnType {
  id: string;
  title: string;
}