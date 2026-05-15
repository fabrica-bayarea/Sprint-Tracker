"use client";

import Link from "next/link";
import { Gauge, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function SprintsPage() {
  return (
    <div className="w-full p-10">
      <div className="max-w-md mx-auto mt-16 flex flex-col items-center text-center bg-muted/20 border border-dashed border-border rounded-lg p-10">
        <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center mb-4">
          <Gauge size={26} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Sprints em construção
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Estamos preparando o módulo de planejamento de sprints (burndown,
          velocity e histórico). Por enquanto, organize suas tarefas pelo
          board ou pelo backlog agregado.
        </p>
        <div className="flex gap-2 mt-6">
          <Button asChild variant="outline">
            <Link href="/dashboard">
              <ArrowLeft size={14} className="mr-1" />
              Voltar
            </Link>
          </Button>
          <Button asChild className="bg-red-600 hover:bg-red-700 text-white">
            <Link href="/dashboard/backlog">Ver backlog</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
