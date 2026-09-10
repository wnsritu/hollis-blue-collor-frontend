import apiClient from "@/services/axios";
import { http } from "@/lib/api/http";
import { ENDPOINTS } from "@/constants/endpoints";
import type { ApiSuccess } from "@/types/api/common";
import type {
  ChatMessage,
  ChatThread,
  CreateChatPayload,
  SendMessagePayload,
} from "@/types/api/misc";

export const getChatsApi = () => {
  return apiClient.get("/chats");
};

export const getMessagesApi = (booking_id: string | number) => {
  return apiClient.get(`/chats/${booking_id}`);
};

export const sendMessageApi = (
  chatId: string | number,
  data: { message: string },
) => {
  return apiClient.post(`/chats/${chatId}/send`, data);
};

export const uploadImageApi = (chatId: string | number, imageFile: File) => {
  const formData = new FormData();
  formData.append("image", imageFile);

  return apiClient.post(`/chats/${chatId}/image`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const createChatApi = (
  bookingId: number,
  customerId: number,
  providerId: number,
) => {
  return apiClient.post("/chats/create", {
    booking_id: bookingId,
    customer_id: customerId,
    provider_id: providerId,
  });
};

export const getProviderChats = async () => {
  try {
    const response = await getChatsApi();
    return response?.data || response || [];
  } catch (error: any) {
    console.error("Get chats error:", error);
    throw error.response?.data || { message: "Failed to fetch chats" };
  }
};

export const getChatMessages = async (booking_id: string | number) => {
  try {
    const response = await getMessagesApi(booking_id);
    const messages = response?.data?.data || response?.data || [];
    return messages;
  } catch (error: any) {
    console.error("Get messages error:", error);
    throw error.response?.data || { message: "Failed to fetch messages" };
  }
};

export const sendMessage = async (chatId: string | number, message: string) => {
  try {
    const response = await sendMessageApi(chatId, { message });
    return response?.data || response;
  } catch (error: any) {
    console.error("Send message error:", error);
    throw error.response?.data || { message: "Failed to send message" };
  }
};

export const uploadImage = async (chatId: string | number, imageFile: File) => {
  try {
    const response = await uploadImageApi(chatId, imageFile);
    return response?.data || response;
  } catch (error: any) {
    console.error("Upload image error:", error);
    throw error.response?.data || { message: "Failed to upload image" };
  }
};

export const createChat = async (bookingId: number, customerId: number, providerId: number) => {
  try {
    const response = await createChatApi(bookingId, customerId, providerId);
    return response?.data || response;
  } catch (error: any) {
    console.error("Create chat error:", error);
    throw error.response?.data || { message: "Failed to create chat" };
  }
};

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

  report: (chatId: number | string, payload?: { reason?: string; details?: string }) =>
    http.post<ApiSuccess>(ENDPOINTS.chat.report(chatId), payload ?? {}),

  block: (chatId: number | string) =>
    http.post<ApiSuccess>(ENDPOINTS.chat.block(chatId)),
};

export default chatApi;
