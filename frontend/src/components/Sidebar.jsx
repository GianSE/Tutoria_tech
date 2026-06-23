import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Users, BookOpen,
  FolderOpen, CalendarDays, Sparkles, Bot, Settings2, TrendingUp, X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";

const ALL_NAV_ITEMS = [
  { to: "/dashboard",             label: "Dashboard",            icon: LayoutDashboard, roles: ["ADMIN", "MENTORA", "ALUNA"] },
  { to: "/equipes",               label: "Equipes",              icon: BookOpen,        roles: ["ADMIN", "MENTORA", "ALUNA"] },
  { to: "/materiais",             label: "Materiais",            icon: FolderOpen,      roles: ["ADMIN", "MENTORA", "ALUNA"] },
  { to: "/agenda",                label: "Agenda",               icon: CalendarDays,    roles: ["ADMIN", "MENTORA", "ALUNA"] },
  { to: "/progresso",             label: "Meu Progresso",        icon: TrendingUp,      roles: ["ALUNA"] },
  { to: "/progresso",             label: "Progresso das Alunas", icon: TrendingUp,      roles: ["MENTORA"] },
  { to: "/gerenciar-usuarios",    label: "Usuários",             icon: Users,           roles: ["ADMIN"] },
  { to: "/configuracoes-ia",      label: "Config. IA",           icon: Bot,             roles: ["ADMIN"] },
  { to: "/configuracoes-paginas", label: "Configurações",        icon: Settings2,       roles: ["ADMIN"] },
];

export default function Sidebar({ isMobileOpen, onMobileClose, mobileOnly }) {
  const { user } = useAuth();
  const { setIsChatOpen } = useChat();
  const [hovered, setHovered] = useState(false);

  const role     = user?.role ?? "ALUNA";
  const navItems = ALL_NAV_ITEMS.filter((item) => item.roles.includes(role));
  const expanded = hovered;

  return (
    <>
      {/* ── Desktop Sidebar — hover expande, flutua sobre o conteúdo ────────── */}
      {!mobileOnly && (
        <aside
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className={`hidden md:flex fixed top-0 left-0 h-screen bg-slate-900/95 backdrop-blur
                     border-r border-slate-800 flex-col z-[60] overflow-hidden transition-all duration-300
                     ${expanded ? "w-64 shadow-2xl shadow-black/40" : "w-16"}`}
        >
          {/* Logo */}
          <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-800 min-h-[76px]">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500
                            flex items-center justify-center flex-shrink-0">
              <Sparkles size={18} className="text-white" />
            </div>
            <div className={`transition-opacity duration-200 whitespace-nowrap ${expanded ? "opacity-100" : "opacity-0"}`}>
              <p className="font-bold text-white text-sm leading-tight">Tutoria Meninas</p>
              <p className="text-[10px] text-slate-400 leading-tight">Technovation STEM</p>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 pt-2 pb-4 space-y-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={`${to}-${label}`}
                to={to}
                className={({ isActive }) =>
                  [
                    "flex items-center py-2.5 min-h-[42px] rounded-xl text-sm font-medium transition-colors duration-150",
                    isActive
                      ? "bg-violet-600/20 text-violet-400 border border-violet-600/30"
                      : "text-slate-400 hover:bg-slate-800 hover:text-slate-100",
                  ].join(" ")
                }
              >
                {({ isActive }) => (
                  <>
                    {/* Ícone fixo — nunca muda de posição */}
                    <span className="w-10 flex items-center justify-center shrink-0">
                      <Icon size={17} className={isActive ? "text-violet-400" : "text-slate-300"} />
                    </span>
                    {/* Texto aparece com fade; sidebar overflow-hidden cuida do corte */}
                    <span className={`whitespace-nowrap transition-opacity duration-200 ${expanded ? "opacity-100" : "opacity-0"}`}>
                      {label}
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </aside>
      )}

      {/* ── Mobile Drawer ────────────────────────────────────────────────────── */}

      {/* Backdrop */}
      <div
        className={`md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300
                    ${isMobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={onMobileClose}
      />

      {/* Drawer */}
      <aside
        className={`md:hidden fixed top-0 left-0 h-full w-72 bg-slate-900 border-r border-slate-800
                    z-50 flex flex-col transition-transform duration-300 ease-in-out
                    ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
              <Sparkles size={18} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-sm leading-tight">Tutoria Meninas</p>
              <p className="text-[10px] text-slate-400 leading-tight">Technovation STEM</p>
            </div>
          </div>
          <button
            onClick={onMobileClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Fechar menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 pt-3 pb-4 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={`${to}-${label}`}
              to={to}
              onClick={onMobileClose}
              className={({ isActive }) =>
                [
                  "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all",
                  isActive
                    ? "bg-violet-600/20 text-violet-400 border border-violet-600/30"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-100",
                ].join(" ")
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={17} className={isActive ? "text-violet-400" : "text-slate-300"} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Rose IA */}
        <div className="px-3 pb-5 pt-3 border-t border-slate-800">
          <button
            onClick={() => { setIsChatOpen(true); onMobileClose(); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl
                       bg-gradient-to-r from-violet-600/20 to-pink-600/20
                       border border-violet-500/30 text-violet-300 text-sm font-semibold
                       hover:from-violet-600/30 hover:to-pink-600/30 transition-all"
          >
            <div className="w-7 h-7 bg-gradient-to-br from-violet-600 to-pink-500 rounded-lg flex items-center justify-center shrink-0">
              <Sparkles size={14} className="text-white" />
            </div>
            Falar com a Rose IA
          </button>
        </div>
      </aside>
    </>
  );
}
