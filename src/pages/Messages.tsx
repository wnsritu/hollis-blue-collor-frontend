import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { Send, Image, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getProviderChats,
  getChatMessages,
  sendMessage,
  uploadImage,
  createChat,
} from "@/services/chat.service";
import toast from "react-hot-toast";

const Messages = () => {
  const SHOW_FEATURED_UI = true;
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showList, setShowList] = useState(true);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState(null);

  // Read URL params for order-based chat
  const orderIdParam = searchParams.get("order");
  const providerIdParam = searchParams.get("provider");
  const customerIdParam = searchParams.get("customer");

  const loggedInUserId = localStorage.getItem("id");
  const loggedInUserRole =
    localStorage.getItem("role_id") || localStorage.getItem("userRole");

  const BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    fetchChats();
  }, [orderIdParam]);

  useEffect(() => {
    // Reset window scroll to top first to ensure header/navbar is visible
    window.scrollTo(0, 0);
    const timer = setTimeout(() => {
      window.scrollTo(0, 0);
    }, 100);

    // Disable body & html scroll when Messages page is active
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(timer);
      // Restore default overflow on unmount
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchChats = async () => {
    try {
      setLoading(true);
      const response = await getProviderChats();
      const chatsData = response?.data || response || [];
      // debugger
      const chatsWithUnread = chatsData.map((chat) => ({
        ...chat,
        unread:
          chat.last_message_time &&
          String(chat.last_sender_id) !== String(loggedInUserId),
      }));

      setChats(chatsWithUnread);

      // Handle order-based chat from URL params
      if (orderIdParam) {
        // Find existing chat for this booking/order
        let orderChat = chatsWithUnread.find(
          (chat) => String(chat.booking_id) === String(orderIdParam),
        );

        if (orderChat) {
          // Chat exists, select it
          setActiveChat({ ...orderChat, unread: false });
          setShowList(false);
          fetchMessages(orderChat.booking_id);
          // Clear URL params after selecting
          setSearchParams({});
        } else if (providerIdParam && customerIdParam) {
          // No chat exists, create one
          try {
            const newChatResponse = await createChat(
              orderIdParam,
              customerIdParam,
              providerIdParam,
            );
            const newChat = newChatResponse?.data || newChatResponse;

            if (newChat && newChat.id) {
              // 🔥 FIX: Extract names from nested provider and customer objects
              const formattedNewChat = {
                id: newChat.id,
                booking_id: newChat.booking_id || Number(orderIdParam),
                customer_id: newChat.customer_id || Number(customerIdParam),
                provider_id: newChat.provider_id || Number(providerIdParam),
                activeChat: newChat.is_active || true,
                // Extract names from nested objects
                customer_name: newChat.customer
                  ? `${newChat.customer.first_name || ''} ${newChat.customer.last_name || ''}`.trim()
                  : "Customer",
                provider_name: newChat.provider?.business_name || "Provider",
                customer_image: newChat.customer_image || null,
                provider_image: newChat.provider_image || null,
                last_message: null,
                last_message_time: null,
              };

              setChats((prev) => [formattedNewChat, ...prev]);
              setActiveChat(formattedNewChat);
              setShowList(false);

              fetchMessages(formattedNewChat.booking_id);
            }
            // Clear URL params after creating
            setSearchParams({});
          } catch (createError) {
            console.error("Failed to create chat:", createError);
            toast.error("Failed to create chat. Please try again.");
          }
        }
      } else if (chatsWithUnread.length > 0 && !activeChat) {
        // Default behavior: select first chat if no order param
        setActiveChat(chatsWithUnread[0]);
        fetchMessages(chatsWithUnread[0].booking_id);
      }
    } catch (error) {
      console.error("Failed to fetch chats:", error);
      toast.error("Failed to load conversations");
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (chatId) => {
    // debugger
    try {
      const response = await getChatMessages(chatId);
      const messagesData =
        response?.data?.data || response?.data || response || [];
      setMessages(messagesData);
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    }
  };

  const handleChatSelect = (chat) => {
    setChats((prev) =>
      prev.map((c) =>
        c.booking_id === chat.booking_id ? { ...c, unread: false } : c
      ),
    );
    setActiveChat({ ...chat, unread: false });
    setShowList(false);
    fetchMessages(chat.booking_id);
  };

  const handleSend = async () => {
    if (!activeChat || sending) return;
    const text = newMessage.trim();
    if (!text && !selectedImage) return;
    // debugger
    try {
      setSending(true);
      let newMsg;

      if (selectedImage) {
        const response = await uploadImage(activeChat.id, selectedImage);
        newMsg = response?.data || response;
        setSelectedImage(null);
        setSelectedImagePreview(null);
      } else {
        const response = await sendMessage(activeChat.id, text);
        newMsg = response?.data || response;
        setNewMessage("");
      }

      if (newMsg && newMsg.id) {
        setMessages((prev) => [...prev, newMsg]);

        // update chat preview locally
        setChats((prev) =>
          prev.map((chat) =>
            chat.id === activeChat.id
              ? {
                ...chat,
                last_message: selectedImage ? "📷 Image" : newMsg.message,
                last_message_time: newMsg.createdAt || newMsg.created_at,
              }
              : chat
          )
        );
      }
    } catch (error) {
      // console.error("Send failed:", error);
      toast.error(error?.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedImage(file);
    setSelectedImagePreview(URL.createObjectURL(file));
    event.target.value = "";
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const messageDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    );

    if (messageDate.getTime() === today.getTime()) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (messageDate.getTime() === yesterday.getTime()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  const formatBubbleTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getImageUrl = (fileUrl) => {
    if (!fileUrl) return null;
    if (fileUrl.startsWith("http")) return fileUrl;
    if (fileUrl.startsWith("/")) return `${BASE_URL}${fileUrl}`;
    return `${BASE_URL}/${fileUrl}`;
  };

  // Get display name based on logged-in user role
  const getDisplayName = (chat) => {
    // Customer (role 3) sees provider name, Provider (role 4) sees customer name
    const isCustomer = String(loggedInUserRole) === "3";
    if (isCustomer) {
      return `${chat?.provider_name} #${chat?.booking_id}` || "Provider";
    }
    return `${chat?.customer_name} #${chat?.booking_id}` || "Customer";
  };

  // Get profile image based on logged-in user role
  const getProfileImage = (chat) => {
    const isCustomer = String(loggedInUserRole) === "3";
    if (isCustomer) {
      return chat.provider_image;
    }
    return chat.customer_image;
  };

  const isMyMessage = (msg) => {
    const isCustomer = String(loggedInUserRole) === "3";

    return isCustomer
      ? msg.sender_role === "customer"
      : msg.sender_role === "provider";
  };

  if (loading) {
    return (
      <div className="container-grid py-8">
        <div className="flex h-[calc(100vh-14rem)] items-center justify-center">
          <p className="text-muted-foreground">Loading conversations...</p>
        </div>
      </div>
    );
  }

  if (!SHOW_FEATURED_UI) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] px-4">
        <div className="text-center space-y-5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent text-primary">
            <Send size={24} />
          </div>

          <h2 className="text-lg font-semibold text-foreground">
            Messaging Feature Coming Soon
          </h2>

          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Chat with customers and providers in real-time. We're building a
            seamless messaging experience for you.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-grid py-8">
      <style dangerouslySetInnerHTML={{__html: `
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
      <h1 className="font-heading text-2xl font-bold text-foreground mb-3">
        {t("messages")}
      </h1>
      {chats?.length === 0 ? (
        <div className="flex flex-1 items-center justify-center min-h-[60vh] px-6">
          <div className="text-center space-y-4">
            <div className="text-2xl font-semibold text-foreground">
              Welcome to Your Messages
            </div>
            <p className="text-base text-muted-foreground max-w-md mx-auto">
              Once you book a service, your chats will appear here. You can view and
              respond to messages from customers and providers in real-time. All your
              conversations will be neatly organized and accessible from this
              dashboard.
            </p>
          </div>
        </div>
      ) : (
        // Main Container - Fixed Height
        <div 
          style={{ height: "calc(100vh - 13.5rem)", minHeight: "450px" }}
          className="mt-6 overflow-hidden rounded-xl border border-border bg-card"
        >
          {/* <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card"> */}
          <div className="flex h-full overflow-hidden">

            {/* LEFT SIDEBAR - Conversations */}
            <div
              className={`w-full shrink-0 border-r border-border sm:w-80 ${!showList ? "hidden sm:block" : ""
                } flex flex-col h-full`}
            >
              {/* Sticky Header for Conversations */}
              <div className="sticky top-0 z-10 border-b border-border bg-card p-4">
                <h2 className="font-heading text-sm font-semibold text-foreground">
                  {t("conversations")}
                </h2>
              </div>

              {/* Scrollable Chat List */}
              <div 
                style={{ height: "calc(100% - 60px)" }}
                className="pt-3 overflow-y-scroll no-scrollbar"
              >
                {chats?.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    No conversations yet
                  </div>
                ) : (
                  chats.map((chat) => (
                    <button
                      key={chat.id}
                      onClick={() => handleChatSelect(chat)}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent ${activeChat?.id === chat.id ? "bg-accent" : ""
                        }`}
                    >
                      <div className="relative flex-shrink-0">
                        {getProfileImage(chat) ? (
                          <img
                            src={`${BASE_URL}${getProfileImage(chat)}`}
                            alt={getDisplayName(chat)}
                            className="h-10 w-10 rounded-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                            {getDisplayName(chat).charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-foreground truncate">
                            {getDisplayName(chat)}
                          </span>
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            {formatTime(chat.last_message_time)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {chat.last_message === "📷 Image"
                            ? "📷 Image"
                            : chat.last_message || "No messages yet"}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* RIGHT SIDEBAR - Chat Area */}
            <div
              className={`flex flex-1 flex-col h-full ${showList ? "hidden sm:flex" : "flex"
                }`}
            >
              {/* Sticky Chat Header */}
              <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-card px-4 py-3">
                <button
                  className="text-muted-foreground sm:hidden"
                  onClick={() => setShowList(true)}
                >
                  <ArrowLeft size={18} />
                </button>
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium overflow-hidden flex-shrink-0">
                  {activeChat && getProfileImage(activeChat) ? (
                    <img
                      src={`${BASE_URL}${getProfileImage(activeChat)}`}
                      alt={getDisplayName(activeChat)}
                      className="h-full w-full object-cover"
                    />
                  ) : activeChat ? (
                    getDisplayName(activeChat).charAt(0).toUpperCase()
                  ) : (
                    "?"
                  )}
                </div>
                <span className="text-sm font-semibold text-foreground truncate">
                  {activeChat ? getDisplayName(activeChat) : "Select a chat"}
                </span>
              </div>

              {/* Scrollable Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                {messages.length === 0 ? (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground">No messages yet</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMyMsg = isMyMessage(msg);
                    const isImage = msg.type === "image";
                    const imageUrl = isImage ? getImageUrl(msg.file_url) : null;

                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isMyMsg ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-xl px-4 py-2.5 text-sm ${isMyMsg
                            ? "bg-primary text-primary-foreground"
                            : "bg-accent text-foreground"
                            }`}
                        >
                          {isImage && imageUrl ? (
                            <img
                              src={imageUrl}
                              alt="Shared"
                              className="max-w-[200px] max-h-[200px] rounded-lg cursor-pointer object-cover"
                              onClick={() => window.open(imageUrl, "_blank")}
                            />
                          ) : (
                            <p className="break-words">{msg.message}</p>
                          )}
                          <p
                            className={`mt-1 text-xs ${isMyMsg ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                          >
                            {formatBubbleTime(msg.createdAt || msg.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Sticky Input Area (at bottom) */}
              <div className="sticky bottom-0 border-t border-border bg-card p-3">
                {selectedImagePreview && (
                  <div className="mb-2 px-2 relative inline-block">
                    <img
                      src={selectedImagePreview}
                      alt="Preview"
                      className="h-16 w-16 rounded-lg object-cover border border-border"
                    />
                    <button
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                      onClick={() => {
                        setSelectedImage(null);
                        setSelectedImagePreview(null);
                      }}
                    >
                      ×
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <button
                    className="p-2 text-muted-foreground hover:text-foreground disabled:opacity-50 flex-shrink-0"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!activeChat || sending}
                  >
                    <Image size={18} />
                  </button>
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={t("typeMessage")}
                    className="flex-1"
                    disabled={!activeChat || sending}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  />
                  <Button
                    size="sm"
                    onClick={handleSend}
                    disabled={
                      (!newMessage.trim() && !selectedImage) ||
                      !activeChat ||
                      sending
                    }
                    className="gap-1.5 flex-shrink-0"
                  >
                    <Send size={14} /> {t("send")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;
