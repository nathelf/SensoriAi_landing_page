import { ReactNode, useRef } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { DashboardHeader } from "./DashboardHeader";

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  // ref para o root do conteúdo do dashboard
  const dashboardRef = useRef<HTMLElement | null>(null);

  // função simples que retorna o elemento atual (passada para o Header)
  const getDashboardElement = () => dashboardRef.current;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Passa a função que retorna a referência do dashboard */}
          <DashboardHeader getDashboardElement={getDashboardElement} />
          <main
            id="dashboard-content" // fallback para seletores por id
            ref={dashboardRef}
            className="flex-1 overflow-auto"
          >
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};
