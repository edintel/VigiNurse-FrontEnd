import { createContext, useContext } from "react";
import type { ChatMessage } from "@/features/chat/types";

// Contexto para manejar la suscripción a conversaciones y la escucha de mensajes en tiempo real
export interface RealtimeContextValue {
  subscribeConversation: (conversationId: number) => void;
  unsubscribeConversation: (conversationId: number) => void;
  addMessageListener: (cb: (msg: ChatMessage) => void) => void;
  removeMessageListener: (cb: (msg: ChatMessage) => void) => void;
}

// Valor por defecto del contexto, con funciones vacías para evitar errores al usar el contexto sin un proveedor
export const RealtimeContext = createContext<RealtimeContextValue>({
  subscribeConversation: () => {},
  unsubscribeConversation: () => {},
  addMessageListener: () => {},
  removeMessageListener: () => {},
});

// Hook personalizado para acceder al contexto de tiempo real
export function useRealtime(): RealtimeContextValue {
  return useContext(RealtimeContext);
}
