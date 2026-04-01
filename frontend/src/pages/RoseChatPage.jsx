import { useEffect, useRef, useState } from "react";
import { Bot, Loader2, Send } from "lucide-react";
import { apiFetch } from "../lib/api";

const INITIAL_MESSAGE = {
  role: "model",
  text: "Olá! Eu sou a Rose. Vamos conversar? Posso ajudar com dúvidas técnicas, organização dos estudos e progresso no projeto.",
};

function formatText(text) {
  if (!text) return null;
  return text.split(/(\*\*[\s\S]*?\*\*)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-bold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

export default function RoseChatPage() {
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  async function sendUserMessage(rawMessage) {
    const userMsg = rawMessage.trim();
    if (!userMsg || isLoading) return;

    const nextMessages = [...messages, { role: "user", text: userMsg }];
    setMessages(nextMessages);
    setIsLoading(true);

    try {
      const historyToSend = messages.slice(1).map((m) => ({
        role: m.role,
        parts: [{ text: m.text }],
      }));

      const response = await apiFetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({
          history: historyToSend,
          message: userMsg,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessages([...nextMessages, { role: "model", text: data.response }]);
      } else {
        setMessages([
          ...nextMessages,
          { role: "model", text: data?.message || "Erro ao contactar a Rose." },
        ]);
      }
    } catch (_error) {
      setMessages([
        ...nextMessages,
        {
          role: "model",
          text: "Não consegui responder agora. Tenta novamente em alguns instantes.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const userMessage = input;
    setInput("");
    await sendUserMessage(userMessage);
  }

  return (
    <section className="h-[calc(100vh-7.5rem)] max-w-5xl mx-auto flex flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-white">Conversa com a Rose</h1>
        <p className="text-slate-400 text-sm mt-1">
          Um espaço dedicado para conversar com a assistente de IA, no estilo chat.
        </p>
      </div>

      <div className="flex-1 min-h-0 rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-slate-800 bg-slate-900 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 flex items-center justify-center">
            <Bot size={18} />
          </div>
          <div>
            <p className="text-white text-sm font-semibold leading-tight">Rose</p>
            <p className="text-slate-400 text-xs leading-tight">Assistente IA do Tutoria Tech</p>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4">
          {messages.map((msg, index) => (
            <div
              key={`${msg.role}-${index}`}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-violet-600 text-white rounded-tr-sm"
                    : "bg-slate-800 text-slate-200 border border-slate-700/60 rounded-tl-sm"
                }`}
                style={{ whiteSpace: "pre-wrap" }}
              >
                {formatText(msg.text)}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-800 border border-slate-700/60 text-slate-300 rounded-2xl rounded-tl-sm px-4 py-3 text-sm flex items-center gap-2">
                <Loader2 size={14} className="animate-spin text-violet-300" />
                Rose está escrevendo...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="p-4 border-t border-slate-800 bg-slate-900">
          <div className="relative rounded-xl bg-slate-950 border border-slate-700 focus-within:border-violet-500/60 transition-colors">
            <textarea
              rows={1}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "44px";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Digite sua mensagem para a Rose..."
              disabled={isLoading}
              className="w-full bg-transparent resize-none outline-none text-sm text-white placeholder-slate-500 py-3 pl-4 pr-14"
              style={{ height: "44px", maxHeight: "140px", overflowY: "auto" }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-1.5 bottom-1.5 w-10 h-8 rounded-lg bg-violet-600 hover:bg-violet-500 text-white flex items-center justify-center disabled:opacity-50"
            >
              <Send size={15} />
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
