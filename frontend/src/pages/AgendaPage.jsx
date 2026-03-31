import { useEffect, useState, useCallback } from "react";
import { CalendarDays, MapPin, Clock, Plus, CheckCircle2, Pencil, Trash2, Loader2, AlertCircle, Users } from "lucide-react";
import Modal from "../components/Modal";
import { apiFetch } from "../lib/api";
import { useAuth } from "../context/AuthContext";

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
  title: "", date: "", local: "",
  type: "SESSAO_DE_TUTORIA", status: "PENDENTE", presencas: 0,
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
  const canManage = ["ADMIN", "MENTORA"].includes(user?.role);

  const [schedules, setSchedules]           = useState([]);
  const [loading, setLoading]               = useState(true);
  const [filtro, setFiltro]                 = useState("Todos");
  const [modalOpen, setModalOpen]           = useState(false);
  const [editingId, setEditingId]           = useState(null);
  const [confirmDel, setConfirmDel]         = useState(null);
  const [form, setForm]                     = useState(EMPTY_FORM);
  const [saving, setSaving]                 = useState(false);
  const [deleting, setDeleting]             = useState(false);
  const [formError, setFormError]           = useState("");

  // Estado do modal de presença
  const [presencaModal, setPresencaModal]   = useState(null); // { scheduleId, title }
  const [pUsers, setPUsers]                 = useState([]);
  const [pChecked, setPChecked]             = useState(new Set());
  const [pLoading, setPLoading]             = useState(false);
  const [pSaving, setPSaving]               = useState(false);
  const [allUsers, setAllUsers]             = useState([]);

  const tipos = ["Todos", ...Object.keys(TIPO_LABELS)];

  const fetchSchedules = useCallback(async () => {
    try {
      const res = await fetch("/api/schedules");
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
    // Converte ISO → formato yyyy-MM-dd para o input date
    const d = new Date(ev.date);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    setForm({
      title:     ev.title,
      date:      dateStr,
      local:     ev.local ?? "",
      type:      ev.type,
      status:    ev.status,
      presencas: ev.presencas ?? 0,
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
        date:      new Date(form.date).toISOString(),
        presencas: Number(form.presencas),
      };
      const res = await fetch(
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
      await fetch(`/api/schedules/${confirmDel.id}`, { method: "DELETE" });
      await fetchSchedules();
      setConfirmDel(null);
    } finally {
      setDeleting(false);
    }
  };

  const filtered = filtro === "Todos" ? schedules : schedules.filter((s) => s.type === filtro);

  // Carrega todos os usuários para o checklist de presença
  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then(setAllUsers)
      .catch(() => {});
  }, []);

  const openPresenca = async (ev) => {
    setPresencaModal({ scheduleId: ev.id, title: ev.title });
    setPLoading(true);
    try {
      const res = await fetch(`/api/schedules/${ev.id}/attendance`);
      const data = await res.json();
      const presentIds = new Set((data.attendances ?? []).map((a) => a.user.id));
      setPChecked(presentIds);
    } catch {
      setPChecked(new Set());
    } finally {
      setPLoading(false);
    }
  };

  const togglePresenca = async (userId) => {
    if (!presencaModal) return;
    setPSaving(true);
    try {
      await apiFetch(
        `/api/schedules/${presencaModal.scheduleId}/attendance/${userId}/toggle`,
        { method: "POST" }
      );
      setPChecked((prev) => {
        const next = new Set(prev);
        if (next.has(userId)) next.delete(userId);
        else next.add(userId);
        return next;
      });
      await fetchSchedules(); // atualiza contagem na lista
    } finally {
      setPSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Agenda de Encontros</h2>
          <p className="text-slate-400 text-sm mt-0.5">Sessões, Meninas no Lab e Rodas de Conversa.</p>
        </div>
        <button onClick={openNew} className="btn-primary flex items-center gap-2 self-start sm:self-auto">
          <Plus size={16} /> Novo Evento
        </button>
      </div>

      {/* Filtros por tipo */}
      <div className="flex flex-wrap gap-2">
        {tipos.map((t) => (
          <button key={t} onClick={() => setFiltro(t)}
            className={[
              "px-4 py-1.5 rounded-full text-sm font-medium border transition-all duration-150",
              filtro === t
                ? "bg-violet-600/25 text-violet-300 border-violet-500/50"
                : "bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500 hover:text-slate-200",
            ].join(" ")}>
            {TIPO_LABELS[t] ?? t}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card animate-pulse flex gap-4">
              <div className="w-16 h-16 rounded-xl bg-slate-800 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="w-1/2 h-4 bg-slate-800 rounded" />
                <div className="w-1/3 h-3 bg-slate-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-slate-500 text-sm">
            {schedules.length === 0 ? "Nenhum evento agendado ainda." : "Nenhum evento neste filtro."}
          </p>
          {schedules.length === 0 && (
            <button onClick={openNew} className="btn-primary mt-4 inline-flex items-center gap-2">
              <Plus size={15} /> Agendar primeiro evento
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((ev) => (
            <div key={ev.id}
              className="card hover:border-slate-600 transition-all duration-200
                         flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Data */}
              <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-slate-800 border border-slate-700
                              flex flex-col items-center justify-center text-center">
                <span className="text-[10px] text-slate-500 font-semibold uppercase">{fmtMonth(ev.date)}</span>
                <span className="text-2xl font-bold text-white leading-tight">{fmtDay(ev.date)}</span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className="text-white font-semibold text-sm">{ev.title}</h3>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border
                                    ${TIPO_STYLE[ev.type] ?? ""}`}>
                    {TIPO_LABELS[ev.type] ?? ev.type}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <CalendarDays size={11} />{fmtDate(ev.date)}
                  </span>
                  {ev.local && (
                    <span className="flex items-center gap-1"><MapPin size={11} />{ev.local}</span>
                  )}
                  {ev.status === "REALIZADA" && (
                    <span className="flex items-center gap-1 text-emerald-400">
                      {ev.presencas} presenças
                    </span>
                  )}
                </div>
              </div>

              {/* Status */}
              <div className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5
                                rounded-full flex-shrink-0 ${STATUS_STYLE[ev.status] ?? ""}`}>
                {ev.status === "REALIZADA" && <CheckCircle2 size={12} />}
                {ev.status === "PENDENTE"  && <Clock size={12} />}
                {STATUS_LABELS[ev.status] ?? ev.status}
              </div>

              {/* Ações */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {/* Botão de presença — só para sessões Realizadas e usuários ADMIN/MENTORA */}
                {ev.status === "REALIZADA" && canManage && (
                  <button onClick={() => openPresenca(ev)}
                    title="Registrar presença"
                    className="flex items-center gap-1 px-2.5 h-8 rounded-lg text-xs font-semibold
                               text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all">
                    <Users size={13} /> {ev.presencas}
                  </button>
                )}
                {canManage && (
                  <>
                    <button onClick={() => openEdit(ev)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center
                                 text-slate-500 hover:bg-slate-700 hover:text-slate-200 transition-all">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => setConfirmDel({ id: ev.id, name: ev.title })}
                      className="w-8 h-8 rounded-lg flex items-center justify-center
                                 text-slate-500 hover:bg-red-500/15 hover:text-red-400 transition-all">
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Modal: Criar / Editar Evento ─────────────────────────────────────── */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}
             title={editingId ? "Editar Evento" : "Novo Evento"}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Título</label>
            <input type="text" required placeholder="Ex: Meninas no Lab #3" className="input-field"
              value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Status</label>
              <select className="input-field" value={form.status}
                onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
                <option value="PENDENTE">Agendado</option>
                <option value="REALIZADA">Realizado</option>
                <option value="CANCELADA">Cancelado</option>
              </select>
            </div>
            {form.status === "REALIZADA" && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Presenças</label>
                <input type="number" min={0} className="input-field"
                  value={form.presencas}
                  onChange={(e) => setForm((p) => ({ ...p, presencas: e.target.value }))} />
              </div>
            )}
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

      {/* ─── Modal: Confirmar Exclusão ─────────────────────────────────────────── */}
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

      {/* ─── Modal: Registro de Presença ────────────────────────────────────────── */}
      <Modal isOpen={!!presencaModal} onClose={() => setPresencaModal(null)}
             title={`Presença — ${presencaModal?.title ?? ""}`}>
        <p className="text-slate-500 text-xs mb-4">
          Marque quem esteve presente nesta sessão. Alterações são salvas automaticamente.
        </p>
        {pLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={20} className="animate-spin text-violet-400" />
          </div>
        ) : (
          <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
            {allUsers.length === 0 && (
              <p className="text-slate-500 text-sm text-center py-6">Nenhum usuário cadastrado.</p>
            )}
            {allUsers.map((u) => {
              const isChecked = pChecked.has(u.id);
              return (
                <label key={u.id}
                  className={[
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all",
                    isChecked
                      ? "bg-emerald-500/10 border border-emerald-500/20"
                      : "hover:bg-slate-800 border border-transparent",
                    pSaving ? "opacity-60 pointer-events-none" : "",
                  ].join(" ")}>
                  <input type="checkbox" checked={isChecked} onChange={() => togglePresenca(u.id)}
                    className="w-4 h-4 accent-emerald-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-200 text-sm font-medium">{u.name}</p>
                    <p className="text-slate-500 text-xs">{u.role}</p>
                  </div>
                  {isChecked && <CheckCircle2 size={15} className="text-emerald-400 flex-shrink-0" />}
                </label>
              );
            })}
          </div>
        )}
        <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-800">
          <span className="text-sm text-slate-400">
            <span className="text-white font-bold">{pChecked.size}</span> presente{pChecked.size !== 1 ? "s" : ""}
          </span>
          <button onClick={() => setPresencaModal(null)}
            className="px-4 py-2 text-sm rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-all">
            Fechar
          </button>
        </div>
      </Modal>
    </div>
  );
}
