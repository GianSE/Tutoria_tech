import { useEffect, useState, useCallback } from "react";
import { Users, ExternalLink, Plus, Pencil, Trash2, Loader2, AlertCircle } from "lucide-react";
import Modal from "../components/Modal";

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

const EMPTY_FORM = { name: "", mentorId: "", thunkableUrl: "", status: "IDEACAO", studentIds: [] };

export default function TutoriasPage() {
  const [teams, setTeams]           = useState([]);
  const [allUsers, setAllUsers]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [modalOpen, setModalOpen]   = useState(false);
  const [editingId, setEditingId]   = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [formError, setFormError]   = useState("");

  const mentoras = allUsers.filter((u) => u.role === "MENTORA");
  const alunas   = allUsers.filter((u) => u.role === "ALUNA");

  const fetchTeams = useCallback(async () => {
    try {
      const res = await fetch("/api/teams");
      setTeams(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTeams(); }, [fetchTeams]);

  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then(setAllUsers)
      .finally(() => setUsersLoading(false));
  }, []);

  const openNew = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (team) => {
    setEditingId(team.id);
    setForm({
      name: team.name,
      mentorId: String(team.mentorId),
      thunkableUrl: team.thunkableUrl ?? "",
      status: team.status,
      studentIds: team.students?.map((s) => s.id) ?? [],
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
        mentorId:     Number(form.mentorId),
        thunkableUrl: form.thunkableUrl || null,
        status:       form.status,
        studentIds:   form.studentIds,
      };

      const res = await fetch(
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

  const handleDelete = async () => {
    if (!confirmDel) return;
    setDeleting(true);
    try {
      await fetch(`/api/teams/${confirmDel.id}`, { method: "DELETE" });
      await fetchTeams();
      setConfirmDel(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Tutorias</h2>
          <p className="text-slate-400 text-sm mt-0.5">Relação de equipes, mentoras, alunas e apps.</p>
        </div>
        <button onClick={openNew} className="btn-primary flex items-center gap-2 self-start sm:self-auto">
          <Plus size={16} /> Nova Equipe
        </button>
      </div>

      {/* Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card animate-pulse space-y-3">
              <div className="w-1/2 h-5 bg-slate-800 rounded" />
              <div className="w-1/4 h-4 bg-slate-800 rounded" />
              <div className="w-3/4 h-4 bg-slate-800 rounded" />
            </div>
          ))}
        </div>
      ) : teams.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-slate-500 text-sm">Nenhuma equipe cadastrada ainda.</p>
          <button onClick={openNew} className="btn-primary mt-4 inline-flex items-center gap-2">
            <Plus size={15} /> Criar primeira equipe
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {teams.map((team) => (
            <div key={team.id}
              className="card hover:border-slate-600 transition-all duration-200 flex flex-col gap-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-white font-bold text-lg">{team.name}</h3>
                  <span className={`inline-block mt-1 text-xs font-semibold px-2.5 py-0.5
                                    rounded-full border ${STATUS_STYLE[team.status] ?? STATUS_STYLE.IDEACAO}`}>
                    {STATUS_LABELS[team.status] ?? team.status}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(team)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center
                               text-slate-500 hover:bg-slate-700 hover:text-slate-200 transition-all">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => setConfirmDel({ id: team.id, name: team.name })}
                    className="w-8 h-8 rounded-lg flex items-center justify-center
                               text-slate-500 hover:bg-red-500/15 hover:text-red-400 transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Mentora */}
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-pink-500
                                flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {team.mentor?.name?.charAt(0) ?? "?"}
                </div>
                <div>
                  <p className="text-xs text-slate-500">Mentora</p>
                  <p className="text-slate-200 text-sm font-medium">{team.mentor?.name ?? "—"}</p>
                </div>
              </div>

              {/* Alunas */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Users size={13} className="text-slate-500" />
                  <span className="text-xs text-slate-500 font-medium">
                    {team.students?.length ?? 0} {(team.students?.length ?? 0) === 1 ? "aluna" : "alunas"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(team.students ?? []).map((a) => (
                    <span key={a.id}
                      className="text-xs bg-slate-800 border border-slate-700 text-slate-300 px-2.5 py-0.5 rounded-full">
                      {a.name}
                    </span>
                  ))}
                  {(team.students?.length ?? 0) === 0 && (
                    <span className="text-xs text-slate-600 italic">Sem alunas vinculadas</span>
                  )}
                </div>
              </div>

              {/* Thunkable */}
              <div className="mt-auto pt-3 border-t border-slate-800">
                {team.thunkableUrl ? (
                  <a href={team.thunkableUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-violet-400 hover:text-violet-300 text-sm font-medium transition-colors">
                    <ExternalLink size={14} /> Ver app no Thunkable
                  </a>
                ) : (
                  <span className="text-slate-600 text-sm italic">App ainda não vinculado</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Modal: Criar / Editar Equipe ─────────────────────────────────────── */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}
             title={editingId ? "Editar Equipe" : "Nova Equipe"} size="md">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Nome da Equipe</label>
            <input type="text" required placeholder="Ex: AppGirls" className="input-field"
              value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
          </div>

          {/* Mentora — select dinâmico */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Mentora responsável</label>
            {usersLoading ? (
              <div className="input-field flex items-center gap-2 text-slate-500">
                <Loader2 size={14} className="animate-spin" /> Carregando usuários...
              </div>
            ) : (
              <select required className="input-field" value={form.mentorId}
                onChange={(e) => setForm((p) => ({ ...p, mentorId: e.target.value }))}>
                <option value="">Selecione uma mentora</option>
                {mentoras.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
                {mentoras.length === 0 && (
                  <option disabled>Nenhuma usuária com papel MENTORA</option>
                )}
              </select>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Status</label>
            <select className="input-field" value={form.status}
              onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
              <option value="IDEACAO">Ideação</option>
              <option value="PROTOTIPAGEM">Prototipagem</option>
              <option value="EM_DESENVOLVIMENTO">Em Desenvolvimento</option>
              <option value="CONCLUIDO">Concluído</option>
            </select>
          </div>

          {/* Alunas — checkboxes dinâmicos */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Alunas da equipe</label>
            {alunas.length === 0 ? (
              <p className="text-slate-500 text-sm italic">Nenhuma usuária com papel ALUNA cadastrada.</p>
            ) : (
              <div className="max-h-36 overflow-y-auto space-y-2 pr-1">
                {alunas.map((aluna) => (
                  <label key={aluna.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer
                               hover:bg-slate-800 transition-colors">
                    <input type="checkbox"
                      checked={form.studentIds.includes(aluna.id)}
                      onChange={() => toggleStudent(aluna.id)}
                      className="w-4 h-4 accent-violet-500" />
                    <span className="text-slate-300 text-sm">{aluna.name}</span>
                    <span className="text-slate-600 text-xs ml-auto">{aluna.email}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Thunkable URL */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Link Thunkable (opcional)</label>
            <input type="url" placeholder="https://x.thunkable.com/..." className="input-field"
              value={form.thunkableUrl}
              onChange={(e) => setForm((p) => ({ ...p, thunkableUrl: e.target.value }))} />
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
              {saving ? <><Loader2 size={15} className="animate-spin" />Salvando...</> : <><Plus size={15} />{editingId ? "Salvar" : "Criar Equipe"}</>}
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── Modal: Confirmar Exclusão ─────────────────────────────────────────── */}
      <Modal isOpen={!!confirmDel} onClose={() => setConfirmDel(null)} title="Confirmar Exclusão" size="sm">
        <p className="text-slate-300 text-sm mb-5">
          Tem certeza que deseja excluir a equipe{" "}
          <span className="font-semibold text-white">"{confirmDel?.name}"</span>? Esta ação não pode ser desfeita.
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
            {deleting ? "Excluindo..." : "Excluir"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
