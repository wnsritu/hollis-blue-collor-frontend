import { http } from "@/lib/api/http";
import { ENDPOINTS } from "@/constants/endpoints";
import type { ApiSuccess } from "@/types/api/common";
import type {
  ChatMessage,
  ChatThread,
  CreateChatPayload,
  SendMessagePayload,
} from "@/types/api/misc";

export const chatApi = {
  listUserChats: () =>
    http.get<ApiSuccess<ChatThread[]>>(ENDPOINTS.chat.userChats),

  getMessages: (chatId: number | string) =>
    http.get<ApiSuccess<ChatMessage[]>>(ENDPOINTS.chat.messages(chatId)),

  sendMessage: (payload: SendMessagePayload | FormData) =>
    http.post<ApiSuccess<ChatMessage>>(ENDPOINTS.chat.sendMessage, payload),

  createChat: (payload: CreateChatPayload) =>
    http.post<ApiSuccess<ChatThread>>(ENDPOINTS.chat.createChat, payload),

  markAsRead: (payload: { chat_id: number | string }) =>
    http.post<ApiSuccess>(ENDPOINTS.chat.markAsRead, payload),
};

export default chatApi;
