import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar/sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-row h-svh bg-background">
      <Sidebar />
      <div className="flex flex-col w-full min-w-0">
        <Header />
        <main className="overflow-y-auto h-full min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}