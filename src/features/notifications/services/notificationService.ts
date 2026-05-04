import axiosInstance from "@/lib/axios";
import type { InternalNotification, RawNotificationPayload } from "@/features/notifications/types";
import { normalizeNotification } from "@/features/notifications/types";

interface PaginadoResult<T> {
  datos?: T[];
  Datos?: T[];
}

// Obtiene las notificaciones no leídas del usuario actual
export async function fetchUnreadNotifications(): Promise<InternalNotification[]> {
  const res = await axiosInstance.get<PaginadoResult<RawNotificationPayload>>("/notificaciones", {
    params: { soloNoLeidas: true, tamanio: 100 },
  });
  return (res.data.datos ?? res.data.Datos ?? []).map(normalizeNotification);
}

// Marcar una notificación como leída
export async function markNotificationRead(id: number): Promise<void> {
  await axiosInstance.patch(`/notificaciones/${id}/leer`);
}

// Marcar todas las notificaciones como leídas
export async function markAllNotificationsRead(): Promise<void> {
  await axiosInstance.patch("/notificaciones/leer-todas");
}
