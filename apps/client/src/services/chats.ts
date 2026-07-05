import type { ChatListItem, ChatMessage, ConversationMessages } from "@heart-message/shared";
import { apiRequest } from "./api";

export function fetchChats() {
  return apiRequest<ChatListItem[]>("/v1/chats");
}

export function fetchChatMessages(id: string) {
  return apiRequest<ConversationMessages>(`/v1/chats/${id}/messages`);
}

export function sendChatMessage(id: string, content: string) {
  return apiRequest<ChatMessage>(`/v1/chats/${id}/messages`, {
    method: "POST",
    data: { content }
  });
}

export function deleteChat(id: string) {
  return apiRequest<{ conversationId: string; deleted: boolean }>(`/v1/chats/${id}`, {
    method: "DELETE"
  });
}
