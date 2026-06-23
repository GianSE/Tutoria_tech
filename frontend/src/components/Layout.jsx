import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import ChatWidget from "./ChatWidget";
import BottomNav from "./BottomNav";
import { useAuth } from "../context/AuthContext";
import { LogOut, ShieldAlert } from "lucide-react";

const PAGE_TITLES = {
  "/dashboard":              "Dashboard",
  "/gerenciar-usuarios":     "Gerenciar Usuários",
  "/equipes":                "Equipes",
  "/materiais":              "Materiais de Apoio",
  "/agenda":                 "Agenda de Encontros",
  "/perfil":                 "Meu Perfil",
  "/progresso":              "Progresso",
  "/configuracoes-ia":       "Configuração da IA",
  "/configuracoes-paginas":  "Configurações",
};

export default function Layout() {
  const { user, isImpersonating, stopImpersonating } = useAuth();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { pathname } = useLocation();
  const title = PAGE_TITLES[pathname] ?? "Tutoria Meninas";

  // Fecha o drawer ao navegar
  useEffect(() => { setIsMobileMenuOpen(false); }, [pathname]);

  return (
    <div className="h-screen bg-slate-950 flex flex-col md:flex-row overflow-hidden">
      <div className="hidden md:block h-full">
        <Sidebar isExpanded={isSidebarExpanded} />
      </div>

      {/* Drawer mobile (abre pelo sanduíche do header) */}
      <Sidebar
        isMobileOpen={isMobileMenuOpen}
        onMobileClose={() => setIsMobileMenuOpen(false)}
        mobileOnly
      />

      {/* Área principal */}
      <div
        className={`flex-1 flex flex-col h-full relative transition-all duration-300
                   ${isSidebarExpanded ? "md:ml-64" : "md:ml-16"} ml-0`}
      >
        {/* Banner de Impersonate */}
        {isImpersonating && (
          <div className="h-9 bg-amber-500 text-slate-950 px-4 flex items-center justify-between z-[70] shadow-xl font-bold text-xs shrink-0">
            <div className="flex items-center gap-2">
              <ShieldAlert size={16} />
              <span className="truncate">
                Imitando visão: <span className="underline">{user?.name}</span> ({user?.role})
              </span>
            </div>
            <button
              onClick={stopImpersonating}
              className="bg-slate-950 text-white px-2.5 py-1 rounded-lg flex items-center gap-1.5 hover:bg-slate-900 transition-all text-[10px] shrink-0"
            >
              <LogOut size={12} /> Sair
            </button>
          </div>
        )}

        <Header
          pageTitle={title}
          isSidebarExpanded={isSidebarExpanded}
          onToggleSidebar={() => setIsSidebarExpanded((prev) => !prev)}
          onOpenMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
          isImpersonating={isImpersonating}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6 scroll-smooth">
          <div className="w-full max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Bottom Nav — sempre visível, sem animação de scroll */}
      <BottomNav />

      {/* Assistente IA */}
      <ChatWidget />
    </div>
  );
}
