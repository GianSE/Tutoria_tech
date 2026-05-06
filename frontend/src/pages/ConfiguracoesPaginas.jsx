import { useState, useEffect, useCallback } from "react";
import { 
  Settings2, Plus, Trash2, Save, Loader2, AlertCircle, 
  BookOpen, FolderOpen, CalendarDays, CheckCircle2, Layout,
  Palette, Tag, Hash, RefreshCcw
} from "lucide-react";
import { apiFetch } from "../lib/api";

const GROUPS = [
  { id: "MATERIAL_CATEGORY", label: "Categorias de Materiais", icon: FolderOpen,  desc: "Ex: Programação, Design, Carreira" },
  { id: "MATERIAL_TYPE",     label: "Tipos de Materiais",     icon: Tag,         desc: "Ex: Tutorial, Guia, Desafio" },
  { id: "SCHEDULE_TYPE",     label: "Tipos de Agenda",        icon: CalendarDays, desc: "Ex: Sessão de Tutoria, Evento" },
  { id: "TEAM_STATUS",       label: "Status de Equipes",      icon: BookOpen,     desc: "Ex: Ideação, Concluído" },
];

export default function ConfiguracoesPaginas() {
  const [activeGroup, setActiveGroup] = useState(GROUPS[0].id);
  const [options, setOptions]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState("");
  
  const [newOption, setNewOption]     = useState({ label: "", value: "", color: "#6366f1" });

  const fetchOptions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/settings/${activeGroup}`);
      setOptions(await res.json());
    } catch (err) {
      setError("Erro ao carregar opções.");
    } finally {
      setLoading(false);
    }
  }, [activeGroup]);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!newOption.label || !newOption.value) return;
    
    setSaving(true);
    setError("");
    try {
      const res = await apiFetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newOption, group: activeGroup }),
      });
      if (!res.ok) throw new Error("Erro ao salvar opção.");
      await fetchOptions();
      setNewOption({ label: "", value: "", color: "#6366f1" });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Deseja realmente remover esta opção?")) return;
    try {
      await apiFetch(`/api/settings/${id}`, { method: "DELETE" });
      await fetchOptions();
    } catch (err) {
      setError("Erro ao remover opção.");
    }
  };

  const generateValue = (label) => {
    return label
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase()
      .replace(/\s+/g, "_")
      .replace(/[^A-Z0-9_]/g, "");
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-violet-500/20">
          <Settings2 size={24} className="text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Configurações de Páginas</h2>
          <p className="text-slate-400 text-sm mt-1">Gerencie categorias, tipos e status dinâmicos do sistema.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Tabs */}
        <div className="space-y-2">
          {GROUPS.map((group) => {
            const Icon = group.icon;
            const isActive = activeGroup === group.id;
            return (
              <button
                key={group.id}
                onClick={() => { setActiveGroup(group.id); setError(""); }}
                className={`w-full flex items-center gap-3 p-4 rounded-2xl border transition-all text-left
                  ${isActive 
                    ? "bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/20" 
                    : "bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-800/50"}`}
              >
                <div className={`p-2 rounded-xl ${isActive ? "bg-white/20" : "bg-slate-800 text-slate-500"}`}>
                  <Icon size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold">{group.label}</p>
                  <p className={`text-[10px] mt-0.5 ${isActive ? "text-violet-200" : "text-slate-500"}`}>{group.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Form Card */}
          <div className="card !p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Plus size={18} className="text-violet-400" />
              Adicionar Nova Opção
            </h3>
            <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Rótulo (Display Name)</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Inteligência Artificial" 
                  className="input-field"
                  value={newOption.label}
                  onChange={(e) => {
                    const label = e.target.value;
                    setNewOption(p => ({ ...p, label, value: generateValue(label) }));
                  }}
                />
              </div>
              <div className="md:col-span-4">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Chave do Banco (Value)</label>
                <div className="relative">
                  <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input 
                    type="text" 
                    required
                    readOnly
                    className="input-field pl-9 bg-slate-900/50 text-slate-500 cursor-not-allowed border-dashed"
                    value={newOption.value}
                  />
                </div>
              </div>
              <div className="md:col-span-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Cor</label>
                <div className="relative group h-[42px]">
                  <input 
                    type="color" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    value={newOption.color}
                    onChange={(e) => setNewOption(p => ({ ...p, color: e.target.value }))}
                  />
                  <div 
                    className="w-full h-full rounded-xl border border-slate-700 shadow-inner transition-transform group-hover:scale-105"
                    style={{ backgroundColor: newOption.color }}
                  />
                </div>
              </div>
              <div className="md:col-span-2 flex items-end">
                <button 
                  type="submit" 
                  disabled={saving || !newOption.label}
                  className="btn-primary w-full h-[42px] flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Salvar
                </button>
              </div>
            </form>
            {error && (
              <div className="mt-4 flex items-center gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                <AlertCircle size={14} /> {error}
              </div>
            )}
          </div>

          {/* List Card */}
          <div className="card !p-0 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/20">
              <h3 className="text-white font-semibold text-sm">Opções Atuais</h3>
              <button onClick={fetchOptions} className="text-slate-500 hover:text-white transition-colors">
                <RefreshCcw size={14} />
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-900/40 text-slate-500 text-[10px] font-bold uppercase tracking-widest border-b border-slate-800">
                    <th className="px-6 py-3">Rótulo</th>
                    <th className="px-6 py-3">Valor Técnico</th>
                    <th className="px-6 py-3">Amostra</th>
                    <th className="px-6 py-3 text-right w-20">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {loading ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-10 text-center">
                        <Loader2 size={24} className="text-violet-500 animate-spin mx-auto mb-2" />
                        <p className="text-slate-500 text-xs italic">Carregando opções...</p>
                      </td>
                    </tr>
                  ) : options.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-10 text-center">
                        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-600">
                          <Layout size={24} />
                        </div>
                        <p className="text-slate-500 text-sm">Nenhuma opção cadastrada para este grupo.</p>
                      </td>
                    </tr>
                  ) : (
                    options.map((opt) => (
                      <tr key={opt.id} className="hover:bg-slate-800/20 transition-colors">
                        <td className="px-6 py-4">
                          <span className="text-sm font-bold text-slate-200">{opt.label}</span>
                        </td>
                        <td className="px-6 py-4">
                          <code className="text-[10px] bg-slate-900 px-1.5 py-0.5 rounded text-slate-500 border border-slate-800">{opt.value}</code>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: opt.color || '#64748b' }} />
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-sm tracking-tight"
                                  style={{ backgroundColor: `${opt.color}15`, color: opt.color, borderColor: `${opt.color}30` }}>
                              {opt.label.toUpperCase()}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => handleDelete(opt.id)}
                            className="p-2 rounded-lg text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
