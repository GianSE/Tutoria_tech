import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, Search, UserCircle2, Loader2, AlertCircle, Eye, Users, ArrowUpDown, ChevronDown } from "lucide-react";
import Modal from "../components/Modal";
import EmptyState from "../components/EmptyState";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../lib/api";
import { useToast } from "../context/ToastContext";

const ROLE_LABELS = { ADMIN: "Admin", MENTORA: "Mentora", ALUNA: "Aluna" };
const ROLE_STYLES = {
  ADMIN:   "bg-purple-500/20 text-purple-400 border border-purple-500/30",
  MENTORA: "bg-blue-500/20   text-blue-400   border border-blue-500/30",
  ALUNA:   "bg-slate-600/40  text-slate-300  border border-slate-600/40",
};

const EMPTY_FORM = { name: "", email: "", password: "", role: "ALUNA", birthDate: "" };

export default function UsuariosPage() {
  const { impersonate } = useAuth();
  const { addToast } = useToast();
  const [users, setUsers]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [roleFilter, setRoleFilter] = useState("TODOS");
  const [sortAZ, setSortAZ]         = useState(false);
  const [modalOpen, setModalOpen]   = useState(false);
  const [editingId, setEditingId]   = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [formError, setFormError]   = useState("");

  const fetchUsers = useCallback(async () => {
    try {
      const res = await apiFetch("/api/users");
      setUsers(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleImpersonate = async (targetUser) => {
    try {
      const res = await apiFetch(`/api/auth/impersonate/${targetUser.id}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      impersonate(data.user, data.token);
      window.location.href = "/dashboard";
    } catch (err) {
      addToast("Erro ao imitar visão: " + err.message, "error");
    }
  };

  const openNew = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (user) => {
    setEditingId(user.id);
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      birthDate: user.birthDate ? user.birthDate.split("T")[0] : "",
    });
    setFormError("");
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      const body = { ...form };
      if (editingId && !body.password) delete body.password;

      const res = await apiFetch(
        editingId ? `/api/users/${editingId}` : "/api/users",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Erro ao salvar usuário.");
      await fetchUsers();
      setModalOpen(false);
      addToast(editingId ? "Usuário atualizado!" : "Usuário criado com sucesso!", "success");
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
      await apiFetch(`/api/users/${confirmDel.id}`, { method: "DELETE" });
      await fetchUsers();
      addToast("Usuário excluído.", "info");
      setConfirmDel(null);
    } finally {
      setDeleting(false);
    }
  };

  const filtered = users
    .filter((u) => {
      const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
                          u.email.toLowerCase().includes(search.toLowerCase());
      const matchRole   = roleFilter === "TODOS" || u.role === roleFilter;
      return matchSearch && matchRole;
    })
    .sort((a, b) => sortAZ ? a.name.localeCompare(b.name, "pt-BR") : 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Gerenciar Usuários</h2>
          <p className="text-slate-400 text-sm mt-0.5">Gerencie alunas, mentoras e administradores.</p>
        </div>
        <button onClick={openNew} className="btn-primary flex items-center gap-2 self-start sm:self-auto">
          <Plus size={16} /> Novo Usuário
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Busca */}
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text" placeholder="Buscar por nome ou e-mail..."
            className="input-field pl-10 text-sm"
            value={search} onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filtro de papel */}
        <div className="relative">
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="input-field pr-8 text-sm appearance-none min-w-[140px]"
          >
            <option value="TODOS">Todos os papéis</option>
            <option value="ALUNA">Aluna</option>
            <option value="MENTORA">Mentora</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>

        {/* Ordenação A-Z */}
        <button
          onClick={() => setSortAZ((prev) => !prev)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
            sortAZ
              ? "bg-violet-600/20 border-violet-500/40 text-violet-300"
              : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600"
          }`}
          title={sortAZ ? "Ordenação A-Z ativa — clique para desativar" : "Ordenar A-Z"}
        >
          <ArrowUpDown size={14} />
          A-Z
        </button>
      </div>

      {/* Contagem de resultados */}
      {!loading && (
        <p className="text-slate-500 text-sm">
          {filtered.length === 0
            ? "Nenhum usuário encontrado."
            : <>
                Exibindo{" "}
                <span className="text-slate-300 font-semibold">{filtered.length}</span>
                {" "}{filtered.length === 1 ? "usuário" : "usuários"}
                {users.length !== filtered.length && (
                  <span className="text-slate-600"> de {users.length} no total</span>
                )}
              </>
          }
        </p>
      )}

      {/* Tabela Desktop */}
      <div className="hidden md:block card p-0 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800 text-left">
              <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Usuário</th>
              <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">E-mail</th>
              <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Papel</th>
              <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nascimento</th>
              <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider w-28">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-500">
                <Loader2 size={20} className="animate-spin inline mr-2" />Carregando...
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5}>
                <EmptyState compact icon={Users} title="Nenhum usuário encontrado"
                  description={search ? "Tente um termo diferente." : ""}
                  action={!search ? { label: "Novo Usuário", onClick: openNew } : undefined} />
              </td></tr>
            ) : (
              filtered.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <UserCircle2 size={30} className="text-violet-400/70 flex-shrink-0" />
                      <span className="text-slate-200 font-medium text-sm">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-sm">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ROLE_STYLES[u.role]}`}>
                      {ROLE_LABELS[u.role] ?? u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-sm">
                    {u.birthDate ? new Date(u.birthDate).toLocaleDateString("pt-BR") : "—"}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      {u.role !== "ADMIN" && (
                        <button onClick={() => handleImpersonate(u)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-violet-400 hover:bg-violet-500/15 transition-all" title="Imitar Visão">
                          <Eye size={14} />
                        </button>
                      )}
                      <button onClick={() => openEdit(u)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-700 hover:text-slate-200 transition-all" title="Editar">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => setConfirmDel({ id: u.id, name: u.name })}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-red-500/15 hover:text-red-400 transition-all" title="Excluir">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Lista Mobile */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {loading ? (
          <div className="text-center py-10 text-slate-500">
            <Loader2 size={24} className="animate-spin mx-auto mb-2" />
            Carregando usuários...
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState compact icon={Users} title="Nenhum usuário encontrado"
            action={{ label: "Novo Usuário", onClick: openNew }} />
        ) : (
          filtered.map((u) => (
            <div key={u.id} className="card p-4 space-y-4 hover:border-violet-500/30 transition-all">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 text-violet-400">
                    <UserCircle2 size={24} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-bold text-sm truncate">{u.name}</p>
                    <p className="text-slate-500 text-[11px] truncate">{u.email}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${ROLE_STYLES[u.role]}`}>
                  {ROLE_LABELS[u.role]?.toUpperCase() ?? u.role}
                </span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-800/50">
                <div className="flex items-center gap-3">
                  <button onClick={() => openEdit(u)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-[11px] font-bold hover:text-white transition-all">
                    <Pencil size={12} /> Editar
                  </button>
                  <button onClick={() => setConfirmDel({ id: u.id, name: u.name })}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>
                {u.role !== "ADMIN" && (
                  <button onClick={() => handleImpersonate(u)}
                    className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-violet-500/10 text-violet-400 text-[11px] font-black border border-violet-500/20 active:scale-95 transition-all">
                    <Eye size={14} /> IMITAR VISÃO
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Criar / Editar */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}
             title={editingId ? "Editar Usuário" : "Novo Usuário"}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Nome completo</label>
            <input type="text" required placeholder="Ex: Maria da Silva" className="input-field"
              value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">E-mail</label>
            <input type="email" required placeholder="email@exemplo.com" className="input-field"
              value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              {editingId ? "Nova senha (deixe em branco para manter)" : "Senha temporária"}
            </label>
            <input type="password" placeholder="••••••••" className="input-field"
              required={!editingId}
              value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Papel</label>
            <select className="input-field" value={form.role}
              onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}>
              <option value="ALUNA">Aluna</option>
              <option value="MENTORA">Mentora</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Data de Nascimento (opcional)</label>
            <input type="date" className="input-field"
              value={form.birthDate} onChange={(e) => setForm((p) => ({ ...p, birthDate: e.target.value }))} />
          </div>
          {formError && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
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
              {saving ? <><Loader2 size={15} className="animate-spin" />Salvando...</> : <><Plus size={15} />{editingId ? "Salvar" : "Criar"}</>}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Confirmar Exclusão */}
      <Modal isOpen={!!confirmDel} onClose={() => setConfirmDel(null)} title="Confirmar Exclusão" size="sm">
        <p className="text-slate-300 text-sm mb-5">
          Tem certeza que deseja excluir o usuário{" "}
          <span className="font-semibold text-white">"{confirmDel?.name}"</span>?
          Esta ação não pode ser desfeita.
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setConfirmDel(null)}
            className="px-4 py-2 text-sm rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-all">
            Cancelar
          </button>
          <button onClick={handleDelete} disabled={deleting}
            className="px-4 py-2 text-sm rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold flex items-center gap-2 transition-all disabled:opacity-60">
            {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            {deleting ? "Excluindo..." : "Excluir"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
