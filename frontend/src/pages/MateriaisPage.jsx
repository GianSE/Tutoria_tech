import { useEffect, useState, useCallback } from "react";
import { Download, BookOpen, Zap, Code2, Lightbulb, Plus, ExternalLink, Pencil, Trash2, Loader2, AlertCircle } from "lucide-react";
import Modal from "../components/Modal";

const CATEGORIAS = ["Todos", "Programação", "Design", "Empreendedorismo", "Desafios"];

const TIPO_STYLE = {
  Tutorial: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  Guia:     "bg-sky-500/15    text-sky-400    border-sky-500/30",
  Desafio:  "bg-pink-500/15   text-pink-400   border-pink-500/30",
  Template: "bg-amber-500/15  text-amber-400  border-amber-500/30",
};

const ICON_MAP = {
  Programação:       Code2,
  Design:            Lightbulb,
  Desafios:          Zap,
  Empreendedorismo:  BookOpen,
};

const GRADIENT_MAP = {
  Programação:       "from-violet-600 to-violet-800",
  Design:            "from-amber-500 to-orange-600",
  Desafios:          "from-pink-600 to-rose-700",
  Empreendedorismo:  "from-sky-600 to-blue-700",
};

const EMPTY_FORM = { title: "", description: "", fileUrl: "", category: "Programação", type: "Tutorial" };

export default function MateriaisPage() {
  const [materials, setMaterials]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [categoria, setCategoria]   = useState("Todos");
  const [modalOpen, setModalOpen]   = useState(false);
  const [editingId, setEditingId]   = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [formError, setFormError]   = useState("");

  const fetchMaterials = useCallback(async () => {
    try {
      const res = await fetch("/api/materials");
      setMaterials(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMaterials(); }, [fetchMaterials]);

  const openNew = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (m) => {
    setEditingId(m.id);
    setForm({
      title: m.title,
      description: m.description ?? "",
      fileUrl: m.fileUrl ?? "",
      category: m.category,
      type: m.type,
    });
    setFormError("");
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      const res = await fetch(
        editingId ? `/api/materials/${editingId}` : "/api/materials",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Erro ao salvar material.");
      await fetchMaterials();
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
      await fetch(`/api/materials/${confirmDel.id}`, { method: "DELETE" });
      await fetchMaterials();
      setConfirmDel(null);
    } finally {
      setDeleting(false);
    }
  };

  const filtered = categoria === "Todos"
    ? materials
    : materials.filter((m) => m.category === categoria);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Materiais de Apoio</h2>
          <p className="text-slate-400 text-sm mt-0.5">Conteúdos, guias e desafios para o programa.</p>
        </div>
        {/* Botão corrigido — onClick agora abre o modal */}
        <button onClick={openNew} className="btn-primary flex items-center gap-2 self-start sm:self-auto">
          <Plus size={16} /> Novo Material
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIAS.map((cat) => (
          <button key={cat} onClick={() => setCategoria(cat)}
            className={[
              "px-4 py-1.5 rounded-full text-sm font-medium border transition-all duration-150",
              categoria === cat
                ? "bg-violet-600/25 text-violet-300 border-violet-500/50"
                : "bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500 hover:text-slate-200",
            ].join(" ")}>
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card animate-pulse space-y-3">
              <div className="w-11 h-11 rounded-xl bg-slate-800" />
              <div className="w-3/4 h-4 bg-slate-800 rounded" />
              <div className="w-full h-3 bg-slate-800 rounded" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-slate-500 text-sm">
            {materials.length === 0 ? "Nenhum material publicado ainda." : "Nenhum material nesta categoria."}
          </p>
          {materials.length === 0 && (
            <button onClick={openNew} className="btn-primary mt-4 inline-flex items-center gap-2">
              <Plus size={15} /> Adicionar primeiro material
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((m) => {
            const Icon     = ICON_MAP[m.category]   ?? BookOpen;
            const gradient = GRADIENT_MAP[m.category] ?? "from-slate-600 to-slate-700";
            return (
              <div key={m.id}
                className="card hover:border-slate-600 transition-all duration-200 flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient}
                                  flex items-center justify-center shadow-lg flex-shrink-0`}>
                    <Icon size={20} className="text-white" />
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(m)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center
                                 text-slate-500 hover:bg-slate-700 hover:text-slate-200 transition-all">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => setConfirmDel({ id: m.id, name: m.title })}
                      className="w-7 h-7 rounded-lg flex items-center justify-center
                                 text-slate-500 hover:bg-red-500/15 hover:text-red-400 transition-all">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-white font-semibold text-sm leading-snug">{m.title}</h3>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0
                                      ${TIPO_STYLE[m.type] ?? TIPO_STYLE.Guia}`}>
                      {m.type}
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm leading-relaxed line-clamp-2">
                    {m.description ?? "Sem descrição."}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
                  {m.fileUrl ? (
                    <>
                      <a href={m.fileUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-violet-400 hover:text-violet-300 text-sm font-medium transition-colors">
                        <ExternalLink size={13} /> Acessar
                      </a>
                      <a href={m.fileUrl} download
                        className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-sm font-medium transition-colors ml-auto">
                        <Download size={13} /> Baixar
                      </a>
                    </>
                  ) : (
                    <span className="text-slate-600 text-xs italic">Sem link</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Modal: Criar / Editar Material ───────────────────────────────────── */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}
             title={editingId ? "Editar Material" : "Novo Material"}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Título</label>
            <input type="text" required placeholder="Ex: Introdução ao Thunkable" className="input-field"
              value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Descrição</label>
            <textarea rows={3} placeholder="Breve descrição do conteúdo..." className="input-field resize-none"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Categoria</label>
              <select className="input-field" value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}>
                <option>Programação</option><option>Design</option>
                <option>Empreendedorismo</option><option>Desafios</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Tipo</label>
              <select className="input-field" value={form.type}
                onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}>
                <option>Tutorial</option><option>Guia</option>
                <option>Desafio</option><option>Template</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">URL do arquivo (opcional)</label>
            <input type="url" placeholder="https://..." className="input-field"
              value={form.fileUrl} onChange={(e) => setForm((p) => ({ ...p, fileUrl: e.target.value }))} />
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
              {saving ? <><Loader2 size={15} className="animate-spin" />Salvando...</> : <><Plus size={15} />{editingId ? "Salvar" : "Publicar"}</>}
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── Modal: Confirmar Exclusão ─────────────────────────────────────────── */}
      <Modal isOpen={!!confirmDel} onClose={() => setConfirmDel(null)} title="Confirmar Exclusão" size="sm">
        <p className="text-slate-300 text-sm mb-5">
          Deseja remover o material <span className="font-semibold text-white">"{confirmDel?.name}"</span>?
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
    </div>
  );
}
