import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { LogOut, UserCircle2, AlertTriangle, Menu, ChevronDown, Users, Bot, Settings2, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";
import Modal from "./Modal";

export default function Header({ pageTitle, isSidebarExpanded, onToggleSidebar, onOpenMobileMenu, isImpersonating, isVisible }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Fecha o menu ao clicar fora
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  return (
    <>
      <header
        className={`h-14 bg-slate-900 border-b border-slate-800
                   relative z-50 flex items-center justify-between pr-4 md:pr-6 transition-all duration-300
                   ${!isVisible ? "hidden md:flex" : "flex"}`}
      >
        <div className="flex items-center gap-2 pl-3">
          {/* Sanduíche mobile — abre drawer com todas as páginas */}
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="flex md:hidden w-9 h-9 rounded-lg items-center justify-center text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            aria-label="Menu completo"
          >
            <Menu size={20} />
          </button>

          {/* Logo Mobile */}
          <div className="flex md:hidden items-center gap-1.5">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Sparkles size={12} className="text-white" />
            </div>
            <span className="text-xs font-bold text-white tracking-tight">Tutoria</span>
          </div>

          {/* Hamburger — desktop */}
          <button
            type="button"
            onClick={onToggleSidebar}
            className="hidden md:flex w-9 h-9 rounded-lg items-center justify-center text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            title="Expandir/retrair menu"
          >
            <Menu size={18} />
          </button>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <NotificationBell />
          {/* Divider */}
          <div className="w-px h-6 bg-slate-700" />

          {/* User dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              className="flex items-center gap-2.5 px-2 py-1 rounded-lg
                         hover:bg-slate-800 transition-all duration-150 cursor-pointer"
            >
              <UserCircle2 size={20} className="text-violet-400 flex-shrink-0" />
              <div className="hidden md:flex flex-col items-start leading-tight">
                <span className="text-sm text-slate-200 font-medium max-w-[140px] truncate">
                  {user?.name ?? user?.email ?? "Usuário"}
                </span>
                <span className="text-[10px] text-slate-500 capitalize">
                  {user?.role?.toLowerCase()}
                </span>
              </div>
              <ChevronDown
                size={14}
                className={`text-slate-500 transition-transform duration-200 ${menuOpen ? "rotate-180" : ""}`}
              />
            </button>

            {/* Dropdown menu */}
            {menuOpen && (
              <div className="absolute right-0 top-10 w-52 bg-slate-900 border border-slate-700
                              rounded-xl shadow-2xl shadow-black/40 z-50 overflow-hidden animate-slide-up">
                <Link
                  to="/perfil"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-slate-300
                             hover:bg-slate-800 hover:text-white transition-colors"
                >
                  <UserCircle2 size={16} className="text-violet-400" />
                  Meu Perfil
                </Link>

                {/* ── Seção Admin ── */}
                {user?.role === "ADMIN" && (
                  <>
                    <div className="border-t border-slate-800">
                      <p className="px-4 pt-2.5 pb-1 text-[10px] font-semibold text-slate-600 uppercase tracking-wider">
                        Administração
                      </p>
                    </div>
                    <Link
                      to="/gerenciar-usuarios"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300
                                 hover:bg-slate-800 hover:text-white transition-colors"
                    >
                      <Users size={16} className="text-slate-400" />
                      Usuários
                    </Link>
                    <Link
                      to="/configuracoes-ia"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300
                                 hover:bg-slate-800 hover:text-white transition-colors"
                    >
                      <Bot size={16} className="text-slate-400" />
                      Configuração da IA
                    </Link>
                    <Link
                      to="/configuracoes-paginas"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300
                                 hover:bg-slate-800 hover:text-white transition-colors"
                    >
                      <Settings2 size={16} className="text-slate-400" />
                      Configurações de Páginas
                    </Link>
                  </>
                )}

                <div className="border-t border-slate-800" />

                <button
                  onClick={() => { setMenuOpen(false); setConfirmOpen(true); }}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-slate-400
                             hover:bg-red-500/10 hover:text-red-400 transition-colors w-full text-left"
                >
                  <LogOut size={16} />
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ─── Modal de confirmação de logout ──────────────────────────────────── */}
      <Modal isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} title="Encerrar sessão" size="sm">
        <div className="flex flex-col items-center text-center gap-4 py-2">
          {/* Ícone de alerta */}
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20
                          flex items-center justify-center">
            <AlertTriangle size={26} className="text-red-400" />
          </div>

          <div>
            <p className="text-white font-semibold text-base">Tem certeza?</p>
            <p className="text-slate-400 text-sm mt-1">
              Você será desconectado da sua conta
              {user?.name ? <> como <span className="text-slate-200 font-medium">{user.name}</span></> : ""}.
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => setConfirmOpen(false)}
            className="flex-1 px-4 py-2.5 text-sm rounded-xl text-slate-300
                       bg-slate-800 hover:bg-slate-700 border border-slate-700
                       hover:border-slate-600 font-medium transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleLogout}
            className="flex-1 px-4 py-2.5 text-sm rounded-xl text-white font-semibold
                       bg-red-600 hover:bg-red-500 flex items-center justify-center gap-2
                       transition-all duration-150"
          >
            <LogOut size={15} />
            Sair
          </button>
        </div>
      </Modal>
    </>
  );
}
