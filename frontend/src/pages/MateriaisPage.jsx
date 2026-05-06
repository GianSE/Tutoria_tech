import { useEffect, useState, useCallback, useRef } from "react";
import {
  Download, BookOpen, Zap, Code2, Lightbulb, Plus, ExternalLink, Pencil, Trash2,
  Loader2, AlertCircle, Upload, X, FileText, Video, Image, FileArchive, FileCode, File,
  Search, LayoutGrid, List, ChevronLeft, ChevronRight, Filter, ChevronDown
} from "lucide-react";
import Modal from "../components/Modal";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../lib/api";

function getFileIcon(fileName) {
  if (!fileName) return <File size={13} />;
  const ext = fileName.split(".").pop().toLowerCase();

  if (["pdf", "doc", "docx", "txt", "rtf"].includes(ext)) return <FileText size={13} />;
  if (["mp4", "mov", "avi", "mkv"].includes(ext)) return <Video size={13} />;
  if (["png", "jpg", "jpeg", "gif", "svg", "webp"].includes(ext)) return <Image size={13} />;
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return <FileArchive size={13} />;
  if (["js", "jsx", "ts", "tsx", "py", "html", "css", "json", "c", "cpp"].includes(ext)) return <FileCode size={13} />;

  return <File size={13} />;
}

const CATEGORIAS = ["Todos", "Programação", "Design", "Empreendedorismo", "Desafios"];

const TIPO_STYLE = {
  Tutorial: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  Guia: "bg-sky-500/15    text-sky-400    border-sky-500/30",
  Desafio: "bg-pink-500/15   text-pink-400   border-pink-500/30",
  Template: "bg-amber-500/15  text-amber-400  border-amber-500/30",
};

const ICON_MAP = {
  Programação: Code2,
  Design: Lightbulb,
  Desafios: Zap,
  Empreendedorismo: BookOpen,
};

const GRADIENT_MAP = {
  Programação: "bg-violet-600 shadow-violet-500/20",
  Design: "bg-amber-500 shadow-amber-500/20",
  Desafios: "bg-pink-600 shadow-pink-500/20",
  Empreendedorismo: "bg-sky-600 shadow-sky-500/20",
};

const TIPOS = ["Todos", "Tutorial", "Guia", "Desafio", "Template"];
const STATUS_LIST = ["Todos", "Publicados", "Em revisão", "Rascunhos"];

const EMPTY_FORM = { title: "", description: "", category: "Programação", type: "Tutorial" };

