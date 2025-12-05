// ========================================
// ENUMS
// ========================================
export enum Status {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
  ARCHIVED = 'ARCHIVED'
}

export enum BoardRole {
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  OBSERVER = 'OBSERVER'
}

export enum BoardVisibility {
  PRIVATE = 'PRIVATE',
  PUBLIC = 'PUBLIC'
}

// ========================================
// TIPOS BASE (dados completos)
// ========================================
export interface Task {
  id: string;
  listId: string;
  title: string;
  description?: string;
  position: number;
  status: Status;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface List {
  id: string;
  title: string;
  tasks: Task[];
  position: number;
  boardId?: string;
  createdAt?: string;
  updatedAt?: string;
  isArchived?: boolean;
}

export interface Board {
  id: string;
  title: string;
  description?: string;
  visibility: BoardVisibility;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  lists?: List[];
}

export interface User {
  id: string;
  name: string | null;
  userName: string | null;
  email: string | null;
  image: string | null;
}

export interface BoardMember {
  boardId: string;
  userId: string;
  role: BoardRole;
  joinedAt: string;
  user: User;
}

// ========================================
// TIPOS DE RESPOSTA DA API
// ========================================
/**
 * Representa uma Task como retornada pela API
 * (pode não incluir todos os campos do tipo Task completo)
 */
export interface TaskResponse {
  id: string;
  title: string;
  description?: string;
  position: number;
  status: string;
  dueDate?: string;
}

/**
 * Representa uma List como retornada pela API com tasks
 */
export interface ListWithTasksResponse {
  id: string;
  title: string;
  position: number;
  boardId?: string;
  createdAt?: string;
  updatedAt?: string;
  isArchived?: boolean;
  tasks?: TaskResponse[];
}

/**
 * Representa um Board na listagem (versão simplificada)
 */
export interface BoardListItemResponse {
  id: string;
  title: string;
  memberCount: number;
}

/**
 * Representa um Board completo retornado pela API
 */
export interface BoardResponse {
  id: string;
  title: string;
  description?: string;
  visibility: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  lists?: List[];
}

/**
 * Representa um membro do Board retornado pela API
 */
export interface BoardMemberResponse {
  boardId: string;
  userId: string;
  role: string;
  joinedAt: string;
  user: {
    id: string;
    name: string | null;
    userName: string | null;
    email: string | null;
    image: string | null;
  };
}

// ========================================
// TIPOS PARA CRIAÇÃO/EDIÇÃO
// ========================================
export interface CreateTaskData {
  listId: string;
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
}

export interface EditListData {
  id: string;
  title?: string;
  position?: number;
}

export interface CreateBoardData {
  title: string;
  description: string;
  visibility?: BoardVisibility;
}

export interface InviteBoardMemberData {
  boardId: string;
  userName: string;
  role?: BoardRole;
}

export interface RespondInviteData {
  boardId: string;
  idInvite: string;
  accept: boolean;
}

// ========================================
// TIPOS PARA VIEWS/COMPONENTES
// ========================================
/**
 * Tipo usado para exibir boards na listagem
 */
export interface BoardListItem {
  id: string;
  name: string;
  members: number;
  image: string;
}

/**
 * Tipo usado para exibir membros de um board
 */
export interface BoardMemberView {
  id: string;
  name: string;
  email: string;
  role: string;
}

// ========================================
// FUNÇÕES AUXILIARES DE CONVERSÃO
// ========================================
/**
 * Converte uma TaskResponse da API para uma Task completa
 */
export function taskResponseToTask(taskResponse: TaskResponse, listId: string): Task {
  return {
    id: taskResponse.id,
    listId,
    title: taskResponse.title,
    description: taskResponse.description,
    position: taskResponse.position,
    status: taskResponse.status as Status,
    dueDate: taskResponse.dueDate,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Converte uma ListWithTasksResponse da API para uma List completa
 */
export function listResponseToList(listResponse: ListWithTasksResponse): List {
  return {
    id: listResponse.id,
    title: listResponse.title,
    position: listResponse.position,
    boardId: listResponse.boardId,
    createdAt: listResponse.createdAt,
    updatedAt: listResponse.updatedAt,
    isArchived: listResponse.isArchived,
    tasks: (listResponse.tasks || []).map(task => taskResponseToTask(task, listResponse.id)),
  };
}

/**
 * Converte um BoardListItemResponse da API para BoardListItem (view)
 */
export function boardListItemResponseToView(response: BoardListItemResponse): BoardListItem {
  return {
    id: response.id,
    name: response.title,
    members: response.memberCount,
    image: '',
  };
}

/**
 * Converte um BoardResponse da API para Board
 */
export function boardResponseToBoard(response: BoardResponse): Board {
  return {
    id: response.id,
    title: response.title,
    description: response.description,
    visibility: response.visibility as BoardVisibility,
    ownerId: response.ownerId,
    createdAt: response.createdAt,
    updatedAt: response.updatedAt,
    lists: response.lists,
  };
}

/**
 * Converte o role string da API para texto legível
 */
export function mapRoleToText(role: string): string {
  switch (role) {
    case 'ADMIN':
      return 'Administrador';
    case 'OBSERVER':
      return 'Observador';
    case 'MEMBER':
    default:
      return 'Membro';
  }
}

/**
 * Converte um BoardMemberResponse da API para BoardMemberView
 */
export function boardMemberResponseToView(response: BoardMemberResponse): BoardMemberView {
  return {
    id: response.userId || response.user?.id,
    name: response.user?.name || response.user?.userName || 'Usuário',
    email: response.user?.email || '',
    role: mapRoleToText(response.role),
  };
}
