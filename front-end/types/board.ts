import { Task } from "./task";

export enum Status {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
  ARCHIVED = 'ARCHIVED'
}

export interface Board {
  id: string;
  name: string;
  members: { id: string; name: string; avatar: string }[];
  image: string;
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

export interface ExpiredTask {
  id: string;
  listId: string;
  title: string;
  description?: string;
  dueDate: string;
  status: string;
  list: {
    id: string;
    title: string;
    board: {
      id: string;
      title: string;
    };
  };
}

export interface PendenciaItem {
  id: string;
  titulo: string;
  grupo: string;
  status: string;
  statusColor: string;
  andamento: string;
  data: string;
  atrasado: boolean;
}