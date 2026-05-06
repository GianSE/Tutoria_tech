import { useEffect, useState, useCallback } from "react";
import { 
  Users, ExternalLink, Plus, Pencil, Trash2, Loader2, AlertCircle, MessageCircle, 
  Send, Eye, Search, Filter, X, ChevronDown, LayoutGrid, List, User, Lock, UserPlus, LogIn
} from "lucide-react";
import Modal from "../components/Modal";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../lib/api";

const STATUS_STYLE = {
  IDEACAO:           "bg-amber-500/15  text-amber-400  border-amber-500/30",
  EM_DESENVOLVIMENTO: "bg-blue-500/15   text-blue-400   border-blue-500/30",
  PROTOTIPAGEM:      "bg-violet-500/15 text-violet-400 border-violet-500/30",
  CONCLUIDO:         "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
};

const STATUS_LABELS = {
  IDEACAO: "Ideação",
  PROTOTIPAGEM: "Prototipagem",
  EM_DESENVOLVIMENTO: "Em Desenvolvimento",
  CONCLUIDO: "Concluído",
};

const EMPTY_FORM = {
  name: "", description: "", mentorId: "", telegramUrl: "", whatsappUrl: "",
  accessCode: "", status: "IDEACAO", studentIds: [],
};

export default function TutoriasPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const isStudent = user?.role === "ALUNA";

  const [teams, setTeams]           = useState([]);
  const [allUsers, setAllUsers]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [viewMode, setViewMode]     = useState("grid"); 
  const [modalOpen, setModalOpen]   = useState(false);
  const [editingId, setEditingId]   = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [viewTeam, setViewTeam]     = useState(null);
  const [joinTeam, setJoinTeam]     = useState(null);
  const [joinCode, setJoinCode]     = useState("");
  const [joining, setJoining]       = useState(false);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [formError, setFormError]   = useState("");

  const mentoras = allUsers.filter((u) => u.role === "MENTORA");
  const alunas   = allUsers.filter((u) => u.role === "ALUNA");

  const fetchTeams = useCallback(async () => {
    try {
      const res = await apiFetch("/api/teams");
      setTeams(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTeams(); }, [fetchTeams]);

  useEffect(() => {
    apiFetch("/api/users")
      .then((r) => r.json())
      .then(setAllUsers)
      .finally(() => setUsersLoading(false));
  }, []);

  const canManage = (team) => isAdmin || (user?.role === "MENTORA" && team.mentorId === user.id);
  const isMember = (team) => team.students?.some(s => s.id === user?.id) || team.mentorId === user?.id || isAdmin;

  const openNew = () => {
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      mentorId: user?.role === "MENTORA" ? String(user.id) : "",
    });
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (team) => {
    setEditingId(team.id);
    setForm({
      name:        team.name,
      description:  team.description ?? "",
      mentorId:    String(team.mentorId),
      telegramUrl:  team.telegramUrl  ?? "",
      whatsappUrl:  team.whatsappUrl  ?? "",
      accessCode:   team.accessCode   ?? "",
      status:       team.status,
      studentIds:   team.students?.map((s) => s.id) ?? [],
    });
    setFormError("");
    setModalOpen(true);
  };

  const toggleStudent = (id) => {
    setForm((p) => ({
      ...p,
      studentIds: p.studentIds.includes(id)
        ? p.studentIds.filter((s) => s !== id)
        : [...p.studentIds, id],
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      const payload = {
        name:         form.name,
        description:  form.description || null,
        mentorId:     Number(form.mentorId),
        telegramUrl:  form.telegramUrl  || null,
        whatsappUrl:  form.whatsappUrl  || null,
        accessCode:   form.accessCode   || null,
        status:       form.status,
        studentIds:   form.studentIds,
      };

      const res = await apiFetch(
        editingId ? `/api/teams/${editingId}` : "/api/teams",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Erro ao salvar equipe.");
      await fetchTeams();
      setModalOpen(false);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    setJoining(true);
    setFormError("");
    try {
      const res = await apiFetch(`/api/teams/${joinTeam.id}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: joinCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Código incorreto.");
      await fetchTeams();
      setJoinTeam(null);
      setJoinCode("");
    } catch (err) {
      setFormError(err.message);
    } finally {
      setJoining(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDel) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/teams/${confirmDel.id}`, { method: "DELETE" });
      await fetchTeams();
      setConfirmDel(null);
    } finally {
      setDeleting(false);
    }
  };

  const filtered = teams.filter((team) => {
    const matchesSearch = !search || team.name.toLowerCase().includes(search.toLowerCase()) || team.mentor?.name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "Todos" || team.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const counts = {
    total: teams.length,
    ideacao: teams.filter(t => t.status === "IDEACAO").length,
    desenvolvimento: teams.filter(t => t.status === "EM_DESENVOLVIMENTO").length,
    prototipagem: teams.filter(t => t.status === "PROTOTIPAGEM").length,
    concluido: teams.filter(t => t.status === "CONCLUIDO").length,
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Tutorias</h2>
          <p className="text-slate-400 text-sm mt-1">Relação de equipes, mentoras, alunas e projetos.</p>
        </div>
        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="hidden md:flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 mr-1">
            <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded-lg transition-all ${viewMode === "grid" ? "bg-violet-600 text-white shadow-lg shadow-violet-500/20" : "text-slate-500 hover:text-slate-300"}`}><LayoutGrid size={16} /></button>
            <button onClick={() => setViewMode("list")} className={`p-1.5 rounded-lg transition-all ${viewMode === "list" ? "bg-violet-600 text-white shadow-lg shadow-violet-500/20" : "text-slate-500 hover:text-slate-300"}`}><List size={16} /></button>
          </div>

          <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border ${showFilters ? "bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/20" : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white"}`}>
            <Filter size={16} /> {showFilters ? "Ocultar Filtros" : "Filtrar"}
          </button>
          {!isStudent && (
            <button onClick={openNew} className="btn-primary px-5 py-2.5 flex items-center gap-2 shadow-lg shadow-violet-500/20">
              <Plus size={18} /> Nova Equipe
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filters Card */}
      {showFilters && (
        <div className="card space-y-5 !p-5 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-8 relative group">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-violet-400 transition-colors" />
              <input type="text" placeholder="Buscar por nome da equipe ou mentora..." className="input-field pl-11 !py-3" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="md:col-span-3 relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"><Users size={16} /></div>
              <select className="input-field pl-10 appearance-none !py-3" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="Todos">Todos os status</option>
                {Object.keys(STATUS_LABELS).map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>
            <div className="md:col-span-1">
              <button onClick={() => { setSearch(""); setStatusFilter("Todos"); }} className="w-full h-full flex items-center justify-center text-slate-400 hover:text-white bg-slate-800 rounded-xl hover:bg-slate-700 transition-all border border-slate-700" title="Limpar filtros"><X size={18} /></button>
            </div>
          </div>
        </div>
      )}

      {/* Grid Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="card animate-pulse h-48 bg-slate-800/20" />)}
        </div>
      ) : (
        <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" : "flex flex-col gap-3"}>
          {filtered.map((team) => {
            const userInTeam = isMember(team);
            const userCanManage = canManage(team);

            return (
              <div key={team.id}
                onClick={() => setViewTeam(team)}
                className={`card hover:border-violet-500/40 transition-all duration-300 flex cursor-pointer group relative overflow-hidden p-0
                           ${viewMode === "grid" ? "flex-col" : "flex-row items-center min-h-[80px]"}`}>
                
                <div className="absolute inset-0 bg-gradient-to-tr from-violet-500/0 via-violet-500/0 to-violet-500/[0.02] pointer-events-none" />

                {/* Status Strip / Header */}
                <div className={`${viewMode === "grid" ? "h-1.5 w-full" : "w-1.5 h-full self-stretch shrink-0"} ${STATUS_STYLE[team.status]?.split(" ")[0].replace("bg-", "bg-").replace("/15", "") ?? "bg-slate-700"}`} />

                <div className={`flex-1 p-4 flex flex-col`}>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <span className={`inline-block text-[8px] font-bold px-2 py-0.5 rounded-md border shadow-sm tracking-tight mb-1
                                        ${STATUS_STYLE[team.status] ?? STATUS_STYLE.IDEACAO}`}>
                        {STATUS_LABELS[team.status]?.toUpperCase() ?? team.status}
                      </span>
                      <h3 className="text-white font-bold text-base md:text-sm group-hover:text-violet-300 transition-colors leading-tight truncate">{team.name}</h3>
                    </div>

                    <div className="flex gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      {userCanManage && (
                        <button onClick={() => openEdit(team)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-700 hover:text-white transition-all">
                          <Pencil size={14} />
                        </button>
                      )}
                      {!userInTeam && isStudent && (
                        <button onClick={() => setJoinTeam(team)} className="w-8 h-8 rounded-lg flex items-center justify-center text-emerald-500 hover:bg-emerald-500/10 transition-all" title="Entrar na Tutoria">
                          <UserPlus size={16} />
                        </button>
                      )}
                      {isAdmin && (
                        <button onClick={() => setConfirmDel({ id: team.id, name: team.name })} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-all">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {team.description && (
                    <p className="text-slate-400 text-[11px] leading-relaxed line-clamp-2 min-h-[32px] mb-4">
                      {team.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-800/50 group-hover:border-slate-700/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white text-[9px] font-bold shadow-lg shadow-violet-500/20">
                          {team.mentor?.name?.charAt(0) ?? "?"}
                        </div>
                        <span className="text-[10px] text-slate-300 font-medium hidden sm:inline">{team.mentor?.name?.split(" ")[0]}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users size={12} className="text-slate-600" />
                        <span className="text-[10px] text-slate-300 font-bold">{team.students?.length ?? 0}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex gap-2">
                        {team.whatsappUrl && <MessageCircle size={14} className="text-emerald-500 opacity-60" />}
                        {team.telegramUrl && <Send size={14} className="text-sky-500 opacity-60" />}
                      </div>
                      <div className="w-px h-3 bg-slate-800 mx-1 hidden md:block" />
                      <span className="text-[10px] text-violet-400 font-bold flex items-center gap-1">
                        Ver <ExternalLink size={12} />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Join Team Modal */}
      <Modal isOpen={!!joinTeam} onClose={() => setJoinTeam(null)} title="Entrar na Tutoria" size="sm">
        <form onSubmit={handleJoin} className="space-y-4">
          <p className="text-slate-400 text-sm">Insira a senha fornecida pelo Mentor para entrar na equipe <span className="text-white font-bold">{joinTeam?.name}</span>.</p>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Senha de Acesso</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input type="password" required className="input-field pl-10" placeholder="••••••••" value={joinCode} onChange={(e) => setJoinCode(e.target.value)} />
            </div>
          </div>
          {formError && <div className="text-red-400 text-xs bg-red-500/10 p-3 rounded-lg border border-red-500/20">{formError}</div>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setJoinTeam(null)} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Cancelar</button>
            <button type="submit" disabled={joining} className="btn-primary flex items-center gap-2">
              {joining ? <Loader2 size={15} className="animate-spin" /> : <LogIn size={15} />} Entrar
            </button>
          </div>
        </form>
      </Modal>

      {/* View Team Modal */}
      <Modal isOpen={!!viewTeam} onClose={() => setViewTeam(null)} title={viewTeam?.name ?? "Equipe"} size="md">
        {viewTeam && (
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shadow-sm ${STATUS_STYLE[viewTeam.status] ?? STATUS_STYLE.IDEACAO}`}>
                {STATUS_LABELS[viewTeam.status] ?? viewTeam.status}
              </span>
            </div>
            {viewTeam.description ? (
              <div className="bg-slate-900/40 rounded-xl p-4 border border-slate-800"><p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{viewTeam.description}</p></div>
            ) : <p className="text-slate-600 text-sm italic">Sem descrição adicionada.</p>}

            <div className="space-y-4">
              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                <p className="text-[9px] text-slate-500 uppercase font-bold mb-2 tracking-wider">Mentora Responsável</p>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold shadow-lg">{viewTeam.mentor?.name?.charAt(0) ?? "?"}</div>
                  <div className="min-w-0">
                    <p className="text-white text-sm font-bold truncate">{viewTeam.mentor?.name ?? "—"}</p>
                    <p className="text-[11px] text-slate-500 truncate">{viewTeam.mentor?.email}</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                <p className="text-[9px] text-slate-500 uppercase font-bold mb-3 tracking-wider">Canais de Comunicação</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <a href={viewTeam.whatsappUrl || "#"} target="_blank" rel="noopener noreferrer" onClick={(e) => { if(!isMember(viewTeam) && isStudent) { e.preventDefault(); setJoinTeam(viewTeam); } }}
                     className={`flex-1 flex items-center justify-center gap-2.5 py-3 rounded-lg font-bold text-xs border transition-all ${viewTeam.whatsappUrl ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/20" : "bg-slate-900/50 text-slate-700 border-slate-800 pointer-events-none"}`}>
                    <MessageCircle size={18} /> WhatsApp
                  </a>
                  <a href={viewTeam.telegramUrl || "#"} target="_blank" rel="noopener noreferrer" onClick={(e) => { if(!isMember(viewTeam) && isStudent) { e.preventDefault(); setJoinTeam(viewTeam); } }}
                     className={`flex-1 flex items-center justify-center gap-2.5 py-3 rounded-lg font-bold text-xs border transition-all ${viewTeam.telegramUrl ? "bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 border-sky-500/20" : "bg-slate-900/50 text-slate-700 border-slate-800 pointer-events-none"}`}>
                    <Send size={18} /> Telegram
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Editar Equipe" : "Nova Equipe"} size="md">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Nome da Equipe</label>
              <input type="text" required className="input-field" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center gap-2"><Lock size={14} className="text-violet-400" /> Senha da Tutoria</label>
              <input type="text" placeholder="Ex: tech123" className="input-field" value={form.accessCode} onChange={(e) => setForm((p) => ({ ...p, accessCode: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Descrição</label>
            <textarea rows={2} className="input-field resize-none" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Mentora</label>
              <select required className="input-field" value={form.mentorId} onChange={(e) => setForm((p) => ({ ...p, mentorId: e.target.value }))} disabled={!isAdmin}>
                <option value="">Selecione...</option>
                {mentoras.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Status</label>
              <select className="input-field" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
                {Object.keys(STATUS_LABELS).map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Alunas ({form.studentIds.length}) — CRUD de Membros</label>
            <div className="max-h-32 overflow-y-auto space-y-1 bg-slate-900/50 rounded-xl p-2 border border-slate-800">
              {alunas.map((aluna) => (
                <label key={aluna.id} className="flex items-center gap-3 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-slate-800 transition-colors">
                  <input type="checkbox" checked={form.studentIds.includes(aluna.id)} onChange={() => toggleStudent(aluna.id)} className="w-4 h-4 accent-violet-500" />
                  <span className="text-slate-300 text-xs">{aluna.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <input type="url" placeholder="Link do WhatsApp" className="input-field text-xs" value={form.whatsappUrl} onChange={(e) => setForm((p) => ({ ...p, whatsappUrl: e.target.value }))} />
            <input type="url" placeholder="Link do Telegram" className="input-field text-xs" value={form.telegramUrl} onChange={(e) => setForm((p) => ({ ...p, telegramUrl: e.target.value }))} />
          </div>

          <div className="pt-2">
            <label className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center gap-2">
              <Lock size={14} className="text-violet-400" /> Senha da Tutoria (opcional)
            </label>
            <input 
              type="text" 
              placeholder="Ex: 123456 (deixe vazio para não exigir senha)" 
              className="input-field text-sm" 
              value={form.accessCode} 
              onChange={(e) => setForm((p) => ({ ...p, accessCode: e.target.value }))} 
            />
            <p className="text-[10px] text-slate-500 mt-1">Alunas precisarão desta senha para entrar na equipe pelos links sociais.</p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? "Salvando..." : "Salvar Equipe"}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!confirmDel} onClose={() => setConfirmDel(null)} title="Excluir Equipe" size="sm">
        <p className="text-slate-300 text-sm mb-5">Deseja excluir a equipe <span className="font-bold text-white">{confirmDel?.name}</span>?</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setConfirmDel(null)} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Cancelar</button>
          <button onClick={handleDelete} className="px-4 py-2 text-sm bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold">Excluir</button>
        </div>
      </Modal>
    </div>
  );
}
