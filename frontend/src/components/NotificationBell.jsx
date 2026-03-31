import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, CheckCheck, Clock, ChevronRight } from "lucide-react";

/**
 * Componente de sino de notificações.
 * Busca as últimas atividades em /api/dashboard/activities
 * e usa localStorage para rastrear quais foram lidas.
 */
export default function NotificationBell() {
  const [open, setOpen]             = useState(false);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [lastSeen, setLastSeen]     = useState(
    () => localStorage.getItem("notif_last_seen") ?? "1970-01-01T00:00:00Z"
  );
  const panelRef = useRef(null);

  // Busca atividades ao montar e a cada 60s
  const fetchActivities = useCallback(() => {
    fetch("/api/dashboard/activities")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setActivities(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchActivities();
    const interval = setInterval(fetchActivities, 60_000);
    return () => clearInterval(interval);
  }, [fetchActivities]);

  // Fecha ao clicar fora do painel
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const unreadCount = activities.filter(
    (a) => new Date(a.createdAt) > new Date(lastSeen)
  ).length;

  const markAllRead = () => {
    const now = new Date().toISOString();
    localStorage.setItem("notif_last_seen", now);
    setLastSeen(now);
  };

  const handleOpen = () => {
    setOpen((prev) => !prev);
  };

  function timeAgo(iso) {
    const diff = (Date.now() - new Date(iso)) / 1000;
    if (diff < 60)   return "agora";
    if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
    return new Date(iso).toLocaleDateString("pt-BR");
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Botão do sino */}
      <button
        onClick={handleOpen}
        aria-label="Notificações"
        className="relative w-9 h-9 rounded-lg flex items-center justify-center
                   text-slate-400 hover:bg-slate-800 hover:text-slate-100
                   transition-all duration-150"
      >
        <Bell size={17} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full
                           bg-violet-600 text-white text-[10px] font-bold
                           flex items-center justify-center leading-none
                           animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Painel de notificações */}
      {open && (
        <div className="absolute right-0 top-11 w-80 bg-slate-900 border border-slate-700
                        rounded-2xl shadow-2xl shadow-black/40 z-50 animate-slide-up overflow-hidden">
          {/* Header do painel */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <h3 className="text-white font-semibold text-sm">Notificações</h3>
              {unreadCount > 0 && (
                <span className="text-xs bg-violet-600/30 text-violet-400 px-2 py-0.5 rounded-full font-medium">
                  {unreadCount} nova{unreadCount !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300
                           transition-colors font-medium"
                title="Marcar todas como lidas"
              >
                <CheckCheck size={13} /> Marcar lidas
              </button>
            )}
          </div>

          {/* Lista */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-2 h-2 mt-1.5 rounded-full bg-slate-800 flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="w-full h-3 bg-slate-800 rounded" />
                      <div className="w-1/3 h-2 bg-slate-800 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activities.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell size={28} className="text-slate-700 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">Sem notificações ainda.</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-800/60">
                {activities.map((a) => {
                  const isNew = new Date(a.createdAt) > new Date(lastSeen);
                  return (
                    <li
                      key={a.id}
                      className={[
                        "px-4 py-3 flex items-start gap-3 transition-colors",
                        isNew ? "bg-violet-600/5" : "hover:bg-slate-800/40",
                      ].join(" ")}
                    >
                      {/* Indicador new/read */}
                      <span
                        className={[
                          "mt-1.5 w-2 h-2 rounded-full flex-shrink-0",
                          isNew ? "bg-violet-500" : "bg-slate-700",
                        ].join(" ")}
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs leading-snug ${isNew ? "text-slate-200" : "text-slate-400"}`}>
                          {a.description}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock size={10} className="text-slate-600" />
                          <span className="text-slate-600 text-[10px]">{timeAgo(a.createdAt)}</span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Footer */}
          {activities.length > 0 && (
            <div className="px-4 py-3 border-t border-slate-800">
              <a
                href="/app/dashboard"
                className="flex items-center justify-center gap-1.5 text-xs text-slate-500
                           hover:text-violet-400 transition-colors font-medium"
                onClick={() => setOpen(false)}
              >
                Ver todas no Dashboard
                <ChevronRight size={12} />
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
