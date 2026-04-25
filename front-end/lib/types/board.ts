// Interfaces compartilhadas para o sistema de boards
export enum Status {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
  ARCHIVED = 'ARCHIVED'
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  position: number;
  status: Status;
  dueDate?: string;
  assigneeId?: string | null;
}

export interface BoardMember {
  userId: string;
  name: string;
  email: string;
  userName: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'OBSERVER';
}

export interface List {
  id: string;
  title: string;
  tasks: Task[];
  position?: number;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  position: number;
  status: Status;
  dueDate?: string;
  assigneeId?: string | null;
}

export interface EditTaskData {
  title?: string;
  description?: string;
  position?: number;
  status?: Status;
  dueDate?: string;
  assigneeId?: string | null;
}

export interface CreateListData {
  boardId: string;
  title: string;
  position: number;
  tasks: Task[];
}
