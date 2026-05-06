import { useState, useRef } from "react";
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
  const [isNavVisible, setIsNavVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollRef = useRef(null);
  const { pathname } = useLocation();
  const title = PAGE_TITLES[pathname] ?? "Tutoria Meninas";

  // Lógica de scroll para mobile (hide/show navs)
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const currentScrollY = scrollRef.current.scrollTop;
    const isMobile = window.innerWidth < 768;

    if (isMobile && currentScrollY > lastScrollY.current && currentScrollY > 50) {
      setIsNavVisible(false);
    } else {
      setIsNavVisible(true);
    }
    lastScrollY.current = currentScrollY;
  };

  return (
    <div className="h-screen bg-slate-950 flex flex-col md:flex-row overflow-hidden">
      <div className="hidden md:block h-full">
        <Sidebar isExpanded={isSidebarExpanded} />
      </div>

      {/* Main content area */}
      <div
        className={`flex-1 flex flex-col h-full relative transition-all duration-300 
                   ${isSidebarExpanded ? "md:ml-64" : "md:ml-16"} ml-0`}
      >
        {/* Banner de Impersonate */}
        {isImpersonating && (
          <div className="h-9 bg-amber-500 text-slate-950 px-4 flex items-center justify-between z-[70] shadow-xl font-bold text-xs shrink-0">
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

        <Header
          pageTitle={title}
          isSidebarExpanded={isSidebarExpanded}
          onToggleSidebar={() => setIsSidebarExpanded((prev) => !prev)}
          isImpersonating={isImpersonating}
          isVisible={isNavVisible}
        />

        {/* Page content with its own scrollbar */}
        <main 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6 scroll-smooth"
        >
          <div className="w-full max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
      
      {/* Mobile Bottom Nav */}
      <BottomNav isVisible={isNavVisible} />

      {/* Assistente IA */}
      <ChatWidget />
    </div>
  );
}
