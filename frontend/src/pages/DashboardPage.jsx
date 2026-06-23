import { useEffect, useState } from "react";
import {
  Users, FolderOpen, CalendarDays, Star, Loader2, ArrowRight,
  MapPin, Clock, BookOpen, UserCircle2, Search, TrendingUp,
  CheckCircle2, AlertCircle,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api";
import Modal from "../components/Modal";
import EmptyState from "../components/EmptyState";
import { useAuth } from "../context/AuthContext";

/* ─── Constantes compartilhadas ────────────────────────────────────────────── */
const TIPO_STYLE = {
  MENINAS_NO_LAB:     "bg-violet-500/15 text-violet-400 border-violet-500/30",
  RODA_DE_CONVERSA:   "bg-pink-500/15   text-pink-400   border-pink-500/30",
  SESSAO_DE_TUTORIA:  "bg-sky-500/15    text-sky-400    border-sky-500/30",
  TECHNOVATION_EVENT: "bg-amber-500/15  text-amber-400  border-amber-500/30",
};
const TIPO_LABELS = {
  MENINAS_NO_LAB:     "Meninas no Lab",
  RODA_DE_CONVERSA:   "Roda de Conversa",
  SESSAO_DE_TUTORIA:  "Sessão de Tutoria",
  TECHNOVATION_EVENT: "Technovation Event",
};
const STATUS_STYLE  = {
  REALIZADA: "bg-emerald-500/15 text-emerald-400",
  PENDENTE:  "bg-slate-600/40   text-slate-300",
  CANCELADA: "bg-red-500/15     text-red-400",
};
const STATUS_LABELS = { REALIZADA: "Realizado", PENDENTE: "Agendado", CANCELADA: "Cancelado" };

const STAGE_ORDER  = ["INICIO", "DESENVOLVENDO", "AVANCADO", "CONCLUIDO"];
const STAGE_LABELS = { INICIO: "Início", DESENVOLVENDO: "Desenvolvendo", AVANCADO: "Avançado", CONCLUIDO: "Concluído" };
const STAGE_BG     = { INICIO: "bg-slate-700", DESENVOLVENDO: "bg-sky-600", AVANCADO: "bg-violet-600", CONCLUIDO: "bg-emerald-600" };

const STATUS_TEAM_LABEL = {
  IDEACAO: "Ideação", PROTOTIPAGEM: "Prototipagem",
  EM_DESENVOLVIMENTO: "Em Desenvolvimento", CONCLUIDO: "Concluído",
};
const STATUS_TEAM_COLOR = {
  IDEACAO: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  PROTOTIPAGEM: "text-sky-400 bg-sky-500/10 border-sky-500/20",
  EM_DESENVOLVIMENTO: "text-violet-400 bg-violet-500/10 border-violet-500/20",
  CONCLUIDO: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
};

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR");
}

function getGreeting() {
  const h = new Date().getHours();
  if (h >= 6 && h < 12) return { text: "Bom dia", emoji: "☀️" };
  if (h >= 12 && h < 18) return { text: "Boa tarde", emoji: "🌤️" };
  return { text: "Boa noite", emoji: "🌙" };
}