export default function MateriaisPage() {
  const { user } = useAuth();
  const canManage = ["ADMIN", "MENTORA"].includes(user?.role);

  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoria, setCategoria] = useState("Todos");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewMaterial, setViewMaterial] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formError, setFormError] = useState("");

  // Novos estados para filtros e UI
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("Todos");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [viewMode, setViewMode] = useState("grid"); // grid | list
  const [sortBy, setSortBy] = useState("recent");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const [showFilters, setShowFilters] = useState(false);
  const fileInputRef = useRef(null);

  const fetchMaterials = useCallback(async () => {
    try {
      const res = await apiFetch("/api/materials");
      setMaterials(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMaterials(); }, [fetchMaterials]);

  const openNew = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setSelectedFiles([]);
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (m) => {
    setEditingId(m.id);
    setForm({
      title: m.title,
      description: m.description ?? "",
      category: m.category,
      type: m.type,
    });
    setSelectedFiles([]);
    setFormError("");
    setModalOpen(true);
  };

  const handleFilesChange = (e) => {
    const files = Array.from(e.target.files ?? []);
    setSelectedFiles((prev) => {
      const existingNames = new Set(prev.map((f) => f.name));
      return [...prev, ...files.filter((f) => !existingNames.has(f.name))];
    });
    e.target.value = "";
  };

  const removeFile = (name) => {
    setSelectedFiles((prev) => prev.filter((f) => f.name !== name));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      if (editingId) {
        const res = await apiFetch(`/api/materials/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message ?? "Erro ao salvar material.");

        if (selectedFiles.length > 0) {
          const fd = new FormData();
          selectedFiles.forEach((f) => fd.append("file", f));
          const fileRes = await apiFetch(`/api/materials/${editingId}/files`, {
            method: "POST",
            body: fd,
          });
          if (!fileRes.ok) {
            const fileData = await fileRes.json();
            throw new Error(fileData.message ?? "Erro ao anexar novos arquivos.");
          }
        }
      } else {
        const fd = new FormData();
        fd.append("title", form.title);
        fd.append("description", form.description);
        fd.append("category", form.category);
        fd.append("type", form.type);
        selectedFiles.forEach((f) => fd.append("file", f));

        const res = await apiFetch("/api/materials", {
          method: "POST",
          body: fd,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message ?? "Erro ao salvar material.");
      }

      await fetchMaterials();
      setSelectedFiles([]);
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
      const res = await apiFetch(`/api/materials/${confirmDel.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message ?? "Erro ao excluir material.");
      }
      await fetchMaterials();
      setConfirmDel(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleting(false);
    }
  };

  // Lógica de Filtragem e Ordenação
  const filtered = materials.filter((m) => {
    const matchesSearch = !search || m.title.toLowerCase().includes(search.toLowerCase()) || m.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoria === "Todos" || m.category === categoria;
    const matchesType = typeFilter === "Todos" || m.type === typeFilter;
    // Status Filter (mocked or as proxy)
    if (statusFilter === "Publicados") return matchesSearch && matchesCat && matchesType;
    if (statusFilter === "Em revisão" || statusFilter === "Rascunhos") return false; // Mock zero for these
    return matchesSearch && matchesCat && matchesType;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "recent") return new Date(b.createdAt) - new Date(a.createdAt);
    if (sortBy === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
    if (sortBy === "az") return a.title.localeCompare(b.title);
    return 0;
  });

  const totalPages = Math.ceil(sorted.length / itemsPerPage);
  const currentItems = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const counts = {
    total: materials.length,
    publicados: materials.length,
    revisao: 0,
    rascunhos: 0
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-4">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Materiais de Apoio</h2>
          <p className="text-slate-400 text-sm mt-0.5">Conteúdos, guias e desafios para o programa.</p>
        </div>
        <div className="flex items-center gap-3 self-start md:self-auto">
          {/* View Toggle - Only on Desktop */}
          <div className="hidden md:flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 mr-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-all ${viewMode === "grid" ? "bg-violet-600 text-white shadow-lg shadow-violet-500/20" : "text-slate-500 hover:text-slate-300"}`}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition-all ${viewMode === "list" ? "bg-violet-600 text-white shadow-lg shadow-violet-500/20" : "text-slate-500 hover:text-slate-300"}`}
            >
              <List size={16} />
            </button>
          </div>

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
              <Plus size={18} /> Novo Material
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filters Card - Collapsible */}
      {showFilters && (
        <div className="card space-y-5 !p-5 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-5 relative group">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-violet-400 transition-colors" />
              <input
                type="text"
                placeholder="Buscar por título, assunto ou palavra-chave..."
                className="input-field pl-11 !py-3"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              />
            </div>

            <div className="md:col-span-3 relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                <BookOpen size={16} />
              </div>
              <select
                className="input-field pl-10 appearance-none !py-3"
                value={categoria}
                onChange={(e) => { setCategoria(e.target.value); setCurrentPage(1); }}
              >
                {CATEGORIAS.map(c => <option key={c} value={c}>{c === "Todos" ? "Todas as categorias" : c}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>

            <div className="md:col-span-3 relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                <LayoutGrid size={16} />
              </div>
              <select
                className="input-field pl-10 appearance-none !py-3"
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
              >
                {TIPOS.map(t => <option key={t} value={t}>{t === "Todos" ? "Todos os tipos" : t}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>

            <div className="md:col-span-1">
              <button
                onClick={() => { setSearch(""); setCategoria("Todos"); setTypeFilter("Todos"); setStatusFilter("Todos"); }}
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
                { id: "Publicados", label: "Publicados", count: counts.publicados },
                { id: "Em revisão", label: "Em revisão", count: counts.revisao },
                { id: "Rascunhos", label: "Rascunhos", count: counts.rascunhos },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-4 py-2 rounded-lg text-[11px] font-bold transition-all flex items-center gap-2
                    ${statusFilter === tab.id
                      ? "bg-slate-800 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-300"}`}
                >
                  {tab.label}
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${statusFilter === tab.id ? "bg-violet-600 text-white" : "bg-slate-800 text-slate-500"}`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mr-1">Ordenar por</span>
              <div className="relative">
                <select
                  className="bg-slate-900/50 border border-slate-800 text-slate-300 text-[11px] font-bold py-2 pl-4 pr-10 rounded-xl appearance-none hover:border-slate-700 transition-all outline-none"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="recent">Mais recentes</option>
                  <option value="oldest">Mais antigos</option>
                  <option value="az">A - Z</option>
                </select>
                <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid / List Content */}
      <div className="flex-1 flex flex-col min-h-[400px]">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 flex-1">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card h-40 animate-pulse bg-slate-800/50 rounded-2xl" />
            ))}
          </div>
        ) : currentItems.length === 0 ? (
          <div className="card text-center py-20 bg-slate-900/20 flex-1 flex flex-col justify-center">
            <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-6 text-slate-600">
              <FileText size={40} />
            </div>
            <h3 className="text-white font-semibold text-lg">Nenhum material encontrado</h3>
            <p className="text-slate-500 text-sm mt-2 max-w-xs mx-auto">Tente ajustar seus filtros ou termos de pesquisa para encontrar o que procura.</p>
            <button onClick={() => { setSearch(""); setCategoria("Todos"); setTypeFilter("Todos"); }} className="btn-primary mt-8 inline-flex px-6 self-center">
              Limpar Filtros
            </button>
          </div>
        ) : (
          <div className={`flex-1 ${viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" : "flex flex-col gap-3"}`}>
            {currentItems.map((m) => {
              const Icon = ICON_MAP[m.category] ?? BookOpen;
              const gradient = GRADIENT_MAP[m.category] ?? "bg-slate-700 shadow-slate-500/20";
              const allFiles = m.files ?? [];

              return (
                <div key={m.id}
                  onClick={() => setViewMaterial(m)}
                  className={`card hover:border-violet-500/40 transition-all duration-300 flex cursor-pointer group relative overflow-hidden p-0
                           ${viewMode === "grid" ? "flex-col" : "flex-row items-center min-h-[72px]"}`}>

                  <div className="absolute inset-0 bg-gradient-to-tr from-violet-500/0 via-violet-500/0 to-violet-500/[0.03] pointer-events-none" />

                  {/* Mobile & Grid Header/Side */}
                  <div className={`${viewMode === "grid" ? "p-4 pb-0" : "w-14 shrink-0 flex items-center justify-center border-r border-slate-800 bg-slate-900/50"}`}>
                    <div className={`${viewMode === "grid" ? "w-10 h-10 rounded-xl" : "w-9 h-9 rounded-lg"} ${gradient} flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110`}>
                      <Icon size={viewMode === "grid" ? 18 : 16} className="text-white" />
                    </div>
                  </div>

                  <div className={`flex-1 p-4 ${viewMode === "list" ? "py-3 flex flex-row items-center justify-between" : "flex flex-col h-full"}`}>
                    <div className="min-w-0 flex-1">
                      <div className={`flex items-start justify-between gap-2 ${viewMode === "grid" ? "mb-1" : ""}`}>
                        <h3 className="text-white font-bold text-sm md:text-sm group-hover:text-violet-300 transition-colors leading-tight truncate">{m.title}</h3>
                        {viewMode === "grid" && (
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border shadow-sm tracking-tight shrink-0
                                          ${TIPO_STYLE[m.type] ?? TIPO_STYLE.Guia}`}>
                            {m.type?.toUpperCase()}
                          </span>
                        )}
                      </div>

                      {viewMode === "grid" ? (
                        <p className="text-slate-400 text-xs leading-relaxed line-clamp-2 min-h-[32px] mt-1">
                          {m.description ?? "Sem descrição detalhada disponível."}
                        </p>
                      ) : (
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border tracking-tight
                                          ${TIPO_STYLE[m.type] ?? TIPO_STYLE.Guia}`}>
                            {m.type?.toUpperCase()}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">{m.category}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions & Meta */}
                    <div className={`${viewMode === "grid" ? "pt-3 mt-auto border-t border-slate-800 flex items-center justify-between" : "flex items-center gap-4 ml-4"}`}>
                      <div className={`flex items-center gap-3 ${viewMode === "list" ? "hidden md:flex" : ""}`}>
                        <span className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                          <File size={11} className="text-slate-600" />
                          {allFiles.length}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                          <FileText size={11} className="text-slate-600" />
                          {new Date(m.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        {canManage && (
                          <div className={`flex gap-1 ${viewMode === "grid" ? "mr-2" : ""}`}>
                            <button onClick={() => openEdit(m)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-700 hover:text-white transition-all">
                              <Pencil size={12} />
                            </button>
                            <button onClick={() => setConfirmDel({ id: m.id, name: m.title })}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-all">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        )}
                        <div className="text-violet-400 p-1.5 rounded-lg bg-violet-500/10 md:bg-transparent">
                          <ExternalLink size={14} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
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
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Arquivos {editingId ? "(novos arquivos serão adicionados)" : ""}
            </label>
            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFilesChange} />
            <button type="button" onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 border border-dashed border-slate-600
                         rounded-xl text-sm text-slate-400 hover:border-violet-500 hover:text-violet-400 transition-all w-full justify-center">
              <Upload size={14} /> Escolher arquivos
            </button>
            {selectedFiles.length > 0 && (
              <ul className="mt-2 space-y-1">
                {selectedFiles.map((f) => (
                  <li key={f.name} className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800 rounded-lg px-3 py-1.5">
                    <span className="flex-1 truncate">{f.name}</span>
                    <span className="text-slate-600">{(f.size / 1024).toFixed(0)}KB</span>
                    <button type="button" onClick={() => removeFile(f.name)} className="text-slate-600 hover:text-red-400 transition-colors">
                      <X size={12} />
                    </button>
                  </li>
                ))}
              </ul>
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
              {saving ? <><Loader2 size={15} className="animate-spin" />Salvando...</> : <><Plus size={15} />{editingId ? "Salvar" : "Publicar"}</>}
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── Modal: Ver Conteúdo ────────────────────────────────────────────────── */}
      <Modal isOpen={!!viewMaterial} onClose={() => setViewMaterial(null)}
        title={viewMaterial?.title ?? "Material"} size="md">
        {viewMaterial && (
          <div className="space-y-4">
            {viewMaterial.description && (
              <p className="text-slate-400 text-sm leading-relaxed">{viewMaterial.description}</p>
            )}

            <div className="space-y-2">
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Arquivos</p>

              {(viewMaterial.files ?? []).length === 0 && !viewMaterial.fileUrl && (
                <p className="text-slate-600 text-sm italic py-4 text-center">Nenhum arquivo anexado.</p>
              )}

              {(viewMaterial.files ?? []).map((f) => (
                <div key={f.id}
                  className="flex items-center gap-3 bg-slate-800 rounded-xl px-4 py-3 border border-slate-700
                             hover:border-slate-600 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0 text-slate-400">
                    {getFileIcon(f.fileName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 truncate">{f.fileName}</p>
                  </div>
                  <a href={f.fileUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300
                               font-medium transition-colors px-2.5 py-1.5 rounded-lg hover:bg-violet-500/10">
                    <ExternalLink size={13} /> Abrir
                  </a>
                  <a href={f.fileUrl} download
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200
                               font-medium transition-colors px-2.5 py-1.5 rounded-lg hover:bg-slate-700">
                    <Download size={13} /> Baixar
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
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
