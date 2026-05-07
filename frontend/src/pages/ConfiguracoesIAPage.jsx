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
  X,
} from "lucide-react";
import { apiFetch } from "../lib/api";


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
  const [queue, setQueue] = useState([]);
  const [processingId, setProcessingId] = useState(null);
  const [processingAttempts, setProcessingAttempts] = useState(0);
  const [failedIds, setFailedIds] = useState([]);
  const [canceledIds, setCanceledIds] = useState([]);
  const [deletingId, setDeletingId] = useState(null);

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const loadKnowledge = async () => {
    const res = await apiFetch("/api/settings/knowledge");
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message ?? "Erro ao carregar base de conhecimento.");
    }

    const list = Array.isArray(data) ? data : [];
    setKnowledgeDocs(list);
    return list;
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

  async function handleRestoreDefaultPrompt() {
    try {
      const res = await apiFetch("/api/settings/ai/default-prompt");
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erro ao buscar prompt padrão.");

      setSystemPrompt(data.prompt);
      setSuccess("Prompt padrão restaurado do arquivo rose-context.md. Clique em Salvar para aplicar.");
      setError("");
    } catch (err) {
      setError(err.message || "Falha ao restaurar prompt padrão.");
    }
  }

  function handleOpenUpload() {
    fileInputRef.current?.click();
  }

  function getChunksCount(doc) {
    return doc?._count?.chunks ?? doc?.chunksCount ?? 0;
  }

  function enqueueReprocess(id) {
    setError("");
    setSuccess("");
    setCanceledIds((prev) => prev.filter((value) => value !== id));
    setFailedIds((prev) => prev.filter((value) => value !== id));
    setQueue((prev) => {
      if (prev.includes(id) || processingId === id) return prev;
      return [...prev, id];
    });
  }

  function cancelReprocess(id) {
    setQueue((prev) => prev.filter((value) => value !== id));
    if (processingId === id) {
      setProcessingId(null);
      setProcessingAttempts(0);
    }
    setCanceledIds((prev) => Array.from(new Set([...prev, id])));
  }

  async function startReprocess(id) {
    setProcessingId(id);
    setProcessingAttempts(0);
    setError("");
    setSuccess("");

    try {
      const res = await apiFetch("/api/settings/knowledge/reprocess", {
        method: "POST",
        body: JSON.stringify({ ids: [id] }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message ?? "Erro ao enfileirar reprocessamento.");
      }

      setSuccess(data.message ?? "Arquivo enfileirado para vetorizacao.");
    } catch (err) {
      setError(err.message || "Erro inesperado ao enfileirar.");
      setFailedIds((prev) => Array.from(new Set([...prev, id])));
      setProcessingId(null);
    }
  }

  useEffect(() => {
    if (processingId || queue.length === 0) return;
    const [nextId, ...rest] = queue;
    setQueue(rest);
    startReprocess(nextId);
  }, [queue, processingId]);

  useEffect(() => {
    if (!processingId) return;

    let cancelled = false;
    const maxAttempts = 40;
    const intervalId = setInterval(async () => {
      try {
        const list = await loadKnowledge();
        if (cancelled) return;

        const doc = list.find((item) => item.id === processingId);
        if (!doc) {
          setProcessingId(null);
          setProcessingAttempts(0);
          return;
        }

        if (getChunksCount(doc) > 0) {
          setCanceledIds((prev) => prev.filter((value) => value !== processingId));
          setFailedIds((prev) => prev.filter((value) => value !== processingId));
          setProcessingId(null);
          setProcessingAttempts(0);
          return;
        }

        setProcessingAttempts((prev) => {
          const next = prev + 1;
          if (next >= maxAttempts) {
            setFailedIds((items) => Array.from(new Set([...items, processingId])));
            setProcessingId(null);
            setError("Nao foi possivel concluir a vetorizacao desse arquivo. Tente novamente.");
            return 0;
          }
          return next;
        });
      } catch {
        // Ignora falhas pontuais de polling
      }
    }, 3000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [processingId]);

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = "";

    if (!file) return;

    const lowerName = file.name.toLowerCase();
    const allowedExtensions = [".md", ".pdf", ".docx", ".txt", ".xlsx", ".csv", ".pptx"];
    if (!allowedExtensions.some(ext => lowerName.endsWith(ext))) {
      setError("Formato não suportado. Tente um arquivo de texto, documento ou planilha.");
      setSuccess("");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("O arquivo deve ter no máximo 10MB.");
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
            Envie arquivos do tipo documento, PDF, texto ou planilha para treinar a Inteligência Artificial.
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".md,.pdf,.docx,.txt,.xlsx,.csv,.pptx"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="flex flex-wrap gap-3">
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
            knowledgeDocs.map((doc) => {
              const chunksCount = getChunksCount(doc);
              const isProcessing = processingId === doc.id;
              const isQueued = queue.includes(doc.id);
              const isFailed = failedIds.includes(doc.id);
              const isCanceled = canceledIds.includes(doc.id);
              const isDone = chunksCount > 0;
              const statusText = isProcessing
                ? "Vetorizando"
                : isQueued
                ? "Na fila"
                : isDone
                ? "OK"
                : isCanceled
                ? "Cancelado"
                : isFailed
                ? "Falhou"
                : "Pendente";
              const statusClass = isProcessing
                ? "text-sky-300"
                : isQueued
                ? "text-amber-300"
                : isDone
                ? "text-emerald-400"
                : isCanceled
                ? "text-red-400"
                : isFailed
                ? "text-red-400"
                : "text-slate-500";

              return (
              <div
                key={doc.id}
                className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 flex items-center gap-3"
              >
                <FileText size={16} className="text-slate-400 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  {doc.fileUrl ? (
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-slate-100 text-sm font-medium truncate hover:underline"
                      title="Abrir arquivo"
                    >
                      {doc.filename}
                    </a>
                  ) : (
                    <p className="text-slate-100 text-sm font-medium truncate">{doc.filename}</p>
                  )}
                  <p className="text-slate-500 text-xs">Enviado em {formatDate(doc.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {isProcessing ? (
                    <Loader2 size={14} className="animate-spin text-sky-300" />
                  ) : isDone ? (
                    <CheckCircle2 size={14} className="text-emerald-400" />
                  ) : isFailed ? (
                    <AlertCircle size={14} className="text-red-400" />
                  ) : (
                    <AlertCircle size={14} className="text-slate-500" />
                  )}
                  {statusText ? <span className={statusClass}>{statusText}</span> : null}
                </div>
                <div className="flex items-center gap-2">
                  {(isProcessing || isQueued) ? (
                    <button
                      type="button"
                      onClick={() => cancelReprocess(doc.id)}
                      className="px-3 py-1.5 rounded-lg border border-red-500/40 text-red-300 hover:bg-red-500/10 text-xs flex items-center gap-2"
                      title="Cancelar vetorizacao"
                    >
                      <X size={12} />
                      Cancelar
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => enqueueReprocess(doc.id)}
                      className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-200 hover:bg-slate-800 text-xs flex items-center gap-2"
                      title="Vetorizar este arquivo"
                    >
                      <RefreshCcw size={12} />
                      {isDone ? "Reprocessar" : "Vetorizar"}
                    </button>
                  )}
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
            );
            })
          )}
        </div>
      </section>
    </div>
  );
}
