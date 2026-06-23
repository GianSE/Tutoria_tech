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
  Search,
  ExternalLink,
  Globe,
  Link,
  RotateCw,
  Network,
} from "lucide-react";
import { apiFetch } from "../lib/api";
import Modal from "../components/Modal";

{/* ## interage com /api/settings/knowledge               */}
{/* ## conexão com os endpoints do backend para uso de IA */}

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

  const [viewingDoc, setViewingDoc] = useState(null);
  const [docChunks, setDocChunks] = useState([]);
  const [loadingChunks, setLoadingChunks] = useState(false);
  const [showApiKeyHelp, setShowApiKeyHelp] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [addingUrl, setAddingUrl] = useState(false);
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [showCrawlModal, setShowCrawlModal] = useState(false);
  const [crawlUrl, setCrawlUrl] = useState("");
  const [crawling, setCrawling] = useState(false);
  const [crawledUrls, setCrawledUrls] = useState([]);
  const [selectedUrls, setSelectedUrls] = useState(new Set());
  const [addingCrawled, setAddingCrawled] = useState(false);


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
        throw new Error(data.message ?? "Chave inválida. Verifique e tente novamente.");
      }

      // Chave válida: salva automaticamente
      const saveRes = await apiFetch("/api/settings/ai", {
        method: "PUT",
        body: JSON.stringify({ apiKey }),
      });
      if (!saveRes.ok) {
        const saveData = await saveRes.json();
        throw new Error(saveData.message ?? "Chave válida, mas erro ao salvar.");
      }

      setSuccess("Chave válida e salva com sucesso!");
    } catch (err) {
      setError(err.message || "Não foi possível validar a chave no momento.");
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

  async function handleRevokeKey() {
    setRevoking(true);
    setError("");
    setSuccess("");
    try {
      const res = await apiFetch("/api/settings/ai", {
        method: "PUT",
        body: JSON.stringify({ apiKey: "" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Erro ao revogar a chave.");
      setApiKey("");
      setShowRevokeConfirm(false);
      setSuccess("Chave Gemini revogada. A Rose ficará indisponível até uma nova chave ser configurada.");
    } catch (err) {
      setError(err.message);
    } finally {
      setRevoking(false);
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

  const handleViewChunks = async (doc) => {
    setViewingDoc(doc);
    setLoadingChunks(true);
    setDocChunks([]);
    try {
      const res = await apiFetch(`/api/settings/knowledge/${doc.id}/chunks`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erro ao buscar conteúdo.");
      setDocChunks(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingChunks(false);
    }
  };

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

  async function handleCrawl(e) {
    e.preventDefault();
    if (!crawlUrl.startsWith("http")) return;
    setCrawling(true);
    setCrawledUrls([]);
    setSelectedUrls(new Set());
    setError("");
    try {
      const res = await apiFetch("/api/settings/knowledge/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: crawlUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Erro ao rastrear.");
      setCrawledUrls(data.urls ?? []);
      setSelectedUrls(new Set(data.urls ?? []));
    } catch (err) {
      setError(err.message);
    } finally {
      setCrawling(false);
    }
  }

  async function handleAddCrawled() {
    const urls = [...selectedUrls];
    if (!urls.length) return;
    setAddingCrawled(true);
    setError("");
    try {
      const res = await apiFetch("/api/settings/knowledge/crawl-add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Erro ao adicionar.");
      await loadKnowledge();
      setShowCrawlModal(false);
      setCrawlUrl("");
      setCrawledUrls([]);
      setSelectedUrls(new Set());
      setSuccess(data.message ?? "URLs adicionadas com sucesso!");
    } catch (err) {
      setError(err.message);
    } finally {
      setAddingCrawled(false);
    }
  }

  function toggleUrl(url) {
    setSelectedUrls(prev => {
      const next = new Set(prev);
      next.has(url) ? next.delete(url) : next.add(url);
      return next;
    });
  }

  async function handleAddUrl(e) {
    e.preventDefault();
    const url = urlInput.trim();
    if (!url.startsWith("http")) {
      setError("URL inválida. Deve começar com http:// ou https://");
      return;
    }
    setAddingUrl(true);
    setError("");
    setSuccess("");
    try {
      const res = await apiFetch("/api/settings/knowledge/url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Erro ao adicionar URL.");
      await loadKnowledge();
      setUrlInput("");
      setSuccess(data.message ?? "URL adicionada! Clique em Vetorizar para processar.");
    } catch (err) {
      setError(err.message || "Erro ao adicionar URL.");
    } finally {
      setAddingUrl(false);
    }
  }

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
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-slate-300">Gemini API Key</label>
            <button
              type="button"
              onClick={() => setShowApiKeyHelp(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-violet-400 hover:text-violet-300 border border-violet-500/30 hover:border-violet-400/50 bg-violet-500/5 hover:bg-violet-500/10 px-2.5 py-1 rounded-lg transition-all"
            >
              <ExternalLink size={11} />
              Obter chave gratuita
            </button>
          </div>
          <div className="relative">
            <input
              type={showApiKey ? "text" : "password"}
              className={`input-field ${apiKey ? "pr-20" : "pr-12"}`}
              placeholder="Cole a chave da API Gemini"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {apiKey && (
                <button
                  type="button"
                  onClick={() => setShowRevokeConfirm(true)}
                  className="text-slate-500 hover:text-red-400 hover:bg-red-500/10 p-1.5 rounded-lg transition-colors"
                  title="Revogar chave"
                >
                  <Trash2 size={14} />
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowApiKey((prev) => !prev)}
                className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                title={showApiKey ? "Ocultar chave" : "Exibir chave"}
              >
                {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-slate-500 text-xs">
              A chave atual é mascarada por segurança. Se mantiver o valor mascarado, ela não será alterada.
            </p>
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing || !apiKey}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-violet-600/40 text-violet-300 hover:bg-violet-500/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0 ml-4"
            >
              {testing ? <Loader2 size={12} className="animate-spin" /> : <ShieldCheck size={12} />}
              {testing ? "Testando..." : "Testar API Key"}
            </button>
          </div>
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
            Restaurar Prompt Padrão
          </button>

          <button
            type="submit"
            disabled={saving}
            className="btn-primary flex items-center gap-2 disabled:opacity-60"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Salvar Configurações
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

        {/* Upload de arquivo + Rastrear site */}
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
          <button
            type="button"
            onClick={() => { setShowCrawlModal(true); setCrawledUrls([]); setSelectedUrls(new Set()); setCrawlUrl(""); }}
            className="px-4 py-2 rounded-xl border border-violet-600/40 text-violet-300 hover:bg-violet-500/10 text-sm flex items-center gap-2"
          >
            <Network size={14} /> Rastrear páginas do site
          </button>
        </div>

        {/* Adicionar URL */}
        <div className="border-t border-slate-800 pt-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
            <Globe size={12} /> Adicionar URL / Site
          </p>
          <form onSubmit={handleAddUrl} className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Link size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="url"
                placeholder="https://exemplo.com/pagina"
                className="input-field pl-9 text-sm"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={addingUrl || !urlInput}
              className="px-4 py-2.5 rounded-xl border border-violet-600/40 text-violet-300 hover:bg-violet-500/10 text-sm flex items-center justify-center gap-2 disabled:opacity-40 sm:shrink-0"
            >
              {addingUrl ? <Loader2 size={14} className="animate-spin" /> : <Globe size={14} />}
              {addingUrl ? "Adicionando..." : "Adicionar URL"}
            </button>
          </form>
          <p className="text-slate-600 text-xs mt-1.5">
            A Rose irá ler e memorizar o conteúdo desta página. Para atualizar, clique em "Reprocessar".
          </p>
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

              const isUrl = doc.filename.startsWith("http");
              const displayName = isUrl
                ? doc.filename
                : doc.filename.replace(/^knowledge-default-|^knowledge-\d+-/, "");

              return (
              <div
                key={doc.id}
                className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-2.5"
              >
                {/* Linha 1: ícone + nome + lixeira */}
                <div className="flex items-start gap-2">
                  <div className="shrink-0 mt-0.5">
                    {isUrl
                      ? <Globe size={15} className="text-violet-400" />
                      : <FileText size={15} className="text-slate-400" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    {isUrl ? (
                      <a href={doc.filename} target="_blank" rel="noreferrer"
                        className="text-violet-300 text-sm font-medium hover:underline flex items-center gap-1 min-w-0"
                        title={doc.filename}>
                        <span className="truncate block">{displayName}</span>
                        <ExternalLink size={11} className="shrink-0" />
                      </a>
                    ) : doc.fileUrl ? (
                      <a href={doc.fileUrl} target="_blank" rel="noreferrer"
                        className="text-slate-100 text-sm font-medium truncate block hover:underline">
                        {displayName}
                      </a>
                    ) : (
                      <p className="text-slate-100 text-sm font-medium truncate">{displayName}</p>
                    )}
                    <p className="text-slate-500 text-xs mt-0.5">
                      {isUrl ? "URL" : "Arquivo"} · {formatDate(doc.createdAt)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteDoc(doc.id)}
                    disabled={deletingId === doc.id}
                    className="shrink-0 text-slate-600 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 disabled:opacity-60 transition-colors"
                    title="Excluir documento"
                  >
                    {deletingId === doc.id
                      ? <Loader2 size={14} className="animate-spin" />
                      : <Trash2 size={14} />
                    }
                  </button>
                </div>

                {/* Linha 2: status + botões de ação */}
                <div className="flex items-center justify-between gap-2 pl-5">
                  <div className="flex items-center gap-1.5">
                    {isProcessing ? (
                      <Loader2 size={12} className="animate-spin text-sky-300" />
                    ) : isDone ? (
                      <CheckCircle2 size={12} className="text-emerald-400" />
                    ) : isFailed ? (
                      <AlertCircle size={12} className="text-red-400" />
                    ) : (
                      <AlertCircle size={12} className="text-slate-500" />
                    )}
                    <span className={`text-xs ${statusClass}`}>{statusText}</span>
                    {isDone && (
                      <button
                        onClick={() => handleViewChunks(doc)}
                        className="text-violet-400 hover:text-violet-300 text-[10px] font-bold uppercase tracking-wider ml-1"
                      >
                        Ver chunks
                      </button>
                    )}
                  </div>

                  {(isProcessing || isQueued) ? (
                    <button
                      type="button"
                      onClick={() => cancelReprocess(doc.id)}
                      className="px-2.5 py-1 rounded-lg border border-red-500/40 text-red-300 hover:bg-red-500/10 text-xs flex items-center gap-1.5 shrink-0"
                    >
                      <X size={11} /> Cancelar
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => enqueueReprocess(doc.id)}
                      className="px-2.5 py-1 rounded-lg border border-slate-700 text-slate-200 hover:bg-slate-800 text-xs flex items-center gap-1.5 shrink-0"
                      title={isUrl ? "Reler e atualizar conteúdo da URL" : "Vetorizar este arquivo"}
                    >
                      {isUrl ? <RotateCw size={11} /> : <RefreshCcw size={11} />}
                      {isUrl ? (isDone ? "Atualizar" : "Vetorizar") : (isDone ? "Reprocessar" : "Vetorizar")}
                    </button>
                  )}
                </div>
              </div>
            );
            })
          )}
        </div>
      </section>

      {/* ─── Modal: Conteúdo do Documento ────────────────────────────────────── */}
      <Modal 
        isOpen={!!viewingDoc} 
        onClose={() => setViewingDoc(null)} 
        title={viewingDoc?.filename ?? "Conteúdo Processado"}
        size="lg"
      >
        {loadingChunks ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 size={32} className="text-violet-500 animate-spin" />
            <p className="text-slate-400 text-sm">Buscando fragmentos...</p>
          </div>
        ) : docChunks.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle size={32} className="text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500">Nenhum fragmento encontrado para este documento.</p>
            <p className="text-slate-600 text-xs mt-1">Tente reprocessar o arquivo.</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-2 custom-scrollbar">
            <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-3 mb-4">
              <p className="text-xs text-violet-300 leading-relaxed">
                Abaixo estão os fragmentos (chunks) que a Rose utiliza para consulta. 
                Estes textos foram extraídos e indexados para busca semântica.
              </p>
            </div>
            
            {docChunks.map((chunk, idx) => (
              <div key={chunk.id || idx} className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Fragmento #{idx + 1}</span>
                  <span className="text-[10px] text-slate-600">{chunk.content.length} caracteres</span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap font-serif">
                  {chunk.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </Modal>
      
      {/* ─── Modal: Confirmar revogação da chave ─────────────────────────────── */}
      <Modal isOpen={showRevokeConfirm} onClose={() => setShowRevokeConfirm(false)} title="Revogar Gemini API Key" size="sm">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30">
            <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm text-red-200 leading-relaxed">
              A assistente Rose ficará <span className="font-bold">indisponível</span> até uma nova chave ser configurada.
              Esta ação não afeta a base de conhecimento (chunks já vetorizados continuam salvos).
            </p>
          </div>
          <p className="text-slate-400 text-sm">
            Tem certeza que deseja remover a chave?
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowRevokeConfirm(false)}
              className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={handleRevokeKey}
              disabled={revoking}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-60"
            >
              {revoking ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              {revoking ? "Revogando..." : "Sim, revogar"}
            </button>
          </div>
        </div>
      </Modal>

      {/* ─── Modal: Rastrear páginas do site ─────────────────────────────────── */}
      <Modal isOpen={showCrawlModal} onClose={() => setShowCrawlModal(false)} title="Rastrear páginas do site" size="md">
        <div className="space-y-4">
          <p className="text-slate-400 text-sm">
            Informe a URL base do site. O sistema descobrirá automaticamente todas as páginas internas e você escolhe quais adicionar à base de conhecimento da Rose.
          </p>

          {/* Input URL base */}
          <form onSubmit={handleCrawl} className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Network size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="url"
                placeholder="https://meninas.sbc.org.br/"
                className="input-field pl-9 text-sm"
                value={crawlUrl}
                onChange={(e) => setCrawlUrl(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={crawling || !crawlUrl}
              className="px-4 py-2.5 rounded-xl border border-violet-600/40 text-violet-300 hover:bg-violet-500/10 text-sm flex items-center justify-center gap-2 disabled:opacity-40 sm:shrink-0"
            >
              {crawling ? <Loader2 size={14} className="animate-spin" /> : <Network size={14} />}
              {crawling ? "Rastreando..." : "Rastrear"}
            </button>
          </form>

          {/* Lista de URLs encontradas */}
          {crawledUrls.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-300 font-semibold">
                  {crawledUrls.length} página{crawledUrls.length !== 1 ? "s" : ""} encontrada{crawledUrls.length !== 1 ? "s" : ""}
                </p>
                <div className="flex gap-3 text-xs">
                  <button onClick={() => setSelectedUrls(new Set(crawledUrls))} className="text-violet-400 hover:text-violet-300">Selecionar todas</button>
                  <button onClick={() => setSelectedUrls(new Set())} className="text-slate-500 hover:text-slate-300">Limpar</button>
                </div>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
                {crawledUrls.map((url) => (
                  <label key={url} className="flex items-start gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-800/60 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedUrls.has(url)}
                      onChange={() => toggleUrl(url)}
                      className="mt-0.5 accent-violet-500 shrink-0"
                    />
                    <span className="text-slate-300 text-xs break-all leading-relaxed">{url}</span>
                  </label>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <span className="text-xs text-slate-500">{selectedUrls.size} selecionada{selectedUrls.size !== 1 ? "s" : ""}</span>
                <button
                  onClick={handleAddCrawled}
                  disabled={selectedUrls.size === 0 || addingCrawled}
                  className="btn-primary flex items-center gap-2 disabled:opacity-40 text-sm"
                >
                  {addingCrawled ? <Loader2 size={14} className="animate-spin" /> : <Globe size={14} />}
                  {addingCrawled ? "Adicionando..." : `Adicionar ${selectedUrls.size} página${selectedUrls.size !== 1 ? "s" : ""}`}
                </button>
              </div>
            </div>
          )}

          {!crawling && crawlUrl && crawledUrls.length === 0 && (
            <p className="text-slate-500 text-sm text-center py-4">
              Clique em "Rastrear" para descobrir as páginas do site.
            </p>
          )}
        </div>
      </Modal>

      {/* ─── Modal: Ajuda com a API Key ────────────────────────────────────────── */}
      <Modal
        isOpen={showApiKeyHelp}
        onClose={() => setShowApiKeyHelp(false)}
        title="Como obter sua Gemini API Key"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-slate-300 text-sm leading-relaxed">
            Para que a assistente Rose funcione, você precisa de uma chave de API do Google Gemini.
          </p>
          
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <ol className="list-decimal list-inside text-sm text-slate-400 space-y-2.5">
              <li>Acesse o <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="text-violet-400 hover:underline">Google AI Studio</a>.</li>
              <li>Faça login com sua conta Google.</li>
              <li>Clique em <span className="text-slate-200">"Chaves de API"</span> no menu lateral.</li>
              <li>Clique em <span className="text-slate-200">"Criar chave de API"</span>.</li>
              <li>Copie a chave gerada e cole no campo <span className="text-slate-200">Gemini API Key</span>.</li>
              <li>Clique em <span className="text-violet-400 font-semibold">Testar API Key</span> — se válida, a chave é <span className="text-emerald-400 font-semibold">salva automaticamente</span>.</li>
            </ol>
          </div>

          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-4 py-3 flex items-start gap-2">
            <ShieldCheck size={15} className="text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-300 leading-relaxed">
              O botão <span className="font-bold">Testar API Key</span> valida e já salva a chave automaticamente — sem precisar clicar em salvar depois.
            </p>
          </div>

          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noreferrer"
            className="btn-primary w-full text-center py-2.5 flex items-center justify-center gap-2"
          >
            <ExternalLink size={15} />
            Ir para Google AI Studio
          </a>
        </div>
      </Modal>

    </div>
  );
}

