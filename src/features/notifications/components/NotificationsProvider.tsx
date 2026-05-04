"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";
import { useAppSelector } from "@/store/hooks";
import { selectCurrentUser } from "@/store/slices/authSlice";
import { createHubConnection } from "@/lib/signalr";
import { CHAT_HUB_URL } from "@/config/api";
import {
  normalizeNotification,
  type RawNotificationPayload,
} from "@/features/notifications/types";
import type { InternalNotification } from "@/features/notifications/types";
import { toast } from "@/lib/toast";
import {
  NotificationsContext,
  type NotificationsContextValue,
} from "@/features/notifications/NotificationsContext";
import {
  fetchUnreadNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/features/notifications/services/notificationService";
import {
  RealtimeContext,
  type RealtimeContextValue,
} from "@/features/realtime/RealtimeContext";
import type { ChatMessage } from "@/features/chat/types";


// Este componente maneja tanto el estado de las notificaciones como la conexión SignalR para eventos en 
// tiempo real relacionados con notificaciones y mensajes de chat. 
// Se asegura de que la conexión se establezca solo cuando hay un usuario autenticado y 
// se limpia adecuadamente al cerrar sesión. 
// demás, proporciona funciones para marcar notificaciones como leídas y para suscribirse a conversaciones 
// específicas de chat.
export function NotificationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = useAppSelector(selectCurrentUser);
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const messageListenersRef = useRef<Set<(msg: ChatMessage) => void>>(new Set());
  const pendingConvRef = useRef<number | null>(null);

  const [notifications, setNotifications] = useState<InternalNotification[]>([]);

  const refresh = useCallback(async () => {
    if (!currentUser?.id) return;
    try {
      const list = await fetchUnreadNotifications();
      setNotifications(list);
    } catch {}
  }, [currentUser?.id]);

  // Carga inicial cuando hay usuario disponible.
  useEffect(() => {
    if (currentUser?.id) refresh();
    else setNotifications([]);
  }, [currentUser?.id, refresh]);

  const markAsRead = useCallback(async (id: number) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch {}
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await markAllNotificationsRead();
      setNotifications([]);
    } catch {}
  }, []);

  const applyPendingSubscription = useCallback(() => {
    const id = pendingConvRef.current;
    const conn = connectionRef.current;
    if (id !== null && conn?.state === signalR.HubConnectionState.Connected) {
      conn.invoke("SuscribirConversacion", id).catch(() => {});
    }
  }, []);


  useEffect(() => {
    if (!currentUser?.id) {
      connectionRef.current?.stop().catch(() => {});
      connectionRef.current = null;
      return;
    }

    const connection = createHubConnection(CHAT_HUB_URL);
    connectionRef.current = connection;

    connection.onreconnected(() => {
      applyPendingSubscription();
    });

    connection.on("NuevaNotificacion", (raw: RawNotificationPayload) => {
      const notification = normalizeNotification(raw);
      setNotifications((prev) => {
        if (prev.some((n) => n.id === notification.id)) return prev;
        return [notification, ...prev];
      });
      if (
        notification.type === "task_assigned" ||
        notification.type === "episode_assigned" ||
        notification.type === "message"
      ) {
        toast.info(notification.title);
      }
    });

    connection.on("NuevoMensaje", (msg: ChatMessage) => {
      messageListenersRef.current.forEach((cb) => cb(msg));
    });

    connection.start()
      .then(() => applyPendingSubscription())
      .catch(() => {});

    return () => {
      connection.off("NuevaNotificacion");
      connection.off("NuevoMensaje");
      connection.stop().catch(() => {});
      connectionRef.current = null;
    };
  }, [currentUser?.id, applyPendingSubscription]);

  const subscribeConversation = useCallback((conversationId: number) => {
    pendingConvRef.current = conversationId;
    const conn = connectionRef.current;
    if (conn?.state === signalR.HubConnectionState.Connected) {
      conn.invoke("SuscribirConversacion", conversationId).catch(() => {});
    }
  }, []);

  const unsubscribeConversation = useCallback((conversationId: number) => {
    if (pendingConvRef.current === conversationId) {
      pendingConvRef.current = null;
    }
    const conn = connectionRef.current;
    if (conn?.state === signalR.HubConnectionState.Connected) {
      conn.invoke("DesuscribirConversacion", conversationId).catch(() => {});
    }
  }, []);

  const addMessageListener = useCallback((cb: (msg: ChatMessage) => void) => {
    messageListenersRef.current.add(cb);
  }, []);

  const removeMessageListener = useCallback((cb: (msg: ChatMessage) => void) => {
    messageListenersRef.current.delete(cb);
  }, []);

  const realtimeValue = useMemo<RealtimeContextValue>(
    () => ({
      subscribeConversation,
      unsubscribeConversation,
      addMessageListener,
      removeMessageListener,
    }),
    [subscribeConversation, unsubscribeConversation, addMessageListener, removeMessageListener],
  );

  const notificationsValue = useMemo<NotificationsContextValue>(
    () => ({
      notifications,
      unreadCount: notifications.length,
      refresh,
      markAsRead,
      markAllAsRead,
    }),
    [notifications, refresh, markAsRead, markAllAsRead],
  );

  return (
    <NotificationsContext.Provider value={notificationsValue}>
      <RealtimeContext.Provider value={realtimeValue}>
        {children}
      </RealtimeContext.Provider>
    </NotificationsContext.Provider>
  );
}
