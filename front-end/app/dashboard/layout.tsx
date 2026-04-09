import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar/sidebar";

import styles from "./style.module.css";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.dashboardLayout}>
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
