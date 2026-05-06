import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, Bot, Trash2 } from "lucide-react";
import { apiFetch } from "../lib/api";
import { useChat } from "../context/ChatContext";

// Helper to parse basic markdown bold (**text**)
const formatText = (text) => {
  if (!text) return null;
  return text.split(/(\*\*[\s\S]*?\*\*)/g).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className="font-bold">{part.slice(2, -2)}</strong>;
    }
    return <span key={index}>{part}</span>;
  });
};

export default function ChatWidget() {
  const quickSuggestions = [
    "Como usar a Rose?",
    "Dúvidas sobre o Projeto",
  ];

  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);
  const {
    activeConversation,
    activeId,
    pendingIds,
    appendMessage,
    setPending,
    clearConversation,
    buildHistory,
    isChatOpen: isOpen,
    setIsChatOpen: setIsOpen,
  } = useChat();
  
  const messages = activeConversation?.messages ?? [];
  const isLoading = pendingIds.includes(activeId);

  // Scroll to bottom always
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const sendUserMessage = async (userMsg) => {
    if (!userMsg?.trim() || isLoading) return;

    const conversationId = activeConversation?.id;
    if (!conversationId) return;
    const historyToSend = buildHistory(activeConversation);
    
    // Optimistic UI update
    appendMessage(conversationId, { role: "user", text: userMsg });
    setPending(conversationId, true);

    try {
      const response = await apiFetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({
          history: historyToSend,
          message: userMsg
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        appendMessage(conversationId, { role: "model", text: data.response });
      } else {
        const serverMessage = data?.message || "Desculpa, ocorreu um erro ao contactar o servidor. 😢";
        appendMessage(conversationId, { role: "model", text: serverMessage });
      }
    } catch (err) {
      console.error(err);
      appendMessage(conversationId, {
        role: "model",
        text: "Desculpa, parece que não estou a conseguir pensar agora mesmo. Consegues tentar novamente mais tarde?",
      });
    } finally {
      setPending(conversationId, false);
    }
  };

  const handleSend = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput("");
    await sendUserMessage(userMsg);
  };

  const showSuggestions = messages.filter((msg) => msg.role === "user").length === 0;
  const handleClearConversation = () => {
    if (!activeId) return;
    if (!window.confirm("Deseja limpar esta conversa?")) return;
    clearConversation(activeId);
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="fixed inset-0 sm:static sm:inset-auto bg-slate-900 sm:border sm:border-slate-700/60 sm:rounded-2xl shadow-2xl shadow-violet-500/10 sm:mb-4 w-full sm:w-[28rem] md:w-[34rem] overflow-hidden flex flex-col transition-all duration-300 h-full sm:h-[36rem] z-50">
          {/* Header */}
          <div className="bg-slate-800 border-b border-slate-700/60 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-violet-500/20 text-violet-400 rounded-full flex items-center justify-center border border-violet-500/30 shadow-inner">
                <Bot size={20} />
              </div>
              <div className="flex flex-col">
                <h3 className="text-white font-semibold text-sm leading-tight">Assistente Rose</h3>
                <span className="text-violet-400 text-[10px] font-medium tracking-wide">TUTORIA TECH</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleClearConversation}
                disabled={isLoading}
                className="text-slate-400 hover:text-white hover:bg-slate-700 p-1.5 rounded-lg transition-colors disabled:opacity-50"
                title="Limpar conversa"
              >
                <Trash2 size={16} />
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white hover:bg-slate-700 p-1.5 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4 bg-slate-900/50">
            {showSuggestions && (
              <div className="flex flex-wrap gap-2">
                {quickSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => sendUserMessage(suggestion)}
                    disabled={isLoading}
                    className="text-xs px-3 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-200 hover:bg-violet-500/20 transition-colors disabled:opacity-50"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div 
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed shadow-sm ${
                    msg.role === "user" 
                      ? "bg-violet-600 text-white rounded-tr-sm" 
                      : "bg-slate-800 text-slate-200 border border-slate-700/50 rounded-tl-sm"
                  }`}
                  style={{ whiteSpace: "pre-wrap" }}
                >
                  {formatText(msg.text)}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-800 border border-slate-700/50 text-slate-400 max-w-[80%] rounded-2xl rounded-tl-sm px-4 py-2.5 text-[13px] flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin text-violet-400" />
                  <span className="animate-pulse">A Rose está a escrever...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 bg-slate-800 border-t border-slate-700/60">
            <form onSubmit={handleSend} className="flex gap-2 relative shadow-inner rounded-xl bg-slate-900 focus-within:ring-2 ring-violet-500/50 transition-all">
              <textarea
                rows={1}
                placeholder="Pergunte à Rose..."
                className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 pl-4 pr-14 py-3 outline-none resize-none custom-scrollbar"
                style={{ height: '44px', maxHeight: '120px', overflowY: 'auto' }}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = '44px';
                  const scrollHeight = e.target.scrollHeight;
                  e.target.style.height = Math.min(scrollHeight, 120) + 'px';
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e);
                    e.target.style.height = '44px';
                  }
                }}
                disabled={isLoading}
              />
              <button 
                type="submit" 
                disabled={!input.trim() || isLoading}
                className="absolute right-1.5 bottom-1.5 w-10 h-8 flex items-center justify-center rounded-lg bg-violet-600 hover:bg-violet-500 text-white transition-colors disabled:opacity-50 disabled:hover:bg-violet-600"
              >
                <Send size={15} className={isLoading ? "animate-pulse" : ""} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Button — HIDDEN ON MOBILE */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="hidden md:flex transition-all duration-300 w-14 h-14 bg-violet-600 hover:bg-violet-500 border border-violet-400/30 text-white rounded-full items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)] active:scale-95"
          title="Fale com a Assistente"
        >
          <MessageCircle size={24} />
        </button>
      )}
    </div>
  );
}
