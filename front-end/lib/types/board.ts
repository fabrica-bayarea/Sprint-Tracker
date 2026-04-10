import { Task } from "./list";

export enum Status {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
  ARCHIVED = 'ARCHIVED'
}

export interface BoardData {
  title: string;
  description: string;
}

export interface BoardListItemAPI {
  id: string;
  title: string;
}
export interface CreateTaskData {
  title: string;
  description?: string;
  position: number;
  status: Status;
  dueDate?: string;
}

export interface EditTaskData {
  title?: string;
  description?: string;
  position?: number;
  status?: Status;
  dueDate?: string;
}

export interface CreateListData {
  boardId: string;
  title: string;
  position: number;
  tasks: Task[];
}
