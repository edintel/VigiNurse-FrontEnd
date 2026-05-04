export type NotificationType =
  | "message"
  | "task_assigned"
  | "episode_assigned"
  | "unknown";

export interface InternalNotification {
  id: number;
  userId: number;
  type: NotificationType;
  conversationId: number | null;
  messageId: number | null;
  taskId: number | null;
  episodeId: number | null;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

// Raw payload from SignalR — backend may send snake_case or camelCase
export interface RawNotificationPayload {
  id?: number;
  user_id?: number;
  userId?: number;
  type?: string;
  conversation_id?: number | null;
  conversationId?: number | null;
  message_id?: number | null;
  messageId?: number | null;
  task_id?: number | null;
  taskId?: number | null;
  episode_id?: number | null;
  episodeId?: number | null;
  title?: string;
  body?: string;
  is_read?: boolean;
  isRead?: boolean;
  created_at?: string;
  createdAt?: string;
}

const VALID_TYPES: NotificationType[] = [
  "message",
  "task_assigned",
  "episode_assigned",
  "unknown",
];

export function normalizeNotification(
  raw: RawNotificationPayload,
): InternalNotification {
  const rawType = raw.type ?? "unknown";
  const type: NotificationType = VALID_TYPES.includes(
    rawType as NotificationType,
  )
    ? (rawType as NotificationType)
    : "unknown";

  return {
    id: raw.id ?? 0,
    userId: raw.user_id ?? raw.userId ?? 0,
    type,
    conversationId: raw.conversation_id ?? raw.conversationId ?? null,
    messageId: raw.message_id ?? raw.messageId ?? null,
    taskId: raw.task_id ?? raw.taskId ?? null,
    episodeId: raw.episode_id ?? raw.episodeId ?? null,
    title: raw.title ?? "",
    body: raw.body ?? "",
    isRead: raw.is_read ?? raw.isRead ?? false,
    createdAt: raw.created_at ?? raw.createdAt ?? new Date().toISOString(),
  };
}
