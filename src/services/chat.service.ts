import {
 getChatsApi,
 getMessagesApi,
 sendMessageApi,
 uploadImageApi,
 createChatApi,
} from "@/api/chat.api";


// Get all chats for provider
export const getProviderChats = async () => {
 try {
   const response = await getChatsApi();
   // ✅ Fix: Extract data array properly
   return response?.data || response || [];
 } catch (error) {
   console.error("Get chats error:", error);
   throw error.response?.data || { message: "Failed to fetch chats" };
 }
};


// Get messages for a specific chat
export const getChatMessages = async (booking_id) => {
 try {
   const response = await getMessagesApi(booking_id);
   const messages = response?.data?.data || response?.data || [];
   return messages;
 } catch (error) {
   console.error("Get messages error:", error);
   throw error.response?.data || { message: "Failed to fetch messages" };
 }
};


// Send a text message
export const sendMessage = async (chatId, message) => {
 try {
   const response = await sendMessageApi(chatId, { message });
   // ✅ FIX: Return the actual message data
   return response?.data || response;
 } catch (error) {
   console.error("Send message error:", error);
   throw error.response?.data || { message: "Failed to send message" };
 }
};


// Upload an image
export const uploadImage = async (chatId, imageFile) => {
 try {
   const response = await uploadImageApi(chatId, imageFile);
   // ✅ FIX: Return the actual message data
   return response?.data || response;
 } catch (error) {
   console.error("Upload image error:", error);
   throw error.response?.data || { message: "Failed to upload image" };
 }
};


// Create a new chat
export const createChat = async (bookingId, customerId, providerId) => {
 try {
   const response = await createChatApi(bookingId, customerId, providerId);
   return response?.data || response;
 } catch (error) {
   console.error("Create chat error:", error);
   throw error.response?.data || { message: "Failed to create chat" };
 }
};
