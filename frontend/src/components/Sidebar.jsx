import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Users, BookOpen,
  FolderOpen, CalendarDays, Sparkles, UserCircle2, Bot, BarChart3, MessageCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const ALL_NAV_ITEMS = [
  {
    to: "/app/dashboard", label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["ADMIN", "MENTORA", "ALUNA"],
  },
  {
    to: "/app/rose-chat", label: "Conversa com Rose",
    icon: MessageCircle,
    roles: ["ADMIN", "MENTORA", "ALUNA"],
  },
  {
    to: "/app/tutorias",  label: "Tutorias",
    icon: BookOpen,
    roles: ["ADMIN", "MENTORA"],            // ← ALUNA não vê
  },
  {
    to: "/app/materiais", label: "Materiais",
    icon: FolderOpen,
    roles: ["ADMIN", "MENTORA", "ALUNA"],
  },
  {
    to: "/app/agenda",    label: "Agenda",
    icon: CalendarDays,
    roles: ["ADMIN", "MENTORA", "ALUNA"],
  },
  {
    to: "/app/perfil",    label: "Meu Perfil",
    icon: UserCircle2,
    roles: ["ADMIN", "MENTORA", "ALUNA"],
  },
  {
    to: "/app/usuarios",  label: "Usuários",
    icon: Users,
    roles: ["ADMIN"],                       // ← apenas ADMIN
  },
  {
    to: "/app/analytics-ia", label: "Analytics IA",
    icon: BarChart3,
    roles: ["ADMIN"],
  },
  {
    to: "/app/configuracoes-ia", label: "Configuracao da IA",
    icon: Bot,
    roles: ["ADMIN"],
  },
];

export default function Sidebar({ isExpanded }) {
  const { user } = useAuth();
  const role = user?.role ?? "ALUNA";

  const navItems = ALL_NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-slate-900/95 backdrop-blur
                 border-r border-slate-800 flex flex-col z-30 overflow-hidden transition-all duration-300
                 ${isExpanded ? "w-64" : "w-16"}`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-800 min-h-[76px]">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500
                        flex items-center justify-center flex-shrink-0">
          <Sparkles size={18} className="text-white" />
        </div>
        <div className={`transition-opacity duration-200 whitespace-nowrap ${isExpanded ? "opacity-100" : "opacity-0"}`}>
          <p className="font-bold text-white text-sm leading-tight">Tutoria Meninas</p>
          <p className="text-[10px] text-slate-400 leading-tight">Technovation STEM</p>
        </div>
      </div>

      {/* Nav links filtrados por papel */}
      <nav className="flex-1 overflow-y-auto px-3 pt-2 pb-4 space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              [
                "flex items-center py-2.5 min-h-[42px] rounded-xl text-sm font-medium",
                isExpanded ? "justify-start gap-3 px-3" : "justify-center gap-0 px-0",
                "transition-all duration-150",
                isActive
                  ? "bg-violet-600/20 text-violet-400 border border-violet-600/30"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-100",
              ].join(" ")
            }
          >
            {({ isActive }) => (
              <>
                <span className={`${isExpanded ? "w-5" : "w-10"} flex items-center justify-center shrink-0`}>
                  <Icon
                    size={17}
                    className={isActive ? "text-violet-400 opacity-100" : "text-slate-300 opacity-100"}
                  />
                </span>
                <span
                  className={`overflow-hidden whitespace-nowrap transition-all duration-200 ${
                    isExpanded ? "w-[190px] opacity-100" : "w-0 opacity-0"
                  }`}
                >
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className={`px-4 py-4 border-t border-slate-800 transition-opacity duration-200 ${isExpanded ? "opacity-100" : "opacity-0"}`}>
        <p className="text-[10px] text-slate-600 text-center">Technovation Girls 2024 – 2025</p>
      </div>
    </aside>
  );
}
