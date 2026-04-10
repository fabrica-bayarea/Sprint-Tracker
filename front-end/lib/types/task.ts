
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
}

// ==========================================

export type Priority = 'HIGH' | 'MEDIUM' | 'LOW';

// Estendemos o TaskResponse para incluir o que o Figma pede
export interface BacklogTask extends TaskResponse {
  priority: Priority;
  code: string;
  commentsCount?: number;
}

// Nossos dados falsos preenchendo tanto os dados da API quanto os do Figma
export const mockTasks: BacklogTask[] = [
  {
    id: '1',
    listId: 'backlog-list',
    position: 0,
    status: 'Backlog',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    title: 'Neural Engine Optimization',
    description: 'Implement low-latency inference for the real-time predictive analytics dashboard.',
    priority: 'HIGH',
    code: '#E-402',
    commentsCount: 2
  },
  {
    id: '2',
    listId: 'backlog-list',
    position: 1,
    status: 'Backlog',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    title: 'Multi-tenant Cloud Sync',
    description: 'Refactor the synchronization layer to support isolated enterprise silos without latency degradation.',
    priority: 'MEDIUM',
    code: '#E-385',
  },
  {
    id: '3',
    listId: 'backlog-list',
    position: 2,
    status: 'Backlog',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    title: 'Export to PDF Branding',
    description: 'Update the PDF export templates to reflect the new brand architecture and typography.',
    priority: 'LOW',
    code: '#E-291',
  }
];