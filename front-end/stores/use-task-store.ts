import { create } from "zustand";
import { mockSprints as initialMockSprints } from "@/lib/mocks/tasks";
import { Task } from "@/types/task";

interface TaskStore {
  sprints: any[];
  onEdit: (taskId: string, updatedData: any) => void;
  onDelete: (taskId: string) => void;
  onMove: (taskIds: string[], targetSprintId: string) => void;
  onAddTask: (sprintId: string, title: string) => void;
}

export const useTaskStore = create<TaskStore>((set) => ({
  sprints: initialMockSprints.map((s) => ({
    ...s,
    items: s.items.map((t) => ({ ...t, id: `${s.id}-${t.id}`, sprintId: s.id })),
  })),

  onEdit: (taskId, updatedData) =>
    set((state) => {
      let updatedTask: any | null = null;
      const withoutTask = state.sprints.map((sprint) => ({
        ...sprint,
        items: sprint.items.filter((task: Task) => {
          if (task.id !== taskId) return true;
          updatedTask = {
            ...task,
            title: updatedData.title,
            description: updatedData.description ?? task.description,
            priority: updatedData.priority ?? task.priority,
            status: updatedData.status ?? task.status,
            sprintId: updatedData.sprintId ?? task.listId,
          };
          return false;
        }),
      }));

      if (!updatedTask) return state;

      return {
        sprints: withoutTask.map((sprint) =>
          sprint.id === updatedTask!.sprintId
            ? { ...sprint, items: [...sprint.items, updatedTask!] }
            : sprint
        ),
      };
    }),

  onDelete: (taskId) =>
    set((state) => ({
      sprints: state.sprints.map((sprint) => ({
        ...sprint,
        items: sprint.items.filter((task: Task) => task.id !== taskId),
      })),
    })),

  onMove: (taskIds, targetSprintId) =>
    set((state) => {
      const tasksToMove: any[] = [];
      const withoutTasks = state.sprints.map((sprint) => {
        const matchingTasks = sprint.items.filter((t: Task) => taskIds.includes(t.id));
        if (matchingTasks.length > 0) {
          tasksToMove.push(...matchingTasks.map((t: Task) => ({ ...t, sprintId: targetSprintId })));
        }
        return {
          ...sprint,
          items: sprint.items.filter((t: Task) => !taskIds.includes(t.id)),
        };
      });

      if (tasksToMove.length === 0) return state;

      return {
        sprints: withoutTasks.map((sprint) =>
          sprint.id === targetSprintId
            ? { ...sprint, items: [...sprint.items, ...tasksToMove] }
            : sprint
        ),
      };
    }),

  onAddTask: (sprintId, title) =>
    set((state) => {
      const newTask = {
        id: `NEW-${Math.floor(Math.random() * 10000)}`,
        listId: "list-1",
        sprintId: sprintId,
        title: title,
        position: 999,
        status: "Backlog",
        priority: "LOW",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return {
        sprints: state.sprints.map((sprint) =>
          sprint.id === sprintId ? { ...sprint, items: [...sprint.items, newTask] } : sprint
        ),
      };
    }),
}));