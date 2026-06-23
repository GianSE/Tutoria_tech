import { useEffect, useState, useCallback } from "react";
import {
  CalendarDays, MapPin, Clock, Plus, CheckCircle2, Pencil, Trash2, Loader2,
  AlertCircle, Search, Filter, X, ChevronDown, Calendar, ExternalLink,
  ChevronLeft, ChevronRight
} from "lucide-react";
import Modal from "../components/Modal";
import EmptyState from "../components/EmptyState";
import { apiFetch } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

{/* ## interage com /api/schedules                   */}
{/* ## conexão com os endpoints do backend para CRUD */}

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

const STATUS_STYLE = {
  REALIZADA: "bg-emerald-500/15 text-emerald-400",
  PENDENTE:  "bg-slate-600/40   text-slate-300",
  CANCELADA: "bg-red-500/15     text-red-400",
};

const STATUS_LABELS = { REALIZADA: "Realizado", PENDENTE: "Agendado", CANCELADA: "Cancelado" };

const EMPTY_FORM = {
  title: "", description: "", date: "", local: "",
  type: "SESSAO_DE_TUTORIA", status: "PENDENTE",
};

function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR");
}

function fmtMonth(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
}

function fmtDay(iso) {
  if (!iso) return "—";
  return new Date(iso).getDate().toString().padStart(2, "0");
}

