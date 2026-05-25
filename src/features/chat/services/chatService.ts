import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import type { ConversationSummary, ChatMessage } from "@/features/chat/types";

// Obtiene la lista de conversaciones del usuario actual
export async function getConversations(): Promise<ConversationSummary[]> {
  const res = await axiosInstance.get<ConversationSummary[]>(
    API_ENDPOINTS.chat.conversations,
  );
  return res.data;
}

// Crea una nueva conversación directa con otro usuario
export async function createDirectConversation(
  userId: number,
): Promise<ConversationSummary> {
  const res = await axiosInstance.post<ConversationSummary>(
    API_ENDPOINTS.chat.directConversation,
    { userId },
  );
  return res.data;
}

// Crea una nueva conversación grupal con un nombre y una lista de miembros
export async function createGroupConversation(
  name: string,
  memberIds: number[],
): Promise<ConversationSummary> {
  const res = await axiosInstance.post<ConversationSummary>(
    API_ENDPOINTS.chat.groupConversation,
    { name, memberIds },
  );
  return res.data;
}

// Obtiene los mensajes de una conversación específica
export async function getConversationMessages(
  conversationId: number,
): Promise<ChatMessage[]> {
  const res = await axiosInstance.get<ChatMessage[]>(
    API_ENDPOINTS.chat.messages(conversationId),
  );
  return res.data;
}

// Envía un nuevo mensaje a una conversación específica
export async function sendMessage(
  conversationId: number,
  content: string,
): Promise<ChatMessage> {
  const res = await axiosInstance.post<ChatMessage>(
    API_ENDPOINTS.chat.messages(conversationId),
    { content },
  );
  return res.data;
}
