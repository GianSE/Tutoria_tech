import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, UserCircle2, AlertTriangle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";
import Modal from "./Modal";

export default function Header({ pageTitle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      <header className="h-16 bg-slate-900/80 backdrop-blur border-b border-slate-800
                         fixed top-0 left-64 right-0 z-10 flex items-center justify-between px-6">
        {/* Page title */}
        <h1 className="text-slate-100 font-semibold text-base tracking-tight">
          {pageTitle}
        </h1>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <NotificationBell />

          {/* User pill */}
          <div className="flex items-center gap-2.5 bg-slate-800 rounded-xl px-3 py-1.5 border border-slate-700">
            <UserCircle2 size={18} className="text-violet-400 flex-shrink-0" />
            <span className="text-sm text-slate-200 font-medium max-w-[140px] truncate">
              {user?.name ?? user?.email ?? "Usuário"}
            </span>
            <span className="text-[10px] text-slate-500 capitalize hidden sm:inline">
              {user?.role?.toLowerCase()}
            </span>
          </div>

          {/* Logout — abre modal de confirmação */}
          <button
            onClick={() => setConfirmOpen(true)}
            className="w-9 h-9 rounded-lg flex items-center justify-center
                       text-slate-400 hover:bg-red-500/15 hover:text-red-400
                       transition-all duration-150"
            title="Sair"
          >
            <LogOut size={17} />
          </button>
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
