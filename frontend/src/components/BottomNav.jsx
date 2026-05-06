import { useState, useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, BookOpen, FolderOpen, CalendarDays, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Home",      icon: LayoutDashboard, roles: ["ADMIN", "MENTORA", "ALUNA"] },
  { to: "/tutorias",  label: "Tutorias",  icon: BookOpen,        roles: ["ADMIN", "MENTORA", "ALUNA"] },
  { to: "/materiais", label: "Materiais", icon: FolderOpen,      roles: ["ADMIN", "MENTORA", "ALUNA"] },
  { to: "/agenda",    label: "Agenda",    icon: CalendarDays,    roles: ["ADMIN", "MENTORA", "ALUNA"] },
];

export default function BottomNav() {
  const { user } = useAuth();
  const { setIsChatOpen } = useChat();
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const role = user?.role ?? "ALUNA";

  const navItems = NAV_ITEMS.filter((item) => item.roles.includes(role));

  // Dividir itens para colocar o chat no meio
  const leftItems = navItems.slice(0, 2);
  const rightItems = navItems.slice(2);

  return (
    <nav className={`md:hidden fixed bottom-0 left-0 right-0 h-16 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 flex items-center justify-between px-2 pb-safe z-40 transition-transform duration-300 ${!isVisible ? "translate-y-[200%]" : "translate-y-0"}`}>
      <div className="flex flex-1 justify-around">
        {leftItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-3 py-1 transition-all duration-200
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
      </div>

      {/* AI Center Button */}
      <div className="relative flex flex-col items-center justify-center -top-3">
        <button 
          onClick={() => setIsChatOpen(true)}
          className="w-12 h-12 bg-gradient-to-br from-violet-600 to-pink-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-violet-500/40 border-4 border-slate-950 active:scale-90 transition-all hover:scale-110"
        >
          <Sparkles size={20} />
        </button>
        <span className="text-[9px] font-bold text-violet-400 uppercase mt-1">Rose IA</span>
      </div>

      <div className="flex flex-1 justify-around">
        {rightItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-3 py-1 transition-all duration-200
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
      </div>
    </nav>
  );
}
