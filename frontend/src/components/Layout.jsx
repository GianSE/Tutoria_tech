import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import ChatWidget from "./ChatWidget";
import BottomNav from "./BottomNav";
import { useAuth } from "../context/AuthContext";
import { LogOut, ShieldAlert } from "lucide-react";

const PAGE_TITLES = {
  "/dashboard": "Dashboard",

  "/usuarios":  "Usuários",
  "/tutorias":  "Tutorias",
  "/materiais": "Materiais de Apoio",
  "/agenda":    "Agenda de Encontros",
  "/perfil":    "Meu Perfil",
  "/configuracoes-ia": "Configuracao da IA",
};

export default function Layout() {
  const { user, isImpersonating, stopImpersonating } = useAuth();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const { pathname } = useLocation();
  const title = PAGE_TITLES[pathname] ?? "Tutoria Meninas";


  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row">
      <div className="hidden md:block">
        <Sidebar isExpanded={isSidebarExpanded} />
      </div>

      {/* Main content */}
      <div
        className={`flex-1 flex flex-col relative transition-all duration-300 
                   ${isSidebarExpanded ? "md:ml-64" : "md:ml-16"} ml-0`}
      >
        {isImpersonating && (
          <div className="fixed top-0 right-0 left-0 h-9 bg-amber-500 text-slate-950 px-4 flex items-center justify-between z-[70] shadow-xl font-bold text-xs transition-all duration-300"
               style={{ left: window.innerWidth > 768 ? (isSidebarExpanded ? "256px" : "64px") : "0px" }}>
            <div className="flex items-center gap-2">
              <ShieldAlert size={16} />
              <span className="truncate">Imitando visão: <span className="underline">{user?.name}</span> ({user?.role})</span>
            </div>
            <button onClick={stopImpersonating} 
              className="bg-slate-950 text-white px-2.5 py-1 rounded-lg flex items-center gap-1.5 hover:bg-slate-900 transition-all text-[10px] shrink-0">
              <LogOut size={12} /> Sair
            </button>
          </div>
        )}

        <div className={`transition-all duration-300 ${isImpersonating ? "mt-9" : ""}`}>
          <Header
            pageTitle={title}
            isSidebarExpanded={isSidebarExpanded}
            onToggleSidebar={() => setIsSidebarExpanded((prev) => !prev)}
            isImpersonating={isImpersonating}
          />
        </div>

        {/* Page area centralizada para melhor uso do espaço */}
        <main className={`flex-1 p-4 md:p-6 overflow-y-auto relative transition-all duration-300 ${isImpersonating ? "pt-24" : "pt-14"} pb-24 md:pb-6`}>
          <div className="w-full max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
      
      {/* Mobile Bottom Nav */}
      <BottomNav />

      {/* Assistente IA */}
      <ChatWidget />
    </div>
  );
}
