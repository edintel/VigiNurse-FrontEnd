"use client";
import { useEffect, useRef, useState } from "react";
import type { ConversationSummary, ChatMessage, ConversationMember } from "@/features/chat/types";

const AVATAR_COLORS = [
  { bg: "#dbeafe", text: "#1e40af" },
  { bg: "#dcfce7", text: "#166534" },
  { bg: "#fce7f3", text: "#9d174d" },
  { bg: "#fef9c3", text: "#854d0e" },
  { bg: "#ede9fe", text: "#5b21b6" },
  { bg: "#fee2e2", text: "#991b1b" },
  { bg: "#e0f2fe", text: "#075985" },
  { bg: "#fef3c7", text: "#92400e" },
];

function avatarColor(id: number) {
  return AVATAR_COLORS[id % AVATAR_COLORS.length];
}

function memberInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function fmtMsgTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtMsgDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return "Hoy";
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Ayer";
  return d.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function groupMessagesByDate(messages: ChatMessage[]) {
  const groups: { date: string; messages: ChatMessage[] }[] = [];
  for (const msg of messages) {
    const dateLabel = fmtMsgDate(msg.created_at);
    const last = groups[groups.length - 1];
    if (last && last.date === dateLabel) {
      last.messages.push(msg);
    } else {
      groups.push({ date: dateLabel, messages: [msg] });
    }
  }
  return groups;
}


