"use client";

import { Image } from "@/components/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HelpCircle, Gauge, Logs, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { BoardSelect } from "./board-select";

const navItems = [
  { label: "Home", href: "/dashboard", icon: Home },
  { label: "Backlog", href: "/dashboard/backlog", icon: Logs },
  { label: "Sprints", href: "/dashboard/sprints", icon: Gauge },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col gap-8 min-w-64 h-auto bg-[#F8FAFC] border-r-[#E2E8F0] border px-4 py-6">
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
              className={cn("px-6 py-3 flex items-center gap-3 rounded-lg text-[#64748B_!important] hover:bg-[#FEF2F2] hover:text-[#B91C1C_!important] font-semibold",
                isActive ? "bg-[#FEF2F2] text-[#B91C1C_!important]" : ""
              )}
            >
              <Icon size={24} strokeWidth={2} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col gap-2 mt-auto">
        {/* <button className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-[#C01010] rounded-lg text-white font-semibold">
          <Plus size={20} strokeWidth={2.5} />
          Criar Tarefa
        </button> */}
        <Link href="#" className="flex px-4 py-3 items-center text-[#64748B_!important] font-semibold gap-3">
          <HelpCircle size={20} strokeWidth={1.8} />
          <span>Suporte</span>
        </Link>
      </div>
    </aside>
  );
}
