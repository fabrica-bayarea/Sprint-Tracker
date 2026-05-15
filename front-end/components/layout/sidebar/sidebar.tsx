"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HelpCircle, Logs, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { BoardSelect } from "./board-select";

const navItems = [
  { label: "Home", href: "/dashboard", icon: Home },
  { label: "Backlog", href: "/dashboard/backlog", icon: Logs },
  // Sprints fica oculto até ter SprintModule no backend.
  // { label: "Sprints", href: "/dashboard/sprints", icon: Gauge },
];

export default function Sidebar() {
  const pathname = usePathname();

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
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn("px-6 py-3 flex items-center gap-3 rounded-lg text-muted-foreground! hover:bg-red-100 dark:hover:bg-red-950/40 hover:text-red-700! dark:hover:text-red-400! font-semibold",
                isActive ? "bg-red-100 dark:bg-red-950/40 text-red-700! dark:text-red-400!" : ""
              )}
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
        <Link href="#" className="flex px-4 py-3 items-center text-muted-foreground! font-semibold gap-3">
          <HelpCircle size={20} strokeWidth={1.8} />
          <span>Suporte</span>
        </Link>
      </div>
    </aside>
  );
}