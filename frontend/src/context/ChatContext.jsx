import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "tutoria_chat_state";
const MAX_CONVERSATIONS = 5;

const INITIAL_MESSAGE = {
  role: "model",
  text: "Ola! Eu sou a Rose. Posso ajudar com duvidas do projeto, materiais ou agenda.",
};

function safeParse(value, fallback) {
  try {
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function generateId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `chat_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

function buildConversation(title) {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    title: title || "Nova conversa",
    createdAt: now,
    updatedAt: now,
    messages: [INITIAL_MESSAGE],
  };
}

function deriveTitle(text) {
  const trimmed = (text || "").trim();
  if (!trimmed) return "Nova conversa";
  if (trimmed.length <= 36) return trimmed;
  return `${trimmed.slice(0, 36)}...`;
}

function loadInitialState() {
  const stored = safeParse(localStorage.getItem(STORAGE_KEY), null);
  if (stored && Array.isArray(stored.conversations) && stored.conversations.length > 0) {
    return {
      conversations: stored.conversations,
      activeId: stored.activeId || stored.conversations[0].id,
    };
  }

  const initial = buildConversation("Nova conversa");
  return {
    conversations: [initial],
    activeId: initial.id,
  };
}

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const initialState = loadInitialState();
  const [conversations, setConversations] = useState(initialState.conversations);
  const [activeId, setActiveId] = useState(initialState.activeId);
  const [pendingIds, setPendingIds] = useState([]);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ conversations, activeId })
    );
  }, [conversations, activeId]);

  const activeConversation = useMemo(
    () => conversations.find((conv) => conv.id === activeId) || conversations[0],
    [conversations, activeId]
  );

  function setActiveConversation(id) {
    setActiveId(id);
  }

  function startNewConversation() {
    const created = buildConversation("Nova conversa");
    setConversations((prev) => [created, ...prev].slice(0, MAX_CONVERSATIONS));
    setActiveId(created.id);
  }

  function appendMessage(conversationId, message) {
    if (!conversationId) return;

    setConversations((prev) => {
      const updatedList = prev.map((conv) => {
        if (conv.id !== conversationId) return conv;

        const hasUserMessage = conv.messages.some((msg) => msg.role === "user");
        const nextTitle =
          !hasUserMessage && message.role === "user"
            ? deriveTitle(message.text)
            : conv.title;

        return {
          ...conv,
          title: nextTitle,
          updatedAt: new Date().toISOString(),
          messages: [...conv.messages, message],
        };
      });

      const updatedConversation = updatedList.find((conv) => conv.id === conversationId);
      const rest = updatedList.filter((conv) => conv.id !== conversationId);
      const ordered = updatedConversation ? [updatedConversation, ...rest] : updatedList;

      return ordered.slice(0, MAX_CONVERSATIONS);
    });
  }

  function setPending(conversationId, isPending) {
    setPendingIds((prev) => {
      const set = new Set(prev);
      if (isPending) {
        set.add(conversationId);
      } else {
        set.delete(conversationId);
      }
      return Array.from(set);
    });
  }

  function clearConversation(conversationId) {
    if (!conversationId) return;

    setConversations((prev) => {
      const updatedList = prev.map((conv) => {
        if (conv.id !== conversationId) return conv;
        return {
          ...conv,
          title: "Nova conversa",
          updatedAt: new Date().toISOString(),
          messages: [INITIAL_MESSAGE],
        };
      });

      const updatedConversation = updatedList.find((conv) => conv.id === conversationId);
      const rest = updatedList.filter((conv) => conv.id !== conversationId);
      const ordered = updatedConversation ? [updatedConversation, ...rest] : updatedList;

      return ordered.slice(0, MAX_CONVERSATIONS);
    });
  }

  function buildHistory(conversation) {
    const source = conversation?.messages || [];
    return source.slice(1).map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.text }],
    }));
  }

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversation,
        activeId,
        pendingIds,
        setActiveConversation,
        startNewConversation,
        appendMessage,
        setPending,
        clearConversation,
        buildHistory,
        isChatOpen,
        setIsChatOpen,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}
