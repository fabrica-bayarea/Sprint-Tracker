"use client";

import { useMemo, useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus, Users, Layout, MoreHorizontal, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getBoardById } from "@/lib/actions/board";
import { getAllList, deleteList } from "@/lib/actions/list";
import { moveTask, moveTaskOtherList } from "@/lib/actions/task";
import { getMyRoleOnBoard, getBoardMembers } from "@/lib/actions/members";

import { CreateListDialog } from "@/features/board/create-list-dialog";
import { CreateTaskDialog } from "@/features/board/create-task-dialog";
import { EditTaskDialog } from "@/features/board/edit-task-dialog";
import { MembersDialog } from "@/features/board/members-dialog";
import { TaskCard } from "@/features/board/task-card";

import type { Task } from "../../../../types/task";

const BOARD_COLORS = [
  "bg-red-500",
  "bg-blue-500",
  "bg-emerald-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-pink-500",
  "bg-cyan-500",
  "bg-orange-500",
];

function getBoardColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return BOARD_COLORS[Math.abs(hash) % BOARD_COLORS.length];
}

interface ListWithTasks {
  id: string;
  title: string;
  position: number;
  tasks?: Task[];
}

export default function BoardPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const boardId = params.id as string;

  const [createListOpen, setCreateListOpen] = useState(false);
  const [createTaskListId, setCreateTaskListId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [membersOpen, setMembersOpen] = useState(false);
  const [optimisticLists, setOptimisticLists] = useState<ListWithTasks[] | null>(null);

  const { data: boardData, isLoading: loadingBoard } = useQuery({
    queryKey: ["board", boardId],
    queryFn: () => getBoardById(boardId),
    enabled: !!boardId,
  });

  const { data: listsData, refetch: refetchLists } = useQuery({
    queryKey: ["board-lists", boardId],
    queryFn: () => getAllList(boardId),
    enabled: !!boardId,
  });

  const { data: roleData } = useQuery({
    queryKey: ["board-my-role", boardId],
    queryFn: () => getMyRoleOnBoard(boardId),
    enabled: !!boardId,
  });

  const { data: membersData } = useQuery({
    queryKey: ["board-members", boardId],
    queryFn: () => getBoardMembers(boardId),
    enabled: !!boardId,
  });

  const board = boardData?.success ? boardData.data : null;
  const serverLists: ListWithTasks[] = useMemo(() => {
    if (!listsData?.success) return [];
    return (listsData.data as ListWithTasks[]) ?? [];
  }, [listsData]);

  // Reset optimistic state when server data refreshes
  useEffect(() => {
    setOptimisticLists(null);
  }, [listsData]);

  const lists = optimisticLists ?? serverLists;

  const myRole = roleData?.success ? roleData.data.role : null;
  const isAdmin = myRole === "OWNER" || myRole === "ADMIN";
  const canEditTasks = isAdmin || myRole === "MEMBER";
  const members = membersData?.success ? membersData.data : [];

  if (loadingBoard) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <div className="h-8 w-32 bg-[#F1F5F9] rounded animate-pulse" />
        <div className="rounded-xl bg-white shadow-sm border border-[#E2E8F0] p-6 h-24 animate-pulse" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-64 bg-[#F1F5F9] rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="p-8 max-w-5xl mx-auto flex flex-col items-center justify-center py-24 text-center">
        <p className="text-[#1E293B] font-medium text-lg">Quadro não encontrado</p>
        <p className="text-sm text-[#94A3B8] mt-1">
          O quadro que você está procurando não existe ou você não tem acesso.
        </p>
        <button
          onClick={() => router.push("/dashboard")}
          className="mt-4 px-4 py-2 bg-[#C01010] text-white rounded-lg text-sm font-medium hover:bg-[#a00d0d] transition-colors"
        >
          Voltar para o início
        </button>
      </div>
    );
  }

  async function handleDeleteList(id: string, title: string) {
    if (!confirm(`Excluir a lista "${title}" e todas as suas tarefas?`)) return;
    const r = await deleteList(id);
    if (r.success) {
      toast.success("Lista excluída");
      refetchLists();
    } else {
      toast.error(r.error || "Erro ao excluir lista");
    }
  }

  async function handleDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }
    if (!canEditTasks) {
      toast.error("Você não tem permissão para mover tarefas");
      return;
    }

    // Build optimistic state
    const sourceListId = source.droppableId;
    const destListId = destination.droppableId;
    const next = lists.map((l) => ({
      ...l,
      tasks: [...(l.tasks ?? [])].sort((a, b) => a.position - b.position),
    }));
    const srcList = next.find((l) => l.id === sourceListId);
    const dstList = next.find((l) => l.id === destListId);
    if (!srcList || !dstList || !srcList.tasks) return;

    const [moved] = srcList.tasks.splice(source.index, 1);
    if (!moved) return;
    if (!dstList.tasks) dstList.tasks = [];

    if (sourceListId === destListId) {
      dstList.tasks.splice(destination.index, 0, moved);
    } else {
      moved.listId = destListId;
      dstList.tasks.splice(destination.index, 0, moved);
    }

    // Reassign positions
    srcList.tasks.forEach((t, i) => {
      t.position = i;
    });
    if (sourceListId !== destListId) {
      dstList.tasks.forEach((t, i) => {
        t.position = i;
      });
    }

    setOptimisticLists(next);

    // Persist
    const r =
      sourceListId === destListId
        ? await moveTask(draggableId, destination.index)
        : await moveTaskOtherList(draggableId, destination.index, destListId);

    if (!r.success) {
      toast.error(r.error || "Erro ao mover tarefa");
      setOptimisticLists(null);
    }
    queryClient.invalidateQueries({ queryKey: ["board-lists", boardId] });
  }

  const initial = (board.name ?? "?")[0].toUpperCase();
  const colorClass = getBoardColor(board.name ?? "");

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      <button
        onClick={() => router.push("/dashboard")}
        className="flex items-center gap-2 text-sm text-[#64748B] hover:text-[#C01010] transition-colors"
      >
        <ArrowLeft size={16} />
        Voltar
      </button>

      {/* Board header */}
      <div className="rounded-xl bg-white shadow-sm border border-[#E2E8F0] p-6 flex items-center gap-4">
        <div
          className={`flex items-center justify-center w-16 h-16 rounded-xl ${colorClass} text-white font-bold text-2xl shadow-sm`}
        >
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold text-[#1E293B] leading-tight">{board.name}</h1>
          {board.description ? (
            <p className="text-sm text-[#64748B] mt-1">{board.description}</p>
          ) : (
            <p className="text-sm text-[#94A3B8] mt-1 italic">Sem descrição</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setMembersOpen(true)}
            className="gap-1.5"
          >
            <Users size={16} />
            Membros ({members.length})
          </Button>
          {isAdmin && (
            <Button
              type="button"
              onClick={() => setCreateListOpen(true)}
              className="gap-1.5 bg-red-600 hover:bg-red-700 text-white"
            >
              <Plus size={16} />
              Nova lista
            </Button>
          )}
        </div>
      </div>

      {/* Kanban */}
      {lists.length === 0 ? (
        <div className="rounded-xl bg-white shadow-sm border border-[#E2E8F0] p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-[#F1F5F9] flex items-center justify-center mx-auto mb-3">
            <Layout size={20} className="text-[#94A3B8]" />
          </div>
          <p className="text-sm font-medium text-[#1E293B]">Nenhuma lista ainda</p>
          <p className="text-xs text-[#94A3B8] mt-1">
            {isAdmin
              ? "Crie a primeira lista (ex: Backlog, Em progresso, Concluído)"
              : "Aguarde um admin criar listas neste quadro."}
          </p>
          {isAdmin && (
            <Button
              type="button"
              onClick={() => setCreateListOpen(true)}
              className="mt-4 bg-red-600 hover:bg-red-700 text-white gap-1.5"
            >
              <Plus size={16} />
              Criar primeira lista
            </Button>
          )}
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {lists.map((list) => {
              const tasks = (list.tasks ?? [])
                .slice()
                .sort((a, b) => a.position - b.position);
              return (
                <div
                  key={list.id}
                  className="flex-shrink-0 w-80 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] p-3 flex flex-col max-h-[calc(100vh-280px)]"
                >
                  <div className="flex items-center justify-between mb-3 px-1">
                    <h3 className="font-semibold text-[#1E293B] text-sm truncate">
                      {list.title}
                    </h3>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-[#94A3B8] bg-white border border-[#E2E8F0] rounded px-1.5 py-0.5">
                        {tasks.length}
                      </span>
                      {isAdmin && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              aria-label="Opções da lista"
                            >
                              <MoreHorizontal size={14} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleDeleteList(list.id, list.title)}
                              className="text-red-600"
                            >
                              <Trash2 size={14} className="mr-2" />
                              Excluir lista
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>

                  <Droppable
                    droppableId={list.id}
                    type="task"
                    ignoreContainerClipping
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 overflow-y-auto space-y-2 pr-1 transition-colors rounded-md min-h-[80px] ${
                          snapshot.isDraggingOver ? "bg-red-50/40" : ""
                        }`}
                      >
                        {tasks.map((t, idx) => (
                          <Draggable
                            key={t.id}
                            draggableId={t.id}
                            index={idx}
                            isDragDisabled={!canEditTasks}
                          >
                            {(dragProvided, dragSnapshot) => (
                              <div
                                ref={dragProvided.innerRef}
                                {...dragProvided.draggableProps}
                                {...dragProvided.dragHandleProps}
                                className={
                                  dragSnapshot.isDragging
                                    ? "rotate-1 shadow-lg"
                                    : ""
                                }
                              >
                                <TaskCard
                                  task={t}
                                  members={members}
                                  onClick={() => setEditingTask(t)}
                                />
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>

                  {canEditTasks && (
                    <button
                      type="button"
                      onClick={() => setCreateTaskListId(list.id)}
                      className="mt-2 w-full flex items-center justify-center gap-1.5 text-sm text-[#64748B] hover:text-[#C01010] hover:bg-white rounded-lg py-2 transition-colors"
                    >
                      <Plus size={14} />
                      Adicionar tarefa
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </DragDropContext>
      )}

      {/* Dialogs */}
      <CreateListDialog
        boardId={boardId}
        isOpen={createListOpen}
        onClose={() => setCreateListOpen(false)}
        nextPosition={lists.length}
      />

      {createTaskListId && (
        <CreateTaskDialog
          isOpen={!!createTaskListId}
          onClose={() => setCreateTaskListId(null)}
          listId={createTaskListId}
          boardId={boardId}
          nextPosition={
            (lists.find((l) => l.id === createTaskListId)?.tasks?.length ?? 0)
          }
          members={members}
          canAssign={isAdmin}
        />
      )}

      <EditTaskDialog
        task={editingTask}
        boardId={boardId}
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        members={members}
        canAssign={isAdmin}
        canDelete={canEditTasks}
      />

      <MembersDialog
        boardId={boardId}
        isOpen={membersOpen}
        onClose={() => setMembersOpen(false)}
        canManage={isAdmin}
      />
    </div>
  );
}