/* ─── Widget de próximos eventos (reutilizado nas 3 views) ──────────────────── */
function UpcomingEvents({ events, loading }) {
  const [viewEvent, setViewEvent] = useState(null);

  return (
    <>
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <CalendarDays size={16} className="text-violet-400" />
            Próximos Encontros
          </h3>
          <Link to="/agenda" className="text-xs text-violet-400 hover:text-violet-300 font-medium flex items-center gap-1 transition-colors">
            Ver tudo <ArrowRight size={12} />
          </Link>
        </div>

        {loading && (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-4 p-3 rounded-xl bg-slate-800/30 animate-pulse">
                <div className="w-12 h-12 rounded-lg bg-slate-800 shrink-0" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="w-1/3 h-3 bg-slate-800 rounded" />
                  <div className="w-1/2 h-2.5 bg-slate-800 rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && events.length === 0 && (
          <EmptyState compact icon={CalendarDays} title="Nenhum evento agendado" description="Acompanhe a agenda para novos encontros." />
        )}

        {!loading && events.length > 0 && (
          <div className="space-y-3">
            {events.map((ev) => (
              <div key={ev.id}
                onClick={() => setViewEvent(ev)}
                className="group flex items-center gap-4 p-3 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-violet-500/50 hover:bg-slate-800/60 transition-all cursor-pointer">
                <div className="w-12 h-12 shrink-0 rounded-lg bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-center">
                  <span className="text-[9px] text-slate-500 font-bold uppercase leading-none">
                    {new Date(ev.date).toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}
                  </span>
                  <span className="text-lg font-bold text-white leading-tight">
                    {new Date(ev.date).getDate().toString().padStart(2, "0")}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200 font-semibold truncate group-hover:text-white transition-colors">{ev.title}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-[10px] text-slate-500">
                      <Clock size={10} /> {fmtDate(ev.date)}
                    </span>
                    {ev.local && (
                      <span className="flex items-center gap-1 text-[10px] text-slate-500 truncate">
                        <MapPin size={10} /> {ev.local}
                      </span>
                    )}
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border hidden sm:block ${TIPO_STYLE[ev.type] ?? "bg-slate-500/10 text-slate-400 border-slate-500/20"}`}>
                  {TIPO_LABELS[ev.type] ?? ev.type}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={!!viewEvent} onClose={() => setViewEvent(null)} title={viewEvent?.title ?? "Detalhes"} size="md">
        {viewEvent && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${TIPO_STYLE[viewEvent.type] ?? ""}`}>
                {TIPO_LABELS[viewEvent.type] ?? viewEvent.type}
              </span>
              <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLE[viewEvent.status] ?? ""}`}>
                {STATUS_LABELS[viewEvent.status] ?? viewEvent.status}
              </span>
            </div>
            {viewEvent.description ? (
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-800">
                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{viewEvent.description}</p>
              </div>
            ) : (
              <p className="text-slate-600 text-sm italic">Sem descrição para este evento.</p>
            )}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <CalendarDays size={16} className="text-violet-400" />
                <span>{fmtDate(viewEvent.date)}</span>
              </div>
              {viewEvent.local && (
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <MapPin size={16} className="text-violet-400" />
                  <span className="truncate">{viewEvent.local}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

/* ─── StatCard (usado pelo Admin) ───────────────────────────────────────────── */
function StatCard({ label, value, icon: Icon, gradient, glow, loading, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`card flex sm:flex-col items-center sm:text-center p-4 sm:py-6 transition-all duration-200 gap-4 sm:gap-0
                  ${onClick ? "cursor-pointer hover:border-violet-500/50 hover:scale-[1.02]" : "hover:border-slate-600"}`}
    >
      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br ${gradient}
                      flex items-center justify-center shadow-lg ${glow} sm:mb-4 shrink-0`}>
        <Icon size={20} className="text-white" />
      </div>
      <div className="flex-1 sm:contents">
        <p className="text-slate-400 text-[10px] font-medium uppercase tracking-wider">{label}</p>
        {loading ? (
          <div className="w-12 h-6 sm:h-10 bg-slate-800 rounded animate-pulse mt-1" />
        ) : (
          <p className="text-xl sm:text-4xl font-bold text-white tracking-tight leading-none">{value ?? "—"}</p>
        )}
      </div>
      {onClick && <ArrowRight size={16} className="sm:hidden text-slate-600" />}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   ADMIN DASHBOARD
   ═══════════════════════════════════════════════════════════════════════════════ */
function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // modais de listas
  const [userList, setUserList] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [modalRole, setModalRole] = useState("");

  const [teamsList, setTeamsList] = useState([]);
  const [showTeamsModal, setShowTeamsModal] = useState(false);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [teamSearch, setTeamSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [materialsList, setMaterialsList] = useState([]);
  const [showMaterialsModal, setShowMaterialsModal] = useState(false);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [materialSearch, setMaterialSearch] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [statsRes, schedRes] = await Promise.all([
          apiFetch("/api/dashboard/stats"),
          apiFetch("/api/schedules"),
        ]);
        if (statsRes.ok) setStats(await statsRes.json());
        if (schedRes.ok) setSchedules(await schedRes.json());
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleShowUsers = async (role) => {
    setModalRole(role);
    setShowUserModal(true);
    setLoadingUsers(true);
    try {
      const res = await apiFetch("/api/users");
      const all = await res.json();
      setUserList(all.filter((u) => u.role === role));
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleShowTeams = async (status = "") => {
    setFilterStatus(typeof status === "string" ? status : "");
    setShowTeamsModal(true);
    setLoadingTeams(true);
    try {
      const res = await apiFetch("/api/teams");
      setTeamsList(await res.json());
    } finally {
      setLoadingTeams(false);
    }
  };

  const handleShowMaterials = async () => {
    setShowMaterialsModal(true);
    setLoadingMaterials(true);
    try {
      const res = await apiFetch("/api/materials");
      setMaterialsList(await res.json());
    } finally {
      setLoadingMaterials(false);
    }
  };

  const CARDS = [
    { label: "Total de Alunas",      value: stats?.totalAlunas,        icon: Users,       gradient: "from-violet-600 to-violet-800", glow: "shadow-violet-500/20",  onClick: () => handleShowUsers("ALUNA") },
    { label: "Total de Mentoras",     value: stats?.totalMentoras,      icon: UserCircle2, gradient: "from-indigo-600 to-indigo-800", glow: "shadow-indigo-500/20",  onClick: () => handleShowUsers("MENTORA") },
    { label: "Equipes Ativas",        value: stats?.equipesAtivas,      icon: BookOpen,    gradient: "from-pink-600 to-rose-700",    glow: "shadow-pink-500/20",    onClick: () => handleShowTeams("") },
    { label: "Materiais Publicados",  value: stats?.materiaisPublicados, icon: FolderOpen,  gradient: "from-emerald-600 to-teal-700", glow: "shadow-emerald-500/20", onClick: handleShowMaterials },
  ];

  const upcomingEvents = schedules.filter((s) => s.status === "PENDENTE").slice(0, 3);

  return (
    <div className="space-y-5">
      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {CARDS.map((card) => <StatCard key={card.label} {...card} loading={loading} />)}
      </div>

      {/* Agenda + Fases */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <UpcomingEvents events={upcomingEvents} loading={loading} />
        </div>

        {/* Fases das Equipes */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Star size={16} className="text-pink-400" />
              Fases das Equipes
            </h3>
            <Link to="/tutorias" className="text-xs text-violet-400 hover:text-violet-300 font-medium flex items-center gap-1 transition-colors">
              Ver Equipes <ArrowRight size={12} />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-1.5 animate-pulse">
                  <div className="w-1/2 h-3 bg-slate-800 rounded" />
                  <div className="h-1.5 bg-slate-800 rounded-full" />
                </div>
              ))}
            </div>
          ) : (stats?.equipesAtivas ?? 0) === 0 ? (
            <EmptyState compact icon={Star} title="Nenhuma equipe cadastrada" description="Crie equipes em Tutorias." />
          ) : (
            <div className="relative pl-4 space-y-6 mt-4">
              <div className="absolute left-6 top-2 bottom-2 w-0.5 bg-slate-800" />
              {[
                { key: "IDEACAO",          label: "IDEAÇÃO",        color: "bg-amber-500",   text: "text-amber-500" },
                { key: "PROTOTIPAGEM",     label: "PROTOTIPAGEM",   color: "bg-sky-500",     text: "text-sky-400" },
                { key: "EM_DESENVOLVIMENTO", label: "DESENVOLVIMENTO", color: "bg-violet-500", text: "text-violet-400" },
                { key: "CONCLUIDO",        label: "CONCLUÍDO",      color: "bg-emerald-500", text: "text-emerald-400" },
              ].map(({ key, label, color, text }) => {
                const count = stats?.teamsPerStatus?.[key] ?? 0;
                const pct   = Math.round((count / (stats?.equipesAtivas || 1)) * 100);
                return (
                  <div key={key}
                    onClick={() => handleShowTeams(key)}
                    className="relative flex items-center justify-between pl-8 group cursor-pointer hover:bg-slate-800/30 p-1.5 rounded-lg -ml-1.5 transition-colors">
                    <div className={`absolute left-[5.5px] w-3 h-3 rounded-full ${color} z-10 group-hover:scale-125 transition-transform duration-300`} />
                    <div>
                      <h4 className={`text-[10px] font-bold tracking-widest ${text}`}>{label}</h4>
                      <p className="text-sm font-semibold text-slate-200 mt-0.5">{count} {count === 1 ? "Equipe" : "Equipes"}</p>
                    </div>
                    <span className="text-sm font-bold text-slate-500 group-hover:text-slate-300 transition-colors">{pct}%</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Usuários */}
      <Modal isOpen={showUserModal} onClose={() => { setShowUserModal(false); setUserSearch(""); }}
        title={modalRole === "ALUNA" ? "Relação de Alunas" : "Relação de Mentoras"} size="md">
        {loadingUsers ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 size={32} className="text-violet-500 animate-spin" />
            <p className="text-slate-400 text-sm">Carregando lista...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative group">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-violet-400 transition-colors" />
              <input type="text" placeholder="Pesquisar por nome ou e-mail..." className="input-field pl-10"
                value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
            </div>
            <div className="space-y-1 max-h-[50vh] overflow-y-auto pr-2">
              {userList.filter((u) => u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase())).length === 0 ? (
                <EmptyState compact icon={Users} title="Nenhum resultado encontrado" />
              ) : (
                userList.filter((u) => u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase())).map((u) => (
                  <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-800">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${modalRole === "ALUNA" ? "bg-violet-500/10 text-violet-400" : "bg-indigo-500/10 text-indigo-400"}`}>
                      {u.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{u.name}</p>
                      <p className="text-xs text-slate-500 truncate">{u.email}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Equipes */}
      <Modal isOpen={showTeamsModal} onClose={() => { setShowTeamsModal(false); setTeamSearch(""); setFilterStatus(""); }}
        title={filterStatus ? `Equipes — ${STATUS_TEAM_LABEL[filterStatus] ?? filterStatus}` : "Relação de Equipes"} size="md">
        {loadingTeams ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 size={32} className="text-violet-500 animate-spin" />
            <p className="text-slate-400 text-sm">Carregando equipes...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative group">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-violet-400 transition-colors" />
              <input type="text" placeholder="Pesquisar por equipe ou mentora..." className="input-field pl-10"
                value={teamSearch} onChange={(e) => setTeamSearch(e.target.value)} />
            </div>
            <div className="space-y-1 max-h-[50vh] overflow-y-auto pr-2">
              {teamsList.filter((t) => {
                const ms = t.name.toLowerCase().includes(teamSearch.toLowerCase()) || t.mentor?.name?.toLowerCase().includes(teamSearch.toLowerCase());
                return ms && (filterStatus ? t.status === filterStatus : true);
              }).length === 0 ? (
                <EmptyState compact icon={BookOpen} title="Nenhuma equipe encontrada" />
              ) : (
                teamsList.filter((t) => {
                  const ms = t.name.toLowerCase().includes(teamSearch.toLowerCase()) || t.mentor?.name?.toLowerCase().includes(teamSearch.toLowerCase());
                  return ms && (filterStatus ? t.status === filterStatus : true);
                }).map((team) => (
                  <div key={team.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-800">
                    <div className="w-10 h-10 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-400 font-bold text-xs">
                      {team.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{team.name}</p>
                      <p className="text-xs text-slate-500 truncate">Mentora: {team.mentor?.name ?? "—"}</p>
                    </div>
                    <span className="text-xs font-bold px-2 py-1 rounded-lg bg-slate-800 text-slate-400 border border-slate-700">
                      {team.students?.length ?? 0} {team.students?.length === 1 ? "aluna" : "alunas"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Materiais */}
      <Modal isOpen={showMaterialsModal} onClose={() => { setShowMaterialsModal(false); setMaterialSearch(""); }}
        title="Relação de Materiais" size="md">
        {loadingMaterials ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 size={32} className="text-violet-500 animate-spin" />
            <p className="text-slate-400 text-sm">Carregando materiais...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative group">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-violet-400 transition-colors" />
              <input type="text" placeholder="Pesquisar por título ou categoria..." className="input-field pl-10"
                value={materialSearch} onChange={(e) => setMaterialSearch(e.target.value)} />
            </div>
            <div className="space-y-1 max-h-[50vh] overflow-y-auto pr-2">
              {materialsList.filter((m) => m.title.toLowerCase().includes(materialSearch.toLowerCase()) || m.category.toLowerCase().includes(materialSearch.toLowerCase())).length === 0 ? (
                <EmptyState compact icon={FolderOpen} title="Nenhum material encontrado" />
              ) : (
                materialsList.filter((m) => m.title.toLowerCase().includes(materialSearch.toLowerCase()) || m.category.toLowerCase().includes(materialSearch.toLowerCase())).map((m) => (
                  <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-800">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold text-xs">
                      {m.title.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{m.title}</p>
                      <p className="text-xs text-slate-500 truncate">Categoria: {m.category}</p>
                    </div>
                    <span className="text-xs font-bold px-2 py-1 rounded-lg bg-slate-800 text-slate-400 border border-slate-700">
                      {m.files?.length ?? 0} {m.files?.length === 1 ? "arquivo" : "arquivos"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   MENTORA DASHBOARD
   ═══════════════════════════════════════════════════════════════════════════════ */
function MentoraDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch("/api/dashboard/my-data");
        if (res.ok) setData(await res.json());
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const myTeams  = data?.myTeams      ?? [];
  const events   = data?.upcomingEvents ?? [];
  const totalStudents = myTeams.reduce((acc, t) => acc + (t.studentCount ?? 0), 0);

  return (
    <div className="space-y-5">
      {/* Métricas rápidas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: "Meus Times",       value: loading ? null : myTeams.length,    icon: BookOpen,    gradient: "from-violet-600 to-violet-800", glow: "shadow-violet-500/20", onClick: () => navigate("/tutorias") },
          { label: "Alunas no Total",  value: loading ? null : totalStudents,     icon: Users,       gradient: "from-pink-600 to-rose-700",    glow: "shadow-pink-500/20",   onClick: () => navigate("/tutorias") },
          { label: "Progresso Geral",  value: loading ? null : "Ver",             icon: TrendingUp,  gradient: "from-sky-600 to-blue-700",     glow: "shadow-sky-500/20",    onClick: () => navigate("/progresso") },
        ].map((c) => <StatCard key={c.label} {...c} loading={loading} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Meus Times */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <BookOpen size={16} className="text-violet-400" />
              Meus Times
            </h3>
            <Link to="/tutorias" className="text-xs text-violet-400 hover:text-violet-300 font-medium flex items-center gap-1 transition-colors">
              Gerenciar <ArrowRight size={12} />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-slate-800/40 animate-pulse" />
              ))}
            </div>
          ) : myTeams.length === 0 ? (
            <EmptyState compact icon={BookOpen}
              title="Nenhum time atribuído"
              description="Você ainda não possui equipes. Crie uma em Tutorias."
              action={{ label: "Ir para Tutorias", onClick: () => navigate("/tutorias") }} />
          ) : (
            <div className="space-y-3">
              {myTeams.map((team) => (
                <div key={team.id}
                  onClick={() => navigate("/progresso")}
                  className="group flex items-center gap-4 p-3 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-violet-500/50 hover:bg-slate-800/60 transition-all cursor-pointer">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400 font-bold text-xs shrink-0">
                    {team.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate group-hover:text-violet-300 transition-colors">{team.name}</p>
                    <p className="text-xs text-slate-500">{team.studentCount} {team.studentCount === 1 ? "aluna" : "alunas"}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border hidden sm:block ${STATUS_TEAM_COLOR[team.status] ?? "text-slate-400 bg-slate-700 border-slate-600"}`}>
                    {STATUS_TEAM_LABEL[team.status] ?? team.status}
                  </span>
                  <ArrowRight size={14} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
                </div>
              ))}
            </div>
          )}
        </div>

        <UpcomingEvents events={events} loading={loading} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   ALUNA DASHBOARD
   ═══════════════════════════════════════════════════════════════════════════════ */
function AlunaDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch("/api/dashboard/my-data");
        if (res.ok) setData(await res.json());
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const teams  = data?.teams          ?? [];
  const events = data?.upcomingEvents ?? [];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Meu Time + Progresso */}
        <div className="card lg:col-span-2 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <TrendingUp size={16} className="text-violet-400" />
              Meu Progresso
            </h3>
            {teams.length > 0 && (
              <Link to="/progresso" className="text-xs text-violet-400 hover:text-violet-300 font-medium flex items-center gap-1 transition-colors">
                Ver detalhes <ArrowRight size={12} />
              </Link>
            )}
          </div>

          {loading ? (
            <div className="space-y-4">
              <div className="h-20 rounded-xl bg-slate-800/40 animate-pulse" />
              <div className="h-10 rounded-xl bg-slate-800/40 animate-pulse" />
            </div>
          ) : teams.length === 0 ? (
            <EmptyState icon={BookOpen}
              title="Você não está em nenhum time"
              description="Use o código de acesso fornecido pela sua mentora para entrar em um time."
              action={{ label: "Ir para Tutorias", onClick: () => navigate("/tutorias") }} />
          ) : (
            <div className="space-y-5">
              {teams.map((team) => {
                const stageIdx = STAGE_ORDER.indexOf(team.myProgress?.stage ?? "INICIO");
                return (
                  <div key={team.id} className="space-y-4">
                    {/* Cabeçalho do time */}
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                      <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400 font-bold text-xs shrink-0">
                        {team.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white">{team.name}</p>
                        <p className="text-xs text-slate-500">Mentora: {team.mentor?.name ?? "—"}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border hidden sm:block ${STATUS_TEAM_COLOR[team.status] ?? "text-slate-400 bg-slate-700 border-slate-600"}`}>
                        {STATUS_TEAM_LABEL[team.status] ?? team.status}
                      </span>
                    </div>

                    {/* Stepper de progresso */}
                    <div className="px-2">
                      <div className="relative flex items-center justify-between">
                        {/* Linha de fundo */}
                        <div className="absolute left-0 right-0 top-4 h-0.5 bg-slate-800" />
                        {/* Linha de progresso */}
                        <div
                          className="absolute left-0 top-4 h-0.5 bg-violet-600 transition-all duration-500"
                          style={{ width: stageIdx === 0 ? "0%" : `${(stageIdx / (STAGE_ORDER.length - 1)) * 100}%` }}
                        />
                        {STAGE_ORDER.map((stage, idx) => {
                          const done    = idx < stageIdx;
                          const current = idx === stageIdx;
                          return (
                            <div key={stage} className="relative flex flex-col items-center gap-2 z-10">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300
                                ${done    ? "bg-violet-600 border-violet-600" : ""}
                                ${current ? "bg-violet-600 border-violet-400 ring-4 ring-violet-500/20" : ""}
                                ${!done && !current ? "bg-slate-900 border-slate-700" : ""}
                              `}>
                                {done ? (
                                  <CheckCircle2 size={14} className="text-white" />
                                ) : (
                                  <span className={`text-[10px] font-bold ${current ? "text-white" : "text-slate-600"}`}>{idx + 1}</span>
                                )}
                              </div>
                              <span className={`text-[9px] font-bold uppercase tracking-wide text-center leading-tight w-14 sm:w-16
                                ${current ? "text-violet-400" : done ? "text-slate-400" : "text-slate-600"}`}>
                                {STAGE_LABELS[stage]}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Notas da mentora */}
                    {team.myProgress?.notes && (
                      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-violet-400 mb-2">Feedback da Mentora</p>
                        <p className="text-slate-300 text-sm leading-relaxed">{team.myProgress.notes}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <UpcomingEvents events={events} loading={loading} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   MAIN EXPORT
   ═══════════════════════════════════════════════════════════════════════════════ */
export default function DashboardPage() {
  const { user } = useAuth();
  const greeting = getGreeting();

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-white">
          {greeting.text}, {user.name?.split(" ")[0]}! {greeting.emoji}
        </h2>
        <p className="text-slate-500 text-sm mt-0.5">
          {user.role === "ADMIN"   && "Visão geral do programa Technovation Girls."}
          {user.role === "MENTORA" && "Acompanhe seus times e próximos encontros."}
          {user.role === "ALUNA"   && "Acompanhe seu progresso na jornada Technovation."}
        </p>
      </div>

      {user.role === "ADMIN"   && <AdminDashboard />}
      {user.role === "MENTORA" && <MentoraDashboard />}
      {user.role === "ALUNA"   && <AlunaDashboard />}
    </div>
  );
}
