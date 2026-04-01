import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Bot,
  CheckCircle2,
  Eye,
  EyeOff,
  FileText,
  Loader2,
  RefreshCcw,
  Save,
  ShieldCheck,
  Trash2,
  Upload,
} from "lucide-react";
import { apiFetch } from "../lib/api";

const DEFAULT_SYSTEM_PROMPT = `Voce e Rose, a assistente IA oficial do Tutoria Tech.
Seu papel e apoiar administradoras, mentoras e alunas com respostas claras, empaticas e objetivas.
Priorize linguagem simples, incentivo ao aprendizado e orientacoes praticas de tecnologia.
Quando necessario, explique passo a passo e evite suposicoes sem contexto.`;

export default function ConfiguracoesIAPage() {
  const fileInputRef = useRef(null);

  const [apiKey, setApiKey] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [knowledgeDocs, setKnowledgeDocs] = useState([]);

  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const loadKnowledge = async () => {
    const res = await apiFetch("/api/settings/knowledge");
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message ?? "Erro ao carregar base de conhecimento.");
    }

    setKnowledgeDocs(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    let mounted = true;

    async function loadSettings() {
      setLoading(true);
      setError("");
      setSuccess("");

      try {
        const [resSettings, resKnowledge] = await Promise.all([
          apiFetch("/api/settings/ai"),
          apiFetch("/api/settings/knowledge"),
        ]);

        const data = await resSettings.json();
        const knowledge = await resKnowledge.json();

        if (!resSettings.ok) {
          throw new Error(data.message ?? "Erro ao carregar configuracoes da IA.");
        }
        if (!resKnowledge.ok) {
          throw new Error(knowledge.message ?? "Erro ao carregar base de conhecimento.");
        }

        if (!mounted) return;
        setApiKey(data.apiKey ?? "");
        setSystemPrompt(data.systemPrompt ?? "");
        setKnowledgeDocs(Array.isArray(knowledge) ? knowledge : []);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || "Erro inesperado ao carregar dados.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadSettings();

    return () => {
      mounted = false;
    };
  }, []);

  async function handleTestConnection() {
    setTesting(true);
    setError("");
    setSuccess("");

    try {
      const res = await apiFetch("/api/settings/ai/test", {
        method: "POST",
        body: JSON.stringify({ apiKey }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message ?? "Falha ao testar conexao.");
      }

      setSuccess(data.message ?? "Conexao validada com sucesso.");
    } catch (err) {
      setError(err.message || "Nao foi possivel validar a chave no momento.");
    } finally {
      setTesting(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await apiFetch("/api/settings/ai", {
        method: "PUT",
        body: JSON.stringify({ apiKey, systemPrompt }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message ?? "Erro ao salvar configuracoes da IA.");
      }

      setApiKey(data.data?.apiKey ?? apiKey);
      setSystemPrompt(data.data?.systemPrompt ?? systemPrompt);
      setSuccess(data.message ?? "Configuracoes salvas com sucesso.");
    } catch (err) {
      setError(err.message || "Erro inesperado ao salvar configuracoes.");
    } finally {
      setSaving(false);
    }
  }

  function handleRestoreDefaultPrompt() {
    setSystemPrompt(DEFAULT_SYSTEM_PROMPT);
    setSuccess("Prompt padrao restaurado no formulario. Clique em Salvar Configuracoes.");
    setError("");
  }

  function handleOpenUpload() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = "";

    if (!file) return;

    const lowerName = file.name.toLowerCase();
    if (!lowerName.endsWith(".md")) {
      setError("Formato invalido. Envie apenas arquivos .md.");
      setSuccess("");
      return;
    }

    setUploading(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await apiFetch("/api/settings/knowledge/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message ?? "Erro ao enviar arquivo.");
      }

      await loadKnowledge();
      setSuccess(data.message ?? "Arquivo enviado com sucesso.");
    } catch (err) {
      setError(err.message || "Erro inesperado no upload.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteDoc(id) {
    setDeletingId(id);
    setError("");
    setSuccess("");

    try {
      const res = await apiFetch(`/api/settings/knowledge/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message ?? "Erro ao remover documento.");
      }

      await loadKnowledge();
      setSuccess(data.message ?? "Documento removido com sucesso.");
    } catch (err) {
      setError(err.message || "Erro inesperado ao remover documento.");
    } finally {
      setDeletingId(null);
    }
  }

  const formatDate = (value) => {
    if (!value) return "-";
    return new Date(value).toLocaleString("pt-BR");
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto card flex items-center justify-center min-h-52">
        <Loader2 size={20} className="animate-spin text-violet-400" />
        <span className="text-slate-300 text-sm ml-2">Carregando configuracoes da IA...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Bot size={22} className="text-violet-400" />
          Configuracao da IA Rose
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Gerencie o prompt de sistema e a chave Gemini para a assistente Rose.
        </p>
      </div>

      <form onSubmit={handleSave} className="card space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Gemini API Key</label>
          <div className="relative">
            <input
              type={showApiKey ? "text" : "password"}
              className="input-field pr-12"
              placeholder="Cole a chave da API Gemini"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowApiKey((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              title={showApiKey ? "Ocultar chave" : "Exibir chave"}
            >
              {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <p className="text-slate-500 text-xs mt-1">
            A chave atual e mascarada por seguranca. Se mantiver o valor mascarado, ela nao sera alterada.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">System Prompt da Rose</label>
          <textarea
            className="input-field min-h-64 resize-y"
            placeholder="Descreva o comportamento da Rose..."
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 text-emerald-400 text-sm bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3">
            <CheckCircle2 size={14} />
            {success}
          </div>
        )}

        <div className="flex flex-wrap gap-3 justify-end">
          <button
            type="button"
            onClick={handleRestoreDefaultPrompt}
            className="px-4 py-2 rounded-xl border border-slate-700 text-slate-200 hover:bg-slate-800 text-sm flex items-center gap-2"
          >
            <RefreshCcw size={14} />
            Restaurar Prompt Padrao
          </button>

          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing}
            className="px-4 py-2 rounded-xl border border-violet-600/40 text-violet-300 hover:bg-violet-500/10 text-sm flex items-center gap-2 disabled:opacity-60"
          >
            {testing ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
            Testar Conexao
          </button>

          <button
            type="submit"
            disabled={saving}
            className="btn-primary flex items-center gap-2 disabled:opacity-60"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Salvar Configuracoes
          </button>
        </div>
      </form>

      <section className="card space-y-4">
        <div>
          <h3 className="text-white font-semibold text-lg">Base de Conhecimento</h3>
          <p className="text-slate-400 text-sm mt-1">
            Apenas arquivos Markdown (.md) sao aceitos para garantir a eficiencia da IA.
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".md"
          className="hidden"
          onChange={handleFileChange}
        />

        <div>
          <button
            type="button"
            onClick={handleOpenUpload}
            disabled={uploading}
            className="px-4 py-2 rounded-xl border border-violet-600/40 text-violet-300 hover:bg-violet-500/10 text-sm flex items-center gap-2 disabled:opacity-60"
          >
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {uploading ? "Enviando..." : "Fazer Upload de Arquivo"}
          </button>
        </div>

        <div className="space-y-2">
          {knowledgeDocs.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-4 text-sm text-slate-400">
              Nenhum arquivo enviado ainda.
            </div>
          ) : (
            knowledgeDocs.map((doc) => (
              <div
                key={doc.id}
                className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 flex items-center gap-3"
              >
                <FileText size={16} className="text-slate-400 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-slate-100 text-sm font-medium truncate">{doc.filename}</p>
                  <p className="text-slate-500 text-xs">Enviado em {formatDate(doc.createdAt)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteDoc(doc.id)}
                  disabled={deletingId === doc.id}
                  className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-500/10 disabled:opacity-60"
                  title="Excluir documento"
                >
                  {deletingId === doc.id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                </button>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
