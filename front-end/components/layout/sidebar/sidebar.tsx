"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HelpCircle,
  Logs,
  Home,
  Gauge,
  History,
  KanbanSquare,
  Dices,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BoardSelect } from "./board-select";
import { useBoardStore } from "@/stores/use-board-store";

export default function Sidebar() {
  const pathname = usePathname();
  const { selectedBoardId } = useBoardStore();

  const boardHref = selectedBoardId
    ? `/dashboard/board/${selectedBoardId}`
    : "#";
  const boardDisabled = !selectedBoardId;
  const boardActive = pathname.startsWith("/dashboard/board/");

  const navItems = [
    {
      label: "Home",
      href: "/dashboard",
      icon: Home,
      isActive: pathname === "/dashboard",
      disabled: false,
    },
    {
      label: "Board",
      href: boardHref,
      icon: KanbanSquare,
      isActive: boardActive,
      disabled: boardDisabled,
      disabledTitle: "Selecione um board no dropdown acima primeiro",
    },
    {
      label: "Backlog",
      href: "/dashboard/backlog",
      icon: Logs,
      isActive: pathname === "/dashboard/backlog",
      disabled: false,
    },
    {
      label: "Sprints",
      href: "/dashboard/sprints",
      icon: Gauge,
      isActive: pathname === "/dashboard/sprints",
      disabled: false,
    },
    {
      label: "Histórico",
      href: "/dashboard/sprints/history",
      icon: History,
      isActive: pathname === "/dashboard/sprints/history",
      disabled: false,
    },
    {
      label: "Poker Session",
      href: selectedBoardId ? `/dashboard/board/${selectedBoardId}/poker` : "#",
      icon: Dices,
      isActive: pathname.startsWith(`/dashboard/board/${selectedBoardId}/poker`),
      disabled: !selectedBoardId,
      disabledTitle: "Selecione um board no dropdown acima primeiro",
    },
  ];

  return (
    <aside className="hidden md:flex flex-col gap-8 min-w-64 h-auto bg-muted/50 border-r-border border px-4 py-6">
      <div className="flex gap-2">
        <Link href={"/dashboard"}>
          <Image
            src="/images/iesb-icon.png"
            alt="Logo IESB"
            width={43}
            height={43}
            loading="eager"
          />
        </Link>
        <BoardSelect />
      </div>
      <nav className="flex flex-col gap-2">
        {navItems.map(({ label, href, icon: Icon, isActive, disabled, disabledTitle }) => {
          const baseClass =
            "px-6 py-3 flex items-center gap-3 rounded-lg font-semibold";
          const enabledClass =
            "text-muted-foreground! hover:bg-red-100 dark:hover:bg-red-950/40 hover:text-red-700! dark:hover:text-red-400!";
          const activeClass =
            "bg-red-100 dark:bg-red-950/40 text-red-700! dark:text-red-400!";
          const disabledClass =
            "text-muted-foreground/40 cursor-not-allowed select-none";

          if (disabled) {
            return (
              <span
                key={label}
                title={disabledTitle}
                aria-disabled="true"
                className={cn(baseClass, disabledClass)}
              >
                <Icon size={24} strokeWidth={2} />
                <span>{label}</span>
              </span>
            );
          }

          return (
            <Link
              key={label}
              href={href}
              className={cn(baseClass, enabledClass, isActive && activeClass)}
            >
              <Icon size={24} strokeWidth={2} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col gap-2 mt-auto">
        {/* <button className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-red-600 rounded-lg text-white font-semibold">
          <Plus size={20} strokeWidth={2.5} />
          Criar Tarefa
        </button> */}
        <Link
          href="#"
          className="flex px-4 py-3 items-center text-muted-foreground! font-semibold gap-3"
        >
          <HelpCircle size={20} strokeWidth={1.8} />
          <span>Suporte</span>
        </Link>
      </div>
    </aside>
  );
}
