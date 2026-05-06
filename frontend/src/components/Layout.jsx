import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import ChatWidget from "./ChatWidget";

const PAGE_TITLES = {
  "/dashboard": "Dashboard",
  "/rose-chat": "Conversa com Rose",
  "/usuarios":  "Usuários",
  "/tutorias":  "Tutorias",
  "/materiais": "Materiais de Apoio",
  "/agenda":    "Agenda de Encontros",
  "/perfil":    "Meu Perfil",
  "/configuracoes-ia": "Configuracao da IA",
};

export default function Layout() {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const { pathname } = useLocation();
  const title = PAGE_TITLES[pathname] ?? "Tutoria Meninas";
  const hideFloatingChatWidget = pathname === "/rose-chat";

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <Sidebar isExpanded={isSidebarExpanded} />

      {/* Main content — sem offset lateral; sidebar funciona como overlay */}
      <div
        className={`flex-1 flex flex-col relative transition-all duration-300 ${
          isSidebarExpanded ? "ml-64" : "ml-16"
        }`}
      >
        <Header
          pageTitle={title}
          isSidebarExpanded={isSidebarExpanded}
          onToggleSidebar={() => setIsSidebarExpanded((prev) => !prev)}
        />

        {/* Page area centralizada para melhor uso do espaço */}
        <main className="flex-1 pt-20 p-6 overflow-y-auto relative">
          <div className="w-full max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
      
      {/* Assistente IA */}
      {!hideFloatingChatWidget && <ChatWidget />}
    </div>
  );
}
