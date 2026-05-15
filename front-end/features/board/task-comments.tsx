"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MessageSquare, Trash2, Send, Pencil, X, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  getTaskComments,
  createComment,
  updateComment,
  deleteComment,
  type TaskComment,
} from "@/lib/actions/comments";

interface TaskCommentsProps {
  taskId: string;
  currentUserId?: string;
}

function formatDate(d: string) {
  try {
    const date = new Date(d);
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return d;
  }
}

export function TaskComments({ taskId, currentUserId }: TaskCommentsProps) {
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["task-comments", taskId],
    queryFn: () => getTaskComments(taskId),
    enabled: !!taskId,
    staleTime: 15_000,
  });
  const comments: TaskComment[] = data?.success ? data.data : [];

  async function handleSubmit() {
    if (!content.trim()) return;
    setSending(true);
    const r = await createComment(taskId, content.trim());
    setSending(false);
    if (r.success) {
      setContent("");
      queryClient.invalidateQueries({ queryKey: ["task-comments", taskId] });
    } else {
      toast.error(r.error || "Erro ao comentar");
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Cmd/Ctrl + Enter envia. Enter solto continua produzindo nova linha.
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir comentário?")) return;
    const r = await deleteComment(id);
    if (r.success) {
      queryClient.invalidateQueries({ queryKey: ["task-comments", taskId] });
    } else {
      toast.error(r.error || "Erro ao excluir");
    }
  }

  function startEdit(c: TaskComment) {
    setEditingId(c.id);
    setEditContent(c.content);
  }

  async function saveEdit() {
    if (!editingId || !editContent.trim()) return;
    const r = await updateComment(editingId, editContent.trim());
    if (r.success) {
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ["task-comments", taskId] });
    } else {
      toast.error(r.error || "Erro ao editar");
    }
  }

  return (
    <div className="mt-4 border-t border-border pt-4">
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare size={14} className="text-muted-foreground" />
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Comentários {comments.length > 0 && `(${comments.length})`}
        </h4>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-14 bg-muted rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
          {comments.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              Nenhum comentário ainda. Seja o primeiro!
            </p>
          ) : (
            comments.map((c) => {
              const name = c.user.name || c.user.userName || c.user.email || "Usuário";
              const initial = (name[0] || "?").toUpperCase();
              const isAuthor = currentUserId && c.user.id === currentUserId;
              const edited = c.updatedAt && c.updatedAt !== c.createdAt;
              return (
                <div key={c.id} className="flex gap-2.5 group">
                  <div className="w-7 h-7 rounded-full bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 flex items-center justify-center font-semibold text-xs flex-shrink-0">
                    {initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-medium text-foreground">{name}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDate(c.createdAt)}
                        {edited && " · editado"}
                      </span>
                    </div>
                    {editingId === c.id ? (
                      <div className="mt-1 space-y-2">
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={2}
                          autoFocus
                        />
                        <div className="flex gap-2 justify-end">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingId(null)}
                          >
                            <X size={14} />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={saveEdit}
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            <Check size={14} className="mr-1" />
                            Salvar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-foreground whitespace-pre-wrap mt-0.5">
                        {c.content}
                      </p>
                    )}
                  </div>
                  {editingId !== c.id && (
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {isAuthor && (
                        <button
                          type="button"
                          onClick={() => startEdit(c)}
                          className="p-1 text-muted-foreground hover:text-foreground"
                          aria-label="Editar"
                        >
                          <Pencil size={12} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(c.id)}
                        className="p-1 text-muted-foreground hover:text-red-600"
                        aria-label="Excluir"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* div em vez de form: este componente vive dentro do <form> do
          EditTaskDialog, e form aninhado é inválido em HTML (o submit faria
          bubble pro form de cima, salvando a task em vez de criar o comentário). */}
      <div className="mt-3 flex gap-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escreva um comentário... (Ctrl/Cmd+Enter pra enviar)"
          rows={2}
          className="flex-1 text-sm"
        />
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={sending || !content.trim()}
          className="bg-red-600 hover:bg-red-700 text-white self-end"
          size="sm"
        >
          <Send size={14} className="mr-1" />
          {sending ? "..." : "Enviar"}
        </Button>
      </div>
    </div>
  );
}
