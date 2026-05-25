"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import { selectCurrentUser } from "@/store/slices/authSlice";
import { useRealtime } from "@/features/realtime/RealtimeContext";
import {
  getConversations,
  getConversationMessages,
  sendMessage,
} from "@/features/chat/services/chatService";
import type { ConversationSummary, ChatMessage } from "@/features/chat/types";
import { ConversationList } from "./ConversationList";
import { MessageThread } from "./MessageThread";
import { NewDirectChatModal } from "./NewDirectChatModal";
import { CreateGroupModal } from "./CreateGroupModal";

export default function ChatPage() {
  const user = useAppSelector(selectCurrentUser);
  const searchParams = useSearchParams();
  const urlConvId = searchParams.get("conversationId");
  const realtime = useRealtime();

  const currentUserId = user ? Number(user.id) : 0;

  // Conversaciones
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [convError, setConvError] = useState<string | null>(null);

  // Conversacion seleccionada
  const [selectedConv, setSelectedConv] = useState<ConversationSummary | null>(null);
  const selectedConvIdRef = useRef<number | null>(null);
  const realtimeRef = useRef(realtime);

  // Mensajes
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [msgError, setMsgError] = useState<string | null>(null);

  // Estados de envio
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  // Modales
  const [showNewDirect, setShowNewDirect] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);

  // Vista móvil: "list" para lista de conversaciones, "thread" para hilo de mensajes
  const [mobileView, setMobileView] = useState<"list" | "thread">("list");

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Cargar conversaciones al montar el componente
  const loadConversations = useCallback(async () => {
    setLoadingConvs(true);
    setConvError(null);
    try {
      const data = await getConversations();
      setConversations(
        [...data].sort((a, b) => {
          const ta = a.last_message?.created_at ?? a.created_at;
          const tb = b.last_message?.created_at ?? b.created_at;
          return new Date(tb).getTime() - new Date(ta).getTime();
        }),
      );
    } catch {
      setConvError("No se pudieron cargar las conversaciones.");
    } finally {
      setLoadingConvs(false);
    }
  }, []);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  // Seleccionar conversación de la URL (si existe) después de cargar conversaciones
  useEffect(() => {
    if (!urlConvId || loadingConvs || conversations.length === 0) return;
    const id = Number(urlConvId);
    if (selectedConvIdRef.current === id) return;
    const conv = conversations.find((c) => c.id === id);
    if (conv) handleSelectConversation(conv);
    
  }, [urlConvId, loadingConvs, conversations]);

  // Seleccionar conversación y cargar mensajes
  function handleSelectConversation(conv: ConversationSummary) {
    
    if (selectedConvIdRef.current !== null) {
      realtime.unsubscribeConversation(selectedConvIdRef.current);
    }

    selectedConvIdRef.current = conv.id;
    setSelectedConv(conv);
    setMessages([]);
    setMsgError(null);
    setSendError(null);
    setMobileView("thread");

    // Suscribirse a actualizaciones en esta conversación
    realtime.subscribeConversation(conv.id);

    // Cargar mensajes de la conversación
    setLoadingMsgs(true);
    getConversationMessages(conv.id)
      .then((msgs) => {
        setMessages(
          [...msgs].sort(
            (a, b) =>
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
          ),
        );
      })
      .catch(() => setMsgError("No se pudieron cargar los mensajes."))
      .finally(() => setLoadingMsgs(false));
  }

  // Actualizar referencia de realtime para usar en listeners y cleanup sin depender del estado
  useEffect(() => {
    realtimeRef.current = realtime;
  }, [realtime]);

  // Desuscribirse de la conversación al desmontar el componente
  useEffect(() => {
    return () => {
      if (selectedConvIdRef.current !== null) {
        realtimeRef.current.unsubscribeConversation(selectedConvIdRef.current);
      }
    };
  }, []);

  // Manejar mensajes entrantes en tiempo real
  const handleNewMessage = useCallback(
    (msg: ChatMessage) => {
      // Añade el mensaje a la conversación si es la misma, evitando duplicados
      if (msg.conversation_id === selectedConvIdRef.current) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }

      // Actualizar última conversación
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.id === msg.conversation_id);
        if (idx === -1) {
          
          void getConversations()
            .then((data) =>
              setConversations(
                [...data].sort((a, b) => {
                  const ta = a.last_message?.created_at ?? a.created_at;
                  const tb = b.last_message?.created_at ?? b.created_at;
                  return new Date(tb).getTime() - new Date(ta).getTime();
                }),
              ),
            )
            .catch(() => {});
          return prev;
        }
        const updated = [...prev];
        updated[idx] = { ...updated[idx], last_message: msg };
        const [moved] = updated.splice(idx, 1);
        return [moved, ...updated];
      });
    },
    [],
  );

  useEffect(() => {
    realtime.addMessageListener(handleNewMessage);
    return () => {
      realtime.removeMessageListener(handleNewMessage);
    };
  }, [realtime, handleNewMessage]);

  // Desplazar al final de los mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Enviar mensaje
  async function handleSend(content: string) {
    if (!selectedConv || !content.trim()) return;
    setSending(true);
    setSendError(null);
    try {
      const msg = await sendMessage(selectedConv.id, content.trim());
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.id === selectedConv.id);
        if (idx === -1) return prev;
        const updated = [...prev];
        updated[idx] = { ...updated[idx], last_message: msg };
        const [moved] = updated.splice(idx, 1);
        return [moved, ...updated];
      });
    } catch {
      setSendError("Error al enviar el mensaje.");
    } finally {
      setSending(false);
    }
  }

  // Manejar creación de nueva conversación (directa o grupo)
  function handleConversationCreated(conv: ConversationSummary) {
    setShowNewDirect(false);
    setShowNewGroup(false);
    setConversations((prev) => {
      const existing = prev.findIndex((c) => c.id === conv.id);
      if (existing !== -1) {
        const updated = [...prev];
        updated[existing] = conv;
        const [moved] = updated.splice(existing, 1);
        return [moved, ...updated];
      }
      return [conv, ...prev];
    });
    handleSelectConversation(conv);
  }

  if (!user) return null;

  return (
    <div className="h-[calc(100vh-4rem)] md:h-full flex overflow-hidden bg-[#EEEEEE]">
      <NewDirectChatModal
        open={showNewDirect}
        currentUserId={currentUserId}
        onClose={() => setShowNewDirect(false)}
        onCreated={handleConversationCreated}
      />
      <CreateGroupModal
        open={showNewGroup}
        currentUserId={currentUserId}
        onClose={() => setShowNewGroup(false)}
        onCreated={handleConversationCreated}
      />

      <div
        className={[
          "bg-white border-r border-[#e2e8f0] flex-shrink-0 flex flex-col",
          "w-full md:w-72 lg:w-80",
          mobileView === "thread" ? "hidden md:flex" : "flex",
        ].join(" ")}
      >
        <ConversationList
          conversations={conversations}
          selectedId={selectedConv?.id ?? null}
          loading={loadingConvs}
          error={convError}
          onSelect={handleSelectConversation}
          onNewDirect={() => setShowNewDirect(true)}
          onNewGroup={() => setShowNewGroup(true)}
        />
      </div>

      <div
        className={[
          "flex-1 min-w-0 flex flex-col bg-[#f8fafc]",
          mobileView === "list" ? "hidden md:flex" : "flex",
        ].join(" ")}
      >
        {selectedConv ? (
          <MessageThread
            conversation={selectedConv}
            messages={messages}
            currentUserId={currentUserId}
            loading={loadingMsgs}
            error={msgError}
            sending={sending}
            sendError={sendError}
            onSend={(content) => void handleSend(content)}
            onBack={() => setMobileView("list")}
            messagesEndRef={messagesEndRef}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-8">
            <div className="w-20 h-20 rounded-3xl bg-white border border-[#e2e8f0] shadow-sm flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="size-9 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
              </svg>
            </div>
            <div>
              <p className="text-base font-bold text-[#0f172a]">VigiChat</p>
              <p className="text-sm text-slate-400 mt-1">
                Selecciona una conversación o inicia un nuevo chat.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
