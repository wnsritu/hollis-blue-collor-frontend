import React, { useEffect, useState } from "react";
import { MessageSquare, ImageIcon, Check, X, Search } from "lucide-react";

import toast from "react-hot-toast";

import { getChatMessages, getProviderChats } from "@/services/chat.service";
import { getDisputeData } from "@/api/dispute.api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const SupportChats = () => {
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [chats, setChats] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const [evidencePics, setEvidencePics] = useState([]);
  const [customerPics, setCustomerPics] = useState([]);
  const [providerPics, setProviderPics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState(null);


  // ✅ CHAT MODAL
  const [openChatModal, setOpenChatModal] = useState(false);

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      setLoading(true);

      const res = await getProviderChats();

      const providersData = res?.data || [];

      setChats(providersData);
// debugger;
      if (providersData.length > 0) {
        setSelectedChat(providersData[0]);
      }
    } catch (err) {
      console.log("ERROR:", err);
      toast.error("Failed to load chats.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ FETCH MESSAGES
  const fetchMessages = async (booking_id: any) => {
    try {
      const response: any = await getChatMessages(booking_id);
      // debugger;
      const messagesData =
        response?.data?.data || response?.data || response || [];

      setMessages(messagesData);

      setOpenChatModal(true);
    } catch (error) {
      console.error("Failed to fetch messages:", error);
      toast.error("Failed to load messages");
    }
  };

  const parseDisputeImages = (dispute: any) => {
    const safeParse = (str: string | null) => {
      if (!str) return [];
      try {
        // Remove outer quotes
        let cleaned = str.trim();
        if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
          cleaned = cleaned.slice(1, -1);
        }

        // Replace escaped quotes properly
        cleaned = cleaned.replace(/\\"/g, '"');

        // Now parse JSON
        const parsed = JSON.parse(cleaned);

        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.error("Failed to parse images:", str, e);
        return [];
      }
    };

    const customerImgs = [
      ...safeParse(dispute.customer_request_img),
      // ...safeParse(dispute.customer_completion_img),
    ];

    const providerImgs = [
      // ...safeParse(dispute.provider_acceptance_img),
      ...safeParse(dispute.provider_delivery_img),
    ];

    const formatImgs = (arr: string[]) =>
      arr.map((img) => (img.startsWith("http") ? img : `${BASE_URL}${img}`));

    return {
      customerImgs: formatImgs(customerImgs),
      providerImgs: formatImgs(providerImgs),
    };
  };

  const parseEvidenceImages = (evidences: any[]) => {
    return evidences
      .map((ev) => ev.image_url.replace(/\"/g, ""))
      .map((img) => (img.startsWith("http") ? img : `${BASE_URL}${img}`));
  };

  // Fetch dispute by ID
  const fetchBookingPhotos = async (id: any) => {
    setLoading(true);
    try {
      const res: any = await getDisputeData({ booking_id: id });
      if (res?.data?.success) {
        const dispute = res?.data?.data?.dispute;
        const evidences = res?.data?.data?.evidences || [];

        const { customerImgs, providerImgs } = parseDisputeImages(dispute);
        const evidenceImgs = parseEvidenceImages(evidences);

        setCustomerPics(customerImgs);
        setProviderPics(providerImgs);
        setEvidencePics(evidenceImgs);
        toast.success(res?.data?.message || "Dispute data loaded successfully");
      } else {
        toast.error(res?.data?.message || "Failed to load dispute");
      }
    } catch (err) {
      // console.log(err);
      toast.error("Dispute not found for this booking");
      setCustomerPics([]);
      setProviderPics([]);
      setEvidencePics([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedChat) {
      fetchBookingPhotos(selectedChat.booking_id);
    }
  }, [selectedChat]);

  const filteredChats = chats.filter((chat: any) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const customerName = (chat.customer_name || "").toLowerCase();
    const providerName = (chat.provider_name || "").toLowerCase();
    const orderId = `ord-${chat.booking_id || ""}`.toLowerCase();
    const bookingId = String(chat.booking_id || "").toLowerCase();
    return (
      customerName.includes(q) ||
      providerName.includes(q) ||
      orderId.includes(q) ||
      bookingId.includes(q)
    );
  });

  return (
    <div className="p-1 bg-[#f8fafc] min-h-screen">
      {/* TITLE */}
      <h1 className="text-3xl font-bold text-slate-800 mb-6">
        Messages & Photos
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT SIDE */}
        <div>
          <h2 className="text-lg font-semibold text-slate-700 mb-3">
            Order Conversations
          </h2>

          <div className="mb-4 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <Input
              placeholder="Search by customer, provider, or order ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 rounded-xl bg-white border-slate-200 text-sm shadow-sm"
            />
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
            {filteredChats.length === 0 ? (
              <div className="text-center py-12 bg-white border border-slate-200 rounded-2xl p-6 text-slate-500">
                <p className="text-sm font-medium text-slate-700">No conversations found</p>
                {searchQuery && (
                  <>
                    <p className="text-xs text-slate-400 mt-1">No orders match "{searchQuery}"</p>
                    <button
                      onClick={() => setSearchQuery("")}
                      className="mt-3 text-xs text-blue-600 font-medium hover:underline"
                    >
                      Clear search
                    </button>
                  </>
                )}
              </div>
            ) : (
              filteredChats.map((chat: any) => {
                const isActive = selectedChat?.id === chat.id;

                return (
                  <div
                    key={chat.id}
                    onClick={() => setSelectedChat(chat)}
                    className={`relative bg-white border rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:shadow-md ${
                      isActive ? "border-blue-500 shadow-sm" : "border-slate-200"
                    }`}
                  >
                    {/* ACTIVE ICON */}
                    {isActive && (
                      <div className="absolute bottom-4 right-4">
                        <Check className="text-blue-500" size={18} />
                      </div>
                    )}

                    {/* TOP */}
                    <div className="flex items-start justify-between">
                      <div className="flex gap-3">
                        <img
                          src={
                            chat.customer_image
                              ? `${BASE_URL}${chat.customer_image}`
                              : "https://ui-avatars.com/api/?name=Customer"
                          }
                          alt={chat.customer_name}
                          className="w-12 h-12 rounded-full object-cover"
                        />

                        <div>
                          <h3 className="font-semibold text-slate-800">
                            {chat.customer_name}
                            <span className="mx-2">↔</span>
                            {chat.provider_name}
                          </h3>

                          <p className="text-sm text-slate-500 mt-1">
                            ORD-{chat.booking_id} · {chat.last_message}
                          </p>
                        </div>
                      </div>

                      <MessageSquare size={18} className="text-slate-400" />
                    </div>

                    {/* BUTTONS */}
                    <div className="flex gap-3 mt-5">
                      {/* ✅ VIEW CHAT */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          fetchMessages(chat?.booking_id);
                        }}
                        className="px-4 py-2 border rounded-lg text-sm bg-white hover:bg-slate-100 transition"
                      >
                        View Chat
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          fetchBookingPhotos(chat?.booking_id);
                        }}
                        className="px-4 py-2 border rounded-lg text-sm bg-white hover:bg-slate-100 transition flex items-center gap-2"
                      >
                        <ImageIcon size={16} />
                        View Photos
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div>
          <h2 className="text-lg font-semibold text-slate-700 mb-4">
            Photo Evidence Gallery
          </h2>

          {/* Customer Evidence */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {customerPics?.length === 0 ? (
              <p className="text-slate-500 text-sm col-span-2 text-center">
                No pre-booking images
              </p>
            ) : (
              customerPics.map((img, i) => (
                <div
                  key={i}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm"
                >
                  <img
                    src={img}
                    alt={`Customer Evidence ${i + 1}`}
                    className="h-40 w-full object-cover"
                  />
                  <div className="p-3">
                    <p className="font-medium text-slate-700 text-sm">
                      {/* Pre-booking Evidence {i + 1} */}
                      Before pickup {i + 1}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Provider Evidence */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {providerPics?.length === 0 ? (
              <p className="text-slate-500 text-sm col-span-2 text-center">
                No booking complete images
              </p>
            ) : (
              providerPics.map((img, i) => (
                <div
                  key={i}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm"
                >
                  <img
                    src={img}
                    alt={`Provider Evidence ${i + 1}`}
                    className="h-40 w-full object-cover"
                  />
                  <div className="p-3">
                    <p className="font-medium text-slate-700 text-sm">
                      {/* Provider Evidence {i + 1} */}
                      After Delivery {i + 1}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Evidence after booking */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {evidencePics.length === 0 ? (
              <p className="text-slate-500 text-sm col-span-3 text-center">
                No post-booking evidence
              </p>
            ) : (
              evidencePics.map((img, i) => (
                <div
                  key={i}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm"
                >
                  <img
                    src={img}
                    alt={`Evidence ${i + 1}`}
                    className="h-40 w-full object-cover"
                  />
                  <div className="p-3">
                    <p className="font-medium text-slate-700 text-sm">
                      Evidence {i + 1}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ✅ CHAT MODAL */}
      {openChatModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden">
            {/* HEADER */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div>
                <h2 className="text-xl font-semibold">Chat Messages</h2>

                <p className="text-sm text-slate-500 mt-1">
                  {selectedChat?.customer_name} ↔ {selectedChat?.provider_name}
                </p>
              </div>

              <button
                onClick={() => setOpenChatModal(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* MESSAGES */}
            <div className="h-[400px] overflow-y-auto p-5 bg-slate-50 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-slate-500">
                  No messages found
                </div>
              ) : (
                messages.map((msg) => {
                  const isProvider = msg.sender_role === "provider";

                  return (
                    <div
                      key={msg.id}
                      className={`flex ${
                        isProvider ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[75%] px-4 py-3 rounded-2xl shadow-sm ${
                          isProvider
                            ? "bg-blue-600 text-white rounded-br-sm"
                            : "bg-white text-slate-800 border rounded-bl-sm"
                        }`}
                      >
                        <p className="text-sm">{msg.message}</p>

                        <p
                          className={`text-[11px] mt-1 ${
                            isProvider ? "text-blue-100" : "text-slate-400"
                          }`}
                        >
                          {new Date(msg.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

       {/* Image Preview */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Evidence Preview</DialogTitle>
          </DialogHeader>
          {previewImage && (
            <img
              src={`${BASE_URL}${previewImage.replace(/"/g, "")}`}
              alt="Evidence"
              className="w-full rounded-lg object-contain max-h-[70vh]"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SupportChats;
