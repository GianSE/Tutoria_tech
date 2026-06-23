import { NavLink } from "react-router-dom";
import { LayoutDashboard, BookOpen, FolderOpen, CalendarDays, Sparkles, TrendingUp } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";

const dashboard = { to: "/dashboard", label: "Home",      icon: LayoutDashboard };
const tutorias  = { to: "/tutorias",  label: "Tutorias",  icon: BookOpen        };
const materiais = { to: "/materiais", label: "Materiais", icon: FolderOpen      };
const agenda    = { to: "/agenda",    label: "Agenda",    icon: CalendarDays    };
const progresso = { to: "/progresso", label: "Progresso", icon: TrendingUp      };

const ROLE_NAV = {
  ADMIN:   [dashboard, tutorias, materiais, agenda],
  MENTORA: [dashboard, progresso, materiais, agenda],
  ALUNA:   [dashboard, progresso, tutorias, agenda],
};

export default function BottomNav({ isVisible }) {
  const { user } = useAuth();
  const { setIsChatOpen } = useChat();

  const role     = user?.role ?? "ALUNA";
  const navItems = ROLE_NAV[role] ?? ROLE_NAV.ALUNA;

  const leftItems  = navItems.slice(0, 2);
  const rightItems = navItems.slice(2);

  return (
    <nav className={`md:hidden fixed bottom-0 left-0 right-0 h-20 bg-slate-900 border-t border-slate-800 grid grid-cols-5 items-center px-2 pb-5 z-40 transition-transform duration-300 ${!isVisible ? "translate-y-[120%]" : "translate-y-0"}`}>
      {leftItems.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to + label}
          to={to}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 transition-all duration-200
             ${isActive ? "text-violet-400" : "text-slate-500 hover:text-slate-300"}`
          }
        >
          {({ isActive }) => (
            <>
              <div className={`p-1.5 rounded-xl transition-all duration-300 ${isActive ? "bg-violet-600/20 shadow-lg shadow-violet-600/10" : ""}`}>
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className="text-[9px] font-bold uppercase tracking-wider">{label}</span>
            </>
          )}
        </NavLink>
      ))}

      {/* Botão central — Rose IA */}
      <div className="flex flex-col items-center justify-center">
        <button
          onClick={() => setIsChatOpen(true)}
          className="w-8 h-8 bg-gradient-to-br from-violet-600 to-pink-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-violet-500/20 active:scale-90 transition-all hover:scale-110"
        >
          <Sparkles size={16} />
        </button>
        <span className="text-[9px] font-bold text-violet-400 uppercase mt-1">Rose IA</span>
      </div>

      {rightItems.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to + label}
          to={to}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 transition-all duration-200
             ${isActive ? "text-violet-400" : "text-slate-500 hover:text-slate-300"}`
          }
        >
          {({ isActive }) => (
            <>
              <div className={`p-1.5 rounded-xl transition-all duration-300 ${isActive ? "bg-violet-600/20 shadow-lg shadow-violet-600/10" : ""}`}>
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className="text-[9px] font-bold uppercase tracking-wider">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
