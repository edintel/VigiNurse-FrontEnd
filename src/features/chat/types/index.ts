export interface ConversationMember {
  id: number;
  name: string;
  email?: string | null;
}

export interface ChatMessage {
  id: number;
  conversation_id: number;
  sender_id: number;
  sender_name?: string | null;
  content: string;
  created_at: string;
}

export interface ConversationSummary {
  id: number;
  type: "direct" | "group";
  name: string | null;
  display_name: string;
  members: ConversationMember[];
  last_message: ChatMessage | null;
  created_at: string;
}
