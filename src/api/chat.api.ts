import api from "./axios";

// Get all chats for logged-in provider
export const getChatsApi = () => {
  return api.get("/chats");
};

// Get messages for a specific chat
export const getMessagesApi = (booking_id: string | number) => {
  return api.get(`/chats/${booking_id}`);
};

// Send a text message
export const sendMessageApi = (
  chatId: string | number,
  data: { message: string },
) => {
  return api.post(`/chats/${chatId}/send`, data);
};

// Upload image message
export const uploadImageApi = (chatId: string | number, imageFile: File) => {
  const formData = new FormData();
  formData.append("image", imageFile);

  return api.post(`/chats/${chatId}/image`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

// Create a new chat
export const createChatApi = (
  bookingId: number,
  customerId: number,
  providerId: number,
) => {
  return api.post("/chats/create", {
    booking_id: bookingId,
    customer_id: customerId,
    provider_id: providerId,
  });
};
