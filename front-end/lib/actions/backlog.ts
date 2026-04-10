import api from '@/lib/api/axios';

export const backlogActions = {
  getTasks: async (boardId: string) => {
    const { data } = await api.get(`/boards/${boardId}/backlog`);
    return data;
  },
  
  createTask: async (boardId: string, taskData: any) => {
    const { data } = await api.post(`/boards/${boardId}/backlog`, taskData);
    return data;
  },
  
  updateTask: async (boardId: string, taskId: string, taskData: any) => {
    const { data } = await api.patch(`/boards/${boardId}/backlog/${taskId}`, taskData);
    return data;
  },
  
  deleteTask: async (boardId: string, taskId: string) => {
    const { data } = await api.delete(`/boards/${boardId}/backlog/${taskId}`);
    return data;
  }
};