import { createContext, useContext } from "react";
import type { InternalNotification } from "@/features/notifications/types";

export interface NotificationsContextValue {
  notifications: InternalNotification[];
  unreadCount: number;
  refresh: () => void;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export const NotificationsContext = createContext<NotificationsContextValue>({
  notifications: [],
  unreadCount: 0,
  refresh: () => {},
  markAsRead: async () => {},
  markAllAsRead: async () => {},
});

export function useNotifications(): NotificationsContextValue {
  return useContext(NotificationsContext);
}
