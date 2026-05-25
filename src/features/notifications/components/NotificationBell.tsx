"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useNotifications } from "@/features/notifications/NotificationsContext";
import { getEpisodeById } from "@/features/patients/services/episodeService";
import type { InternalNotification, NotificationType } from "@/features/notifications/types";

type TabId = "all" | "tasks" | "episodes" | "messages";

const TABS: { id: TabId; label: string }[] = [
  { id: "all", label: "Todas" },
  { id: "tasks", label: "Tareas" },
  { id: "episodes", label: "Episodios" },
  { id: "messages", label: "Mensajes" },
];

function filterNotifications(
  notifications: InternalNotification[],
  tab: TabId,
): InternalNotification[] {
  const unread = notifications.filter((n) => !n.isRead);
  switch (tab) {
    case "tasks":
      return unread.filter((n) => n.type === "task_assigned");
    case "episodes":
      return unread.filter((n) => n.type === "episode_assigned");
    case "messages":
      return unread.filter((n) => n.type === "message");
    default:
      return unread;
  }
}

function formatRelativeTime(isoString: string): string {
  try {
    const diff = Date.now() - new Date(isoString).getTime();
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return "Ahora mismo";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `Hace ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Hace ${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `Hace ${days}d`;
    return new Date(isoString).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
    });
  } catch {
    return "";
  }
}

// Iconos para cada tipo de notificación
function NotificationIcon({ type }: { type: NotificationType }) {
  if (type === "task_assigned") {
    return (
      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-blue-100">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#09268E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
          <rect x="9" y="3" width="6" height="4" rx="1" />
          <path d="M9 12h6M9 16h4" />
        </svg>
      </div>
    );
  }
  if (type === "episode_assigned") {
    return (
      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-green-100">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#166534" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      </div>
    );
  }
  if (type === "message") {
    return (
      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-violet-100">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>
    );
  }
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-slate-100">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    </div>
  );
}

// Componente principal de la campana de notificaciones
export function NotificationBell() {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    refresh,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<TabId>("all");
  const [navigatingId, setNavigatingId] = useState<number | null>(null);
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0 });

  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const filtered = filterNotifications(notifications, tab);

  useEffect(() => {
    refresh();
  }, [refresh]);

  
  useEffect(() => {
    if (!open) return;
    function handleOutside(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  function handleToggle() {
    if (!open) {
      refresh();
      const rect = buttonRef.current?.getBoundingClientRect();
      if (rect) {
        setPanelPos({
          top: rect.top,
          left: rect.right + 10,
        });
      }
    }
    setOpen((p) => !p);
  }

  async function handleItemClick(notification: InternalNotification) {
    await markAsRead(notification.id);
    setOpen(false);

    if (notification.type === "task_assigned") {
      router.push("/dashboard");
      return;
    }

    if (notification.type === "message") {
      if (notification.conversationId) {
        router.push(`/chat?conversationId=${notification.conversationId}`);
      } else {
        router.push("/chat");
      }
      return;
    }

    if (notification.type === "episode_assigned" && notification.episodeId) {
      setNavigatingId(notification.id);
      try {
        const episode = await getEpisodeById(notification.episodeId);
        router.push(`/patients/${episode.pacienteId}`);
      } catch {
        router.push("/patients");
      } finally {
        setNavigatingId(null);
      }
      return;
    }
  }

  return (
    <>
      <button
        ref={buttonRef}
        aria-label="Notificaciones"
        title="Notificaciones"
        className="relative flex items-center justify-center w-7 h-7 rounded-md text-[#092168] hover:bg-blue-50 transition-colors cursor-pointer"
        onClick={handleToggle}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-4 px-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open &&
        typeof window !== "undefined" &&
        createPortal(
        <div
          ref={panelRef}
          className="fixed z-[9999] bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden flex flex-col"
          style={{
            top: panelPos.top,
            left: panelPos.left,
            width: 360,
            maxHeight: "calc(100vh - 80px)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[#1A2B5E]">
                Notificaciones
              </span>
              {unreadCount > 0 && (
                <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllAsRead()}
                  className="text-[10px] text-[#09268E] hover:text-[#1A2B5E] font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors cursor-pointer"
                >
                  Marcar todas leídas
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex min-h-12 items-center gap-1 px-3 py-2.5 border-b border-slate-100 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {TABS.map((t) => {
              const count = filterNotifications(notifications, t.id).length;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={[
                    "flex-shrink-0 flex h-8 items-center gap-1 px-2.5 rounded-full text-[11px] font-medium leading-none transition-colors cursor-pointer",
                    tab === t.id
                      ? "bg-[#09268E] text-white"
                      : "text-slate-500 hover:bg-slate-100",
                  ].join(" ")}
                >
                  {t.label}
                  {count > 0 && (
                    <span
                      className={[
                        "flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] leading-none",
                        tab === t.id
                          ? "bg-white/20 text-white"
                          : "bg-slate-200 text-slate-500",
                      ].join(" ")}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Notification list */}
          <div className="overflow-y-auto flex-1">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="mb-2 opacity-40"
                >
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <p className="text-xs">Sin notificaciones</p>
              </div>
            ) : (
              filtered.map((n) => (
                <div
                  key={n.id}
                  className="relative flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-slate-50 border-b border-slate-50 bg-blue-50/40"
                  onClick={() => handleItemClick(n)}
                >
                  <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#09268E]" />

                  <NotificationIcon type={n.type} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <p className="text-xs leading-snug truncate font-semibold text-slate-900">
                        {n.title}
                      </p>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap flex-shrink-0 mt-0.5">
                        {formatRelativeTime(n.createdAt)}
                      </span>
                    </div>
                    {n.body && (
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                        {n.body}
                      </p>
                    )}
                    {navigatingId === n.id && (
                      <p className="text-[10px] text-[#09268E] mt-1">
                        Abriendo...
                      </p>
                    )}
                  </div>

                  <button
                    title="Marcar como leída"
                    className="flex-shrink-0 mt-0.5 w-5 h-5 flex items-center justify-center rounded text-slate-300 hover:text-[#09268E] hover:bg-blue-100 transition-colors cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsRead(n.id);
                    }}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
