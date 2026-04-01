import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import ChatWidget from "./ChatWidget";

const PAGE_TITLES = {
  "/app/dashboard": "Dashboard",
  "/app/rose-chat": "Conversa com Rose",
  "/app/usuarios":  "Usuários",
  "/app/tutorias":  "Tutorias",
  "/app/materiais": "Materiais de Apoio",
  "/app/agenda":    "Agenda de Encontros",
  "/app/perfil":    "Meu Perfil",
  "/app/configuracoes-ia": "Configuracao da IA",
  "/app/analytics-ia": "Analytics IA",
};

export default function Layout() {
  const { pathname } = useLocation();
  const title = PAGE_TITLES[pathname] ?? "Tutoria Meninas";
  const hideFloatingChatWidget = pathname === "/app/rose-chat";

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <Sidebar />

      {/* Main content — offset pela sidebar (w-64) */}
      <div className="flex-1 ml-64 flex flex-col relative">
        <Header pageTitle={title} />

        {/* Page area — com padding-top para não ficar atrás do header fixo */}
        <main className="flex-1 pt-16 p-6 overflow-y-auto relative">
          <Outlet />
        </main>
      </div>
      
      {/* Assistente IA */}
      {!hideFloatingChatWidget && <ChatWidget />}
    </div>
  );
}