export default function AgendaPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const canManage = ["ADMIN", "MENTORA"].includes(user?.role);

  const [schedules, setSchedules]           = useState([]);
  const [loading, setLoading]               = useState(true);
  const [showFilters, setShowFilters]       = useState(false);
  const [search, setSearch]                 = useState("");
  const [filtro, setFiltro]                 = useState("Todos");
  const [statusFiltro, setStatusFiltro]     = useState("Todos");
  const [modalOpen, setModalOpen]           = useState(false);
  const [editingId, setEditingId]           = useState(null);
  const [confirmDel, setConfirmDel]         = useState(null);
  const [form, setForm]                     = useState(EMPTY_FORM);
  const [saving, setSaving]                 = useState(false);
  const [deleting, setDeleting]             = useState(false);
  const [formError, setFormError]           = useState("");
  const [viewEvent, setViewEvent]           = useState(null);
  
  const [sortBy, setSortBy]                 = useState("recent");
  const [currentPage, setCurrentPage]       = useState(1);
  const itemsPerPage = 5;

  const tipos = ["Todos", ...Object.keys(TIPO_LABELS)];

  const fetchSchedules = useCallback(async () => {
    try {
      const res = await apiFetch("/api/schedules");
      setSchedules(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSchedules(); }, [fetchSchedules]);

  const openNew = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (ev) => {
    setEditingId(ev.id);
    const d = new Date(ev.date);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    setForm({
      title:       ev.title,
      description: ev.description ?? "",
      date:        dateStr,
      local:       ev.local ?? "",
      type:        ev.type,
      status:      ev.status,
    });
    setFormError("");
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      const payload = {
        ...form,
        date: new Date(form.date).toISOString(),
      };
      const res = await apiFetch(
        editingId ? `/api/schedules/${editingId}` : "/api/schedules",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Erro ao salvar evento.");
      await fetchSchedules();
      setModalOpen(false);
      addToast(editingId ? "Evento atualizado!" : "Evento criado com sucesso!", "success");
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDel) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/schedules/${confirmDel.id}`, { method: "DELETE" });
      addToast("Evento excluído.", "info");
      await fetchSchedules();
      setConfirmDel(null);
    } finally {
      setDeleting(false);
    }
  };

  const filtered = schedules
    .filter((s) => (search === "" || s.title.toLowerCase().includes(search.toLowerCase()) || s.description?.toLowerCase().includes(search.toLowerCase())))
    .filter((s) => (filtro === "Todos" || s.type === filtro))
    .filter((s) => (statusFiltro === "Todos" || s.status === statusFiltro))
    .sort((a, b) => {
      // Prioridade para PENDENTE (Agendado)
      if (a.status === "PENDENTE" && b.status !== "PENDENTE") return -1;
      if (a.status !== "PENDENTE" && b.status === "PENDENTE") return 1;

      if (sortBy === "az") return a.title.localeCompare(b.title);
      
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      
      if (sortBy === "oldest") return dateA - dateB;
      return dateB - dateA;
    });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const currentItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const counts = {
    total: schedules.length,
    agendados: schedules.filter(s => s.status === "PENDENTE").length,
    realizados: schedules.filter(s => s.status === "REALIZADA").length,
    cancelados: schedules.filter(s => s.status === "CANCELADA").length,
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Agenda de Encontros</h2>
          <p className="text-slate-400 text-sm mt-1">Sessões, Meninas no Lab e Rodas de Conversa.</p>
        </div>
        <div className="flex items-center gap-3 self-start md:self-auto">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border
              ${showFilters 
                ? "bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/20" 
                : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white"}`}
          >
            <Filter size={16} /> {showFilters ? "Ocultar Filtros" : "Filtrar"}
          </button>
          {canManage && (
            <button onClick={openNew} className="btn-primary px-5 py-2.5 flex items-center gap-2 shadow-lg shadow-violet-500/20">
              <Plus size={18} /> Novo Evento
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filters Card - Collapsible */}
      {showFilters && (
        <div className="card space-y-5 !p-5 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-8 relative group">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-violet-400 transition-colors" />
              <input 
                type="text" 
                placeholder="Buscar eventos por título ou descrição..." 
                className="input-field pl-11 !py-3"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <div className="md:col-span-3 relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                <Calendar size={16} />
              </div>
              <select 
                className="input-field pl-10 appearance-none !py-3"
                value={filtro}
                onChange={(e) => { setFiltro(e.target.value); setCurrentPage(1); }}
              >
                {tipos.map(t => <option key={t} value={t}>{TIPO_LABELS[t] ?? (t === "Todos" ? "Todos os tipos" : t)}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>

            <div className="md:col-span-1">
              <button 
                onClick={() => { setSearch(""); setFiltro("Todos"); setStatusFiltro("Todos"); setSortBy("recent"); setCurrentPage(1); }}
                className="w-full h-full flex items-center justify-center text-slate-400 hover:text-white bg-slate-800 rounded-xl hover:bg-slate-700 transition-all border border-slate-700"
                title="Limpar filtros"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-800/50">
            <div className="flex items-center gap-1 bg-slate-900/50 p-1 rounded-xl border border-slate-800">
              {[
                { id: "Todos", label: "Todos", count: counts.total },
                { id: "PENDENTE", label: "Agendados", count: counts.agendados },
                { id: "REALIZADA", label: "Realizados", count: counts.realizados },
                { id: "CANCELADA", label: "Cancelados", count: counts.cancelados },
              ].map((tab) => (
                <button 
                  key={tab.id}
                  onClick={() => setStatusFiltro(tab.id)}
                  className={`px-4 py-2 rounded-lg text-[11px] font-bold transition-all flex items-center gap-2
                    ${statusFiltro === tab.id 
                      ? "bg-slate-800 text-white shadow-sm" 
                      : "text-slate-500 hover:text-slate-300"}`}
                >
                  {tab.label}
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${statusFiltro === tab.id ? "bg-violet-600 text-white" : "bg-slate-800 text-slate-500"}`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <div className="relative min-w-[160px]">
                <select 
                  className="input-field !py-2 text-xs appearance-none pr-10"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="recent">Mais recentes</option>
                  <option value="oldest">Mais antigos</option>
                  <option value="az">A - Z</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista Section */}
      <div className="flex-1 flex flex-col min-h-[400px]">
        {loading ? (
          <div className="space-y-3 flex-1">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card animate-pulse flex gap-4 p-4">
                <div className="w-14 h-14 rounded-xl bg-slate-800 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="w-1/2 h-4 bg-slate-800 rounded" />
                  <div className="w-1/3 h-3 bg-slate-800 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="Nenhum evento encontrado"
            description={search || filtro !== "Todos" || statusFiltro !== "Todos" ? "Tente ajustar os filtros de busca." : "Agende um encontro ou sessão de tutoria."}
            action={search || filtro !== "Todos" || statusFiltro !== "Todos"
              ? { label: "Limpar Filtros", onClick: () => { setSearch(""); setFiltro("Todos"); setStatusFiltro("Todos"); setCurrentPage(1); } }
              : canManage ? { label: "Novo Evento", onClick: openNew } : undefined}
          />
        ) : (
          <div className="space-y-3 flex-1">
            {currentItems.map((ev) => (
              <div key={ev.id}
                onClick={() => setViewEvent(ev)}
                className="card hover:border-violet-500/40 transition-all duration-300 cursor-pointer group relative overflow-hidden p-0">
                
                <div className="absolute inset-0 bg-gradient-to-tr from-violet-500/0 via-violet-500/0 to-violet-500/[0.02] pointer-events-none" />

                <div className="flex flex-row items-stretch min-h-[80px]">
                  {/* Date Side Strip */}
                  <div className="w-16 flex-shrink-0 bg-slate-900/50 border-r border-slate-800 flex flex-col items-center justify-center text-center px-1">
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{fmtMonth(ev.date)}</span>
                    <span className="text-xl font-black text-white leading-tight">{fmtDay(ev.date)}</span>
                    <div className="mt-1 w-1 h-1 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
                  </div>

                  {/* Content Area */}
                  <div className="flex-1 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border shadow-sm tracking-tight
                                          ${TIPO_STYLE[ev.type] ?? ""}`}>
                          {TIPO_LABELS[ev.type]?.toUpperCase() ?? ev.type}
                        </span>
                        <div className={`flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-md border shadow-sm ${STATUS_STYLE[ev.status] ?? ""}`}>
                          {ev.status === "REALIZADA" && <CheckCircle2 size={10} />}
                          {STATUS_LABELS[ev.status]?.toUpperCase() ?? ev.status}
                        </div>
                        {ev.isOverdue && (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-red-500/15 text-red-400 border border-red-500/30 animate-pulse">
                            VENCIDO
                          </span>
                        )}
                      </div>
                      
                      <h3 className="text-white font-bold text-base md:text-sm group-hover:text-violet-300 transition-colors leading-tight">
                        {ev.title}
                      </h3>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                        <span className="flex items-center gap-1.5 font-medium text-[11px] md:text-[10px] text-slate-400">
                          <Clock size={12} className="text-slate-600" /> {fmtDate(ev.date)}
                        </span>
                        {ev.local && (
                          <span className="flex items-center gap-1.5 font-medium text-[11px] md:text-[10px] text-slate-500 truncate max-w-[200px]">
                            <MapPin size={12} className="text-slate-600" /> {ev.local}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions Bar */}
                    <div className="flex items-center justify-between md:justify-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-800/50" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        {canManage && (
                          <>
                            <button onClick={() => openEdit(ev)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center
                                         text-slate-400 hover:bg-slate-700 hover:text-white transition-all">
                              <Pencil size={14} />
                            </button>
                            <button onClick={() => setConfirmDel({ id: ev.id, name: ev.title })}
                              className="w-8 h-8 rounded-lg flex items-center justify-center
                                         text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all">
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-violet-400 bg-violet-500/10 px-3 py-1.5 rounded-lg border border-violet-500/20 md:bg-transparent md:border-0 md:p-0">
                        <span className="text-[10px] font-bold uppercase tracking-widest md:hidden">Ver Detalhes</span>
                        <ExternalLink size={16} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 pt-6">
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => p - 1)}
            className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-800 text-slate-400 hover:bg-slate-800 disabled:opacity-30 transition-all"
          >
            <ChevronLeft size={16} />
          </button>
          
          {[...Array(totalPages)].map((_, i) => (
            <button 
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`w-8 h-8 rounded-lg text-xs font-bold transition-all border
                ${currentPage === i + 1 
                  ? "bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/20" 
                  : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200"}`}
            >
              {i + 1}
            </button>
          ))}

          <button 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => p + 1)}
            className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-800 text-slate-400 hover:bg-slate-800 disabled:opacity-30 transition-all"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Modals follow... same logic as before but updated UI */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}
             title={editingId ? "Editar Evento" : "Novo Evento"}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Título</label>
            <input type="text" required placeholder="Ex: Meninas no Lab #3" className="input-field"
              value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Descrição/Detalhes</label>
            <textarea rows={3} placeholder="O que será abordado? Algum material necessário?" className="input-field resize-none"
              value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Data</label>
              <input type="date" required className="input-field"
                value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Tipo</label>
              <select className="input-field" value={form.type}
                onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}>
                <option value="MENINAS_NO_LAB">Meninas no Lab</option>
                <option value="RODA_DE_CONVERSA">Roda de Conversa</option>
                <option value="SESSAO_DE_TUTORIA">Sessão de Tutoria</option>
                <option value="TECHNOVATION_EVENT">Technovation Event</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Local</label>
            <input type="text" placeholder="Ex: Lab de Informática — Bloco B" className="input-field"
              value={form.local} onChange={(e) => setForm((p) => ({ ...p, local: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Status</label>
            <select className="input-field" value={form.status}
              onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
              <option value="PENDENTE">Agendado</option>
              <option value="REALIZADA">Realizado</option>
              <option value="CANCELADA">Cancelado</option>
            </select>
          </div>
          {formError && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10
                            border border-red-500/30 rounded-xl px-4 py-3">
              <AlertCircle size={14} />{formError}
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-sm rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-all">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="btn-primary flex items-center gap-2 disabled:opacity-60">
              {saving ? <><Loader2 size={15} className="animate-spin" />Salvando...</> : <><Plus size={15} />{editingId ? "Salvar" : "Criar Evento"}</>}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!confirmDel} onClose={() => setConfirmDel(null)} title="Confirmar Exclusão" size="sm">
        <p className="text-slate-300 text-sm mb-5">
          Deseja remover o evento <span className="font-semibold text-white">"{confirmDel?.name}"</span>?
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setConfirmDel(null)}
            className="px-4 py-2 text-sm rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-all">
            Cancelar
          </button>
          <button onClick={handleDelete} disabled={deleting}
            className="px-4 py-2 text-sm rounded-lg bg-red-600 hover:bg-red-500 text-white
                       font-semibold flex items-center gap-2 transition-all disabled:opacity-60">
            {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            {deleting ? "Removendo..." : "Remover"}
          </button>
        </div>
      </Modal>

      <Modal isOpen={!!viewEvent} onClose={() => setViewEvent(null)}
             title={viewEvent?.title ?? "Detalhes do Evento"} size="md">
        {viewEvent && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shadow-sm
                                ${TIPO_STYLE[viewEvent.type] ?? ""}`}>
                {TIPO_LABELS[viewEvent.type] ?? viewEvent.type}
              </div>
              <div className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shadow-sm ${STATUS_STYLE[viewEvent.status] ?? ""}`}>
                {STATUS_LABELS[viewEvent.status] ?? viewEvent.status}
              </div>
            </div>

            {viewEvent.description ? (
              <div className="bg-slate-900/40 rounded-xl p-4 border border-slate-800">
                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{viewEvent.description}</p>
              </div>
            ) : (
              <p className="text-slate-600 text-sm italic">Sem descrição para este evento.</p>
            )}

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <CalendarDays size={16} className="text-violet-400" />
                <span className="font-medium">{fmtDate(viewEvent.date)}</span>
              </div>
              {viewEvent.local && (
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <MapPin size={16} className="text-violet-400" />
                  <span className="truncate font-medium">{viewEvent.local}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
