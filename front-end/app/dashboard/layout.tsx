import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar/sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-row min-h-svh bg-[#f7f7f8]">
      <Sidebar />
      <div className="flex flex-col w-full">
        <Header />
        <main className="overflow-y-auto h-full">
          {children}
        </main>
      </div>
    </div>
  );
}
