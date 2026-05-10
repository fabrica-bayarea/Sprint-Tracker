"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Priority, Task } from "@/types/task";
import { Textarea } from "@/components/ui/textarea";

interface SprintOption {
  id: string;
  name: string;
}

export interface TaskEditData {
  title: string;
  description?: string;
  priority?: Priority;
  status: string;
  sprintId?: string;
}

interface TaskEditSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task & { sprintId?: string };
  sprintOptions?: SprintOption[];
  onSubmit: (data: TaskEditData) => void;
}

export function TaskEditSheet({
  open,
  onOpenChange,
  task,
  sprintOptions = [],
  onSubmit,
}: TaskEditSheetProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [priority, setPriority] = useState<Priority>(task.priority || "MEDIUM");
  const [status, setStatus] = useState(task.status || "open");
  const [sprintId, setSprintId] = useState(task.sprintId || sprintOptions[0]?.id || "");

  useEffect(() => {
    if (open) {
      setTitle(task.title);
      setDescription(task.description || "");
      setPriority(task.priority || "MEDIUM");
      setStatus(task.status || "open");
      setSprintId(task.sprintId || sprintOptions[0]?.id || "");
    }
  }, [open, task, sprintOptions]);

  const statusOptions = [
    { value: "open", label: "Aberto" },
    { value: "in-progress", label: "Em progresso" },
    { value: "done", label: "Concluído" },
    { value: "Backlog", label: "Backlog" },
    { value: "In Progress", label: "Em progresso" },
    { value: "Review", label: "Review" },
    { value: "Critical", label: "Critical" },
  ];

  const visibleStatusOptions = statusOptions.some((option) => option.value === status)
    ? statusOptions
    : [{ value: status, label: status }, ...statusOptions];

  const handleSubmit = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    onSubmit({
      title: trimmedTitle,
      description: description.trim() || undefined,
      priority,
      status,
      sprintId: sprintId || undefined,
    });
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="max-w-md">
        <SheetHeader>
          <SheetTitle>Editar tarefa</SheetTitle>
          <SheetDescription>
            Atualize título, descrição, prioridade, status e sprint.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 p-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Título</label>
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Digite o título da tarefa"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Descrição</label>
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Digite a descrição da tarefa"
              className="min-h-30"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Sprint</label>
            <Select value={sprintId} onValueChange={(value) => setSprintId(value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecionar sprint" />
              </SelectTrigger>
              <SelectContent>
                {sprintOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Prioridade</label>
              <Select value={priority} onValueChange={(value) => setPriority(value as Priority)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HIGH">Alta</SelectItem>
                  <SelectItem value="MEDIUM">Média</SelectItem>
                  <SelectItem value="LOW">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Status</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {visibleStatusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <SheetFooter className="flex items-center justify-end gap-2">
          <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} className="w-full">Salvar</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
