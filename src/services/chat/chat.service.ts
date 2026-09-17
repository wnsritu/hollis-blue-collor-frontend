import { http } from "@/lib/api/http";
import { ENDPOINTS } from "@/constants/endpoints";
import type { ApiSuccess } from "@/types/api/common";
import type {
  ChatMessage,
  ChatThread,
  CreateChatPayload,
  SendMessagePayload,
} from "@/types/api/misc";

const FALLBACK_CHAT_THREADS: ChatThread[] = [
  {
    id: 1,
    chat_id: 1,
    customer_id: 101,
    provider_id: 201,
    provider_name: "Apex Electrical Solutions",
    provider: {
      id: 201,
      name: "Apex Electrical Solutions",
      business_name: "Apex Electrical Solutions",
      user: { full_name: "Apex Electrical Solutions" },
    },
    customer_name: "Sarah Whitfield",
    customer: { id: 101, full_name: "Sarah Whitfield" },
    booking_id: 1001,
    booking_number: "BK-2026-8801",
    last_message: "I will arrive tomorrow at 10:00 AM with the circuit breaker replacement.",
    updated_at: "2026-09-17T10:30:00Z",
    unread_count: 0,
  },
  {
    id: 2,
    chat_id: 2,
    customer_id: 101,
    provider_id: 202,
    provider_name: "Premier Plumbing & Drainage",
    provider: {
      id: 202,
      name: "Premier Plumbing & Drainage",
      business_name: "Premier Plumbing & Drainage",
      user: { full_name: "Premier Plumbing & Drainage" },
    },
    customer_name: "Sarah Whitfield",
    customer: { id: 101, full_name: "Sarah Whitfield" },
    booking_id: 1002,
    booking_number: "BK-2026-8802",
    last_message: "Please make sure the main water valve is accessible before arrival.",
    updated_at: "2026-09-16T15:45:00Z",
    unread_count: 0,
  },
  {
    id: 3,
    chat_id: 3,
    customer_id: 101,
    provider_id: 203,
    provider_name: "BrightHome Cleaning Co.",
    provider: {
      id: 203,
      name: "BrightHome Cleaning Co.",
      business_name: "BrightHome Cleaning Co.",
      user: { full_name: "BrightHome Cleaning Co." },
    },
    customer_name: "Sarah Whitfield",
    customer: { id: 101, full_name: "Sarah Whitfield" },
    booking_id: 1003,
    booking_number: "BK-2026-8803",
    last_message: "Thank you for booking! We have assigned 2 specialists for your deep cleaning.",
    updated_at: "2026-09-15T11:20:00Z",
    unread_count: 0,
  },
];

const FALLBACK_CHAT_MESSAGES: Record<number, ChatMessage[]> = {
  1: [
    {
      id: 101,
      chat_id: 1,
      sender_id: 101,
      sender_role: "customer",
      message: "Hello! Is it possible to inspect the main panel before starting the rewiring work?",
      createdAt: "2026-09-17T09:15:00Z",
      created_at: "2026-09-17T09:15:00Z",
      sender: { id: 101, full_name: "Sarah Whitfield" },
    },
    {
      id: 102,
      chat_id: 1,
      sender_id: 201,
      sender_role: "provider",
      message: "Hello Sarah, yes absolutely. I will do a comprehensive panel inspection upon arrival.",
      createdAt: "2026-09-17T09:40:00Z",
      created_at: "2026-09-17T09:40:00Z",
      sender: { id: 201, full_name: "Apex Electrical Solutions" },
    },
    {
      id: 103,
      chat_id: 1,
      sender_id: 201,
      sender_role: "provider",
      message: "I will arrive tomorrow at 10:00 AM with the circuit breaker replacement.",
      createdAt: "2026-09-17T10:30:00Z",
      created_at: "2026-09-17T10:30:00Z",
      sender: { id: 201, full_name: "Apex Electrical Solutions" },
    },
  ],
  2: [
    {
      id: 201,
      chat_id: 2,
      sender_id: 101,
      sender_role: "customer",
      message: "Hi, there is a minor leak under the kitchen sink.",
      createdAt: "2026-09-16T14:10:00Z",
      created_at: "2026-09-16T14:10:00Z",
      sender: { id: 101, full_name: "Sarah Whitfield" },
    },
    {
      id: 202,
      chat_id: 2,
      sender_id: 202,
      sender_role: "provider",
      message: "Please make sure the main water valve is accessible before arrival.",
      createdAt: "2026-09-16T15:45:00Z",
      created_at: "2026-09-16T15:45:00Z",
      sender: { id: 202, full_name: "Premier Plumbing & Drainage" },
    },
  ],
  3: [
    {
      id: 301,
      chat_id: 3,
      sender_id: 203,
      sender_role: "provider",
      message: "Thank you for booking! We have assigned 2 specialists for your deep cleaning.",
      createdAt: "2026-09-15T11:20:00Z",
      created_at: "2026-09-15T11:20:00Z",
      sender: { id: 203, full_name: "BrightHome Cleaning Co." },
    },
  ],
};

