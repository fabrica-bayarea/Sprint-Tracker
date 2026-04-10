export interface Task {
  id: string;
  content: string;
}

export interface List {
  id: string;
  title: string;
  tasks: Task[];
  position?: number;
  boardId?: string;
}

export interface NewListData {
  boardId: string;
  title: string;
  position: number;
}

export interface PatchListData {
  id: string;
  title?: string;
  position?: number;
}