"use client";
import { useState } from "react";
import type { ConversationSummary } from "@/features/chat/types";

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

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function fmtConvTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Ayer";
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
}

interface ConversationListProps {
  conversations: ConversationSummary[];
  selectedId: number | null;
  loading: boolean;
  error: string | null;
  onSelect: (conv: ConversationSummary) => void;
  onNewDirect: () => void;
  onNewGroup: () => void;
}

// Componente que muestra la lista de conversaciones en la barra lateral izquierda
export function ConversationList({
  conversations,
  selectedId,
  loading,
  error,
  onSelect,
  onNewDirect,
  onNewGroup,
}: ConversationListProps) {
  const [search, setSearch] = useState("");

  const filtered = conversations.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    if (c.display_name.toLowerCase().includes(q)) return true;
    if (c.members.some((m) => m.name.toLowerCase().includes(q))) return true;
    if (c.last_message?.content.toLowerCase().includes(q)) return true;
    return false;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-[#e2e8f0] flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-base font-extrabold text-[#0f172a]">VigiChat</h1>
          <div className="flex items-center gap-1">
            <button
              type="button"
              title="Nuevo chat directo"
              onClick={onNewDirect}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:bg-blue-50 hover:text-[#09268E] transition cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 0 1-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8Z" />
              </svg>
            </button>
            <button
              type="button"
              title="Crear grupo"
              onClick={onNewGroup}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:bg-blue-50 hover:text-[#09268E] transition cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar conversaciones..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-[#f1f5f9] border border-transparent focus:border-[#09268E]/30 focus:bg-white outline-none transition placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="space-y-0">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-[#f1f5f9] shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-[#f1f5f9] rounded w-3/4" />
                  <div className="h-2.5 bg-[#f1f5f9] rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full px-4 text-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="size-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            <p className="text-xs text-slate-400">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-4 text-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="size-10 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
            </svg>
            <p className="text-sm font-semibold text-slate-400">
              {search ? "Sin resultados" : "Sin conversaciones"}
            </p>
            {!search && (
              <p className="text-xs text-slate-300">
                Inicia un chat o crea un grupo para empezar.
              </p>
            )}
          </div>
        ) : (
          filtered.map((conv) => {
            const isSelected = conv.id === selectedId;
            const color = avatarColor(conv.id);
            const timeStr = conv.last_message
              ? fmtConvTime(conv.last_message.created_at)
              : fmtConvTime(conv.created_at);

            return (
              <button
                key={conv.id}
                type="button"
                onClick={() => onSelect(conv)}
                className={[
                  "w-full flex items-center gap-3 px-4 py-3 text-left transition cursor-pointer border-b border-[#f8fafc]",
                  isSelected
                    ? "bg-[#09268E]/5 border-r-2 border-r-[#09268E]"
                    : "hover:bg-[#f8fafc]",
                ].join(" ")}
              >
                {/* Avatar */}
                <div
                  className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-xs font-bold"
                  style={{ backgroundColor: color.bg, color: color.text }}
                >
                  {conv.type === "group" ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                    </svg>
                  ) : (
                    initials(conv.display_name)
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-1 mb-0.5">
                    <p className={`text-xs font-semibold truncate ${isSelected ? "text-[#09268E]" : "text-[#0f172a]"}`}>
                      {conv.display_name}
                    </p>
                    <span className="text-[10px] text-slate-400 shrink-0">{timeStr}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">
                    {conv.last_message
                      ? conv.last_message.content
                      : conv.type === "group"
                        ? `${conv.members.length} miembros`
                        : "Sin mensajes aún"}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