// Componente para mostrar el panel lateral de miembros en un chat grupal
function MembersPanel({
  members,
  currentUserId,
  onClose,
}: {
  members: ConversationMember[];
  currentUserId: number;
  onClose: () => void;
}) {
  return (
    <div className="absolute inset-y-0 right-0 z-10 w-64 flex flex-col bg-white border-l border-[#e2e8f0] shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#f1f5f9] flex-shrink-0">
        <div>
          <p className="text-sm font-bold text-[#0f172a]">Participantes</p>
          <p className="text-[11px] text-slate-400">{members.length} miembros</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Member list */}
      <div className="flex-1 overflow-y-auto py-2">
        {members.map((member) => {
          const color = avatarColor(member.id);
          const isMe = member.id === currentUserId;
          return (
            <div
              key={member.id}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#f8fafc] transition"
            >
              <div
                className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-xs font-bold"
                style={{ backgroundColor: color.bg, color: color.text }}
              >
                {memberInitials(member.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[#0f172a] truncate">
                  {member.name}
                  {isMe && (
                    <span className="ml-1.5 text-[9px] font-bold text-[#09268E] bg-[#09268E]/10 rounded-full px-1.5 py-0.5">
                      Tú
                    </span>
                  )}
                </p>
                {member.email && (
                  <p className="text-[10px] text-slate-400 truncate">{member.email}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Componente principal del hilo de mensajes

interface MessageThreadProps {
  conversation: ConversationSummary;
  messages: ChatMessage[];
  currentUserId: number;
  loading: boolean;
  error: string | null;
  sending: boolean;
  sendError: string | null;
  onSend: (content: string) => void;
  onBack: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export function MessageThread({
  conversation,
  messages,
  currentUserId,
  loading,
  error,
  sending,
  sendError,
  onSend,
  onBack,
  messagesEndRef,
}: MessageThreadProps) {
  const [draft, setDraft] = useState("");
  const [showMembers, setShowMembers] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isGroup = conversation.type === "group";
  const otherMember = !isGroup
    ? conversation.members.find((m) => m.id !== currentUserId)
    : null;

  
  useEffect(() => {
    setShowMembers(false);
  }, [conversation.id]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleSend() {
    const content = draft.trim();
    if (!content || sending) return;
    onSend(content);
    setDraft("");
    textareaRef.current?.focus();
  }

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [draft]);

  const groups = groupMessagesByDate(messages);

  return (
    <div className="flex flex-col h-full">
      {/* Thread header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#e2e8f0] bg-white flex-shrink-0">
        {/* Back button (mobile) */}
        <button
          type="button"
          onClick={onBack}
          className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition cursor-pointer shrink-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
        </button>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[#0f172a] truncate">
            {conversation.display_name}
          </p>
          <p className="text-[11px] text-slate-400 truncate">
            {isGroup
              ? `${conversation.members.length} miembros`
              : otherMember?.email ?? ""}
          </p>
        </div>

        {/* Group members toggle */}
        {isGroup && (
          <button
            type="button"
            title={showMembers ? "Cerrar participantes" : "Ver participantes"}
            onClick={() => setShowMembers((v) => !v)}
            className={[
              "w-8 h-8 flex items-center justify-center rounded-lg transition cursor-pointer shrink-0",
              showMembers
                ? "bg-[#09268E] text-white"
                : "text-slate-500 hover:bg-slate-100 hover:text-[#09268E]",
            ].join(" ")}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
            </svg>
          </button>
        )}
      </div>

      {/* Body: messages + optional members panel */}
      <div className="flex-1 min-h-0 relative flex">
        {/* Messages area */}
        <div className={`flex-1 overflow-y-auto px-4 py-4 space-y-4 transition-all duration-200 ${showMembers ? "mr-64" : ""}`}>
          {loading ? (
            <div className="flex flex-col gap-3 animate-pulse">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`h-9 rounded-2xl ${i % 2 === 0 ? "bg-[#09268E]/20 w-48" : "bg-[#f1f5f9] w-40"}`}
                  />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="size-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
              <p className="text-xs text-slate-400">{error}</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="size-10 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
              </svg>
              <p className="text-sm font-semibold text-slate-400">Sin mensajes aún</p>
              <p className="text-xs text-slate-300">Sé el primero en escribir.</p>
            </div>
          ) : (
            groups.map((group) => (
              <div key={group.date} className="space-y-2">
                {/* Date divider */}
                <div className="flex items-center gap-3 my-2">
                  <div className="flex-1 h-px bg-[#f1f5f9]" />
                  <span className="text-[10px] font-semibold text-slate-400 shrink-0 capitalize">
                    {group.date}
                  </span>
                  <div className="flex-1 h-px bg-[#f1f5f9]" />
                </div>

                {group.messages.map((msg) => {
                  const isOwn = msg.sender_id === currentUserId;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}
                    >
                      {isGroup && !isOwn && msg.sender_name && (
                        <p className="text-[10px] font-semibold text-slate-500 mb-0.5 ml-1">
                          {msg.sender_name}
                        </p>
                      )}
                      <div
                        className={[
                          "max-w-[75%] px-3.5 py-2 text-sm leading-relaxed break-words",
                          isOwn
                            ? "bg-[#09268E] text-white rounded-2xl rounded-br-sm"
                            : "bg-white text-[#0f172a] border border-[#e2e8f0] rounded-2xl rounded-bl-sm shadow-sm",
                        ].join(" ")}
                      >
                        {msg.content}
                      </div>
                      <span className="text-[10px] mt-0.5 text-slate-400">
                        {fmtMsgTime(msg.created_at)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Members panel (absolute, overlaps from right) */}
        {isGroup && showMembers && (
          <MembersPanel
            members={conversation.members}
            currentUserId={currentUserId}
            onClose={() => setShowMembers(false)}
          />
        )}
      </div>

      {/* Composer */}
      <div className="flex-shrink-0 border-t border-[#e2e8f0] bg-white px-4 py-3">
        {sendError && (
          <p className="text-xs text-red-500 mb-2">{sendError}</p>
        )}
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            rows={1}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje... (Enter para enviar)"
            className="flex-1 resize-none rounded-xl bg-[#f8fafc] border border-[#e2e8f0] focus:border-[#09268E]/50 focus:bg-white outline-none px-3.5 py-2.5 text-sm transition overflow-hidden placeholder:text-slate-400"
            style={{ minHeight: "40px", maxHeight: "120px" }}
          />
          <button
            type="button"
            disabled={!draft.trim() || sending}
            onClick={handleSend}
            className="w-10 h-10 rounded-xl bg-[#09268E] text-white flex items-center justify-center shrink-0 hover:bg-[#1A2B5E] transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {sending ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
