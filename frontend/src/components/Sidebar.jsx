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

export default function Sidebar() {
  const { user } = useAuth();
  const role = user?.role ?? "ALUNA";

  const navItems = ALL_NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <aside className="fixed top-0 left-0 h-screen w-64 bg-slate-900 border-r border-slate-800
                      flex flex-col z-20">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500
                        flex items-center justify-center flex-shrink-0">
          <Sparkles size={18} className="text-white" />
        </div>
        <div>
          <p className="font-bold text-white text-sm leading-tight">Tutoria Meninas</p>
          <p className="text-[10px] text-slate-400 leading-tight">Technovation STEM</p>
        </div>
      </div>

      {/* Badge de papel */}
      <div className="px-4 py-2 border-b border-slate-800">
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
          role === "ADMIN"   ? "bg-purple-500/20 text-purple-400" :
          role === "MENTORA" ? "bg-blue-500/20   text-blue-400"   :
                               "bg-slate-600/30  text-slate-400"
        }`}>
          {role}
        </span>
      </div>

      {/* Nav links filtrados por papel */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              [
                "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium",
                "transition-all duration-150 group",
                isActive
                  ? "bg-violet-600/20 text-violet-400 border border-violet-600/30"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-100",
              ].join(" ")
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={17}
                  className={isActive ? "text-violet-400" : "text-slate-500 group-hover:text-slate-300"}
                />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-5 py-4 border-t border-slate-800">
        <p className="text-[10px] text-slate-600 text-center">Technovation Girls 2024 – 2025</p>
      </div>
    </aside>
  );
}