export const getChatsApi = () => {
  return Promise.resolve({ data: { data: FALLBACK_CHAT_THREADS } });
};

export const getUserChatsApi = () => {
  return Promise.resolve({ data: { data: FALLBACK_CHAT_THREADS } });
};

export const getMessagesApi = (chatId: string | number) => {
  const cid = Number(chatId) || 1;
  const msgs = FALLBACK_CHAT_MESSAGES[cid] || FALLBACK_CHAT_MESSAGES[1];
  return Promise.resolve({ data: { data: msgs } });
};

export const sendMessageApi = (
  chatId: string | number,
  data: { message: string },
) => {
  const newMsg: ChatMessage = {
    id: Date.now(),
    chat_id: chatId,
    message: data.message,
    createdAt: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };
  return Promise.resolve({ data: { data: newMsg } });
};

export const uploadImageApi = (chatId: string | number, _imageFile: File) => {
  const newMsg: ChatMessage = {
    id: Date.now(),
    chat_id: chatId,
    type: "image",
    file_url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=60",
    message: "Shared Image",
    createdAt: new Date().toISOString(),
  };
  return Promise.resolve({ data: { data: newMsg } });
};

export const createChatApi = (
  bookingId: number,
  customerId: number,
  providerId: number,
) => {
  const newChat: ChatThread = {
    id: Date.now(),
    customer_id: customerId,
    provider_id: providerId,
    booking_id: bookingId,
  };
  return Promise.resolve({ data: { data: newChat } });
};

export const getUserChats = async () => {
  return FALLBACK_CHAT_THREADS;
};

export const getProviderChats = async () => {
  return FALLBACK_CHAT_THREADS;
};

export const getChatMessages = async (chatId: string | number) => {
  const cid = Number(chatId) || 1;
  return FALLBACK_CHAT_MESSAGES[cid] || FALLBACK_CHAT_MESSAGES[1];
};

export const sendMessage = async (chatId: string | number, message: string) => {
  return {
    id: Date.now(),
    chat_id: chatId,
    message,
    createdAt: new Date().toISOString(),
  };
};

export const uploadImage = async (chatId: string | number, _imageFile: File) => {
  return {
    id: Date.now(),
    chat_id: chatId,
    type: "image",
    file_url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=60",
    createdAt: new Date().toISOString(),
  };
};

export const createChat = async (bookingId: number, customerId: number, providerId: number) => {
  return {
    id: Date.now(),
    booking_id: bookingId,
    customer_id: customerId,
    provider_id: providerId,
  };
};

export const chatApi = {
  listUserChats: () =>
    Promise.resolve({
      status: "success",
      data: FALLBACK_CHAT_THREADS,
    } as ApiSuccess<ChatThread[]>),

  getMessages: (chatId: number | string) => {
    const cid = Number(chatId) || 1;
    const msgs = FALLBACK_CHAT_MESSAGES[cid] || FALLBACK_CHAT_MESSAGES[1];
    return Promise.resolve({
      status: "success",
      data: msgs,
    } as ApiSuccess<ChatMessage[]>);
  },

  sendMessage: (payload: SendMessagePayload | FormData) => {
    let msgText = "Message sent.";
    if (payload && !(payload instanceof FormData)) {
      msgText = (payload as SendMessagePayload).message || msgText;
    }
    const newMsg: ChatMessage = {
      id: Date.now(),
      message: msgText,
      createdAt: new Date().toISOString(),
    };
    return Promise.resolve({
      status: "success",
      data: newMsg,
    } as ApiSuccess<ChatMessage>);
  },

  createChat: (_payload: CreateChatPayload) =>
    Promise.resolve({
      status: "success",
      data: FALLBACK_CHAT_THREADS[0],
    } as ApiSuccess<ChatThread>),

  markAsRead: (_payload: { chat_id: number | string }) =>
    Promise.resolve({ status: "success", data: null } as ApiSuccess),

  report: (_chatId: number | string, _payload?: { reason?: string; details?: string }) =>
    Promise.resolve({ status: "success", data: null } as ApiSuccess),

  block: (_chatId: number | string) =>
    Promise.resolve({ status: "success", data: null } as ApiSuccess),
};

export default chatApi;

