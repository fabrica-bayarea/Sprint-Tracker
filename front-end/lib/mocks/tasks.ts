import { Sprint } from "@/types/sprint";
import { BacklogTask, TaskResponse } from "@/types/task";

export const initialTasks: TaskResponse[] = [
  {
    id: "E-402",
    listId: "open",
    title: "Neural Engine Optimization",
    description: "Implement low-latency inference for the real-time predictive analytics dashboard.",
    position: 0,
    status: "open",
    createdAt: "2026-04-01T00:00:00Z",
    updatedAt: "2026-04-01T00:00:00Z",
  },
  {
    id: "E-403",
    listId: "in-progress",
    title: "Neural Engine Optimization",
    description: "Implement low-latency inference for the real-time predictive analytics dashboard.",
    position: 0,
    status: "in-progress",
    createdAt: "2026-04-02T00:00:00Z",
    updatedAt: "2026-04-02T00:00:00Z",
  },
  {
    id: "E-404",
    listId: "done",
    title: "Neural Engine Optimization",
    description: "Implement low-latency inference for the real-time predictive analytics dashboard.",
    position: 0,
    status: "done",
    createdAt: "2026-04-03T00:00:00Z",
    updatedAt: "2026-04-03T00:00:00Z",
  }
];

export const mockTasks: TaskResponse[] = [
  {
    id: "DEV-1024",
    listId: "list-1",
    title: "Refactor authentication microservice layer",
    description: "Sprint 12",
    position: 1,
    status: "In Progress",
    priority: "HIGH",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "DS-449",
    listId: "list-1",
    title: "Global style token synchronization",
    description: "Unassigned",
    position: 2,
    status: "Review",
    priority: "MEDIUM",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "DOCS-02",
    listId: "list-1",
    title: "Update documentation for API v3 webhooks",
    description: "Next Sprint",
    position: 3,
    status: "Backlog",
    priority: "LOW",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "OPS-881",
    listId: "list-1",
    title: "Critical patch for payment gateway timeout",
    description: "Urgent",
    position: 4,
    status: "Critical",
    priority: "HIGH",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const mockSprints: Sprint[] = [
  {
    id: "sprint-2",
    name: "SPRINT 2",
    startDate: "12 ABRIL",
    endDate: "19 ABRIL",
    status: "PLANNED",
    items: mockTasks,
  },
  {
    id: "sprint-1",
    name: "SPRINT 1",
    startDate: "24 MARÇO",
    endDate: "12 ABRIL",
    status: "COMPLETED",
    items: mockTasks,
  },
];

export const BacklogMockTasks: BacklogTask[] = [
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