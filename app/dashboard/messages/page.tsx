"use client";

// app/dashboard/messages/page.tsx
import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { FaArrowLeft, FaPaperPlane } from "react-icons/fa";
import Image from "next/image";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { getSocket } from "@/lib/socket";
import { Conversation, Message } from "@/types";
import OnlineDot from "@/components/ui/OnlineDot";

function timeLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function MessagesContent() {
  const { user, isAuthenticated } = useAuth();
  const searchParams = useSearchParams();
  const initConvId = searchParams.get("conv");
  const initHostId = searchParams.get("hostId");
  const initPropertyId = searchParams.get("propertyId");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [convsLoading, setConvsLoading] = useState(true);
  const [activeConvId, setActiveConvId] = useState<string | null>(initConvId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mobileShowThread, setMobileShowThread] = useState(!!initConvId || !!initHostId);

  const activeConv = conversations.find((c) => c.id === activeConvId);
  const otherUser =
    activeConv && user
      ? activeConv.guestId === user.id
        ? activeConv.host
        : activeConv.guest
      : null;

  // ── Fetch conversations (and auto-create if redirected from property page) ───
  useEffect(() => {
    if (!isAuthenticated) return;
    setConvsLoading(true);
    api.get("/conversations").then(async (res) => {
      setConversations(res.data.data.conversations);
      // If redirected here post-login with hostId+propertyId, create/fetch conv
      if (initHostId && initPropertyId && !initConvId) {
        try {
          const convRes = await api.post("/conversations", {
            hostId: initHostId,
            propertyId: initPropertyId,
          });
          const convId = convRes.data.data.conversation.id;
          setActiveConvId(convId);
          setMobileShowThread(true);
          // Refresh conversation list to include the new one
          const listRes = await api.get("/conversations");
          setConversations(listRes.data.data.conversations);
        } catch {
          // handled by interceptor
        }
      }
    }).catch(() => {}).finally(() => setConvsLoading(false));
  }, [isAuthenticated, initHostId, initPropertyId, initConvId]);

  // ── Socket setup ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    const socket = getSocket(token);
    if (!socket.connected) socket.connect();

    socket.on("user:online", ({ userId }: { userId: string }) => {
      setOnlineUsers((s) => new Set(s).add(userId));
    });
    socket.on("user:offline", ({ userId }: { userId: string }) => {
      setOnlineUsers((s) => {
        const next = new Set(s);
        next.delete(userId);
        return next;
      });
    });
    socket.on("new_message", (msg: Message) => {
      if (msg.conversationId === activeConvId) {
        setMessages((prev) => [...prev, msg]);
        // Mark read automatically if viewing this conversation
        socket.emit("mark_read", msg.conversationId);
      }
      // Update conversation preview
      setConversations((prev) =>
        prev.map((c) =>
          c.id === msg.conversationId
            ? { ...c, lastMessagePreview: msg.body, lastMessageAt: msg.createdAt }
            : c
        )
      );
    });
    socket.on("user_typing", ({ conversationId, userId: uid }: any) => {
      if (conversationId === activeConvId) {
        setTypingUsers((s) => new Set(s).add(uid));
      }
    });
    socket.on("user_stopped_typing", ({ conversationId, userId: uid }: any) => {
      if (conversationId === activeConvId) {
        setTypingUsers((s) => {
          const next = new Set(s);
          next.delete(uid);
          return next;
        });
      }
    });

    return () => {
      socket.off("user:online");
      socket.off("user:offline");
      socket.off("new_message");
      socket.off("user_typing");
      socket.off("user_stopped_typing");
    };
  }, [isAuthenticated, activeConvId]);

  // ── Load messages when active conversation changes ───────────────────────────
  useEffect(() => {
    if (!activeConvId) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    setMessagesLoading(true);
    api.get(`/conversations/${activeConvId}/messages`).then((res) => {
      setMessages(res.data.data.messages);
    }).catch(() => {}).finally(() => setMessagesLoading(false));

    const socket = getSocket(token);
    socket.emit("join_conversation", activeConvId);
    socket.emit("mark_read", activeConvId);
  }, [activeConvId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const selectConversation = (id: string) => {
    setActiveConvId(id);
    setMobileShowThread(true);
    setMessages([]);
    setTypingUsers(new Set());
    setMessagesLoading(true);
  };

  const sendMessage = async () => {
    if (!draft.trim() || !activeConvId || sending) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    setSending(true);
    const socket = getSocket(token);
    socket.emit("send_message", { conversationId: activeConvId, body: draft.trim() });
    setDraft("");
    setSending(false);
    socket.emit("typing_stop", activeConvId);
  };

  const handleDraftChange = (val: string) => {
    setDraft(val);
    if (!activeConvId) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    const socket = getSocket(token);
    socket.emit("typing_start", activeConvId);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socket.emit("typing_stop", activeConvId);
    }, 2000);
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-gray-50">
      {/* ── Conversation list ───────────────────────────────────────────────── */}
      <aside
        className={`w-full md:w-80 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col ${
          mobileShowThread ? "hidden md:flex" : "flex"
        }`}
      >
        <div className="px-4 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {convsLoading ? (
            // Skeleton rows while conversations load
            <div className="divide-y divide-gray-50">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
                    <div className="h-2.5 bg-gray-100 rounded animate-pulse w-4/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-12">No conversations yet</p>
          ) : null}
          {!convsLoading && conversations.map((conv) => {
            const other = user
              ? conv.guestId === user.id
                ? conv.host
                : conv.guest
              : null;
            const isActive = conv.id === activeConvId;
            const isOnline = other ? onlineUsers.has(other.id) : false;

            return (
              <button
                key={conv.id}
                onClick={() => selectConversation(conv.id)}
                className={`w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 ${
                  isActive ? "bg-gray-50" : ""
                }`}
              >
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600">
                    {other?.profileImage ? (
                      <Image src={other.profileImage} alt="" width={40} height={40} className="rounded-full object-cover" />
                    ) : (
                      other?.firstName?.[0]?.toUpperCase() ?? "?"
                    )}
                  </div>
                  <OnlineDot
                    isOnline={isOnline}
                    className="absolute -bottom-0.5 -right-0.5"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {other?.firstName} {other?.lastName}
                    </span>
                    {conv.lastMessageAt && (
                      <span className="text-[10px] text-gray-400 ml-1 shrink-0">
                        {timeLabel(conv.lastMessageAt)}
                      </span>
                    )}
                  </div>
                  {conv.lastMessagePreview && (
                    <p className="text-xs text-gray-400 truncate">{conv.lastMessagePreview}</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* ── Message thread ──────────────────────────────────────────────────── */}
      <main
        className={`flex-1 flex flex-col ${
          mobileShowThread ? "flex" : "hidden md:flex"
        }`}
      >
        {!activeConv ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
            Select a conversation to start messaging
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100">
              <button
                className="md:hidden text-gray-500 mr-1"
                onClick={() => setMobileShowThread(false)}
              >
                <FaArrowLeft />
              </button>
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600">
                  {otherUser?.profileImage ? (
                    <Image src={otherUser.profileImage} alt="" width={36} height={36} className="rounded-full object-cover" />
                  ) : (
                    otherUser?.firstName?.[0]?.toUpperCase() ?? "?"
                  )}
                </div>
                <OnlineDot
                  isOnline={otherUser ? onlineUsers.has(otherUser.id) : false}
                  className="absolute -bottom-0.5 -right-0.5"
                />
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-900">
                  {otherUser?.firstName} {otherUser?.lastName}
                </p>
                <p className="text-xs text-gray-400">
                  {otherUser && onlineUsers.has(otherUser.id) ? "Online" : "Offline"}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
              {messagesLoading ? (
                // Skeleton bubbles while messages load
                <>
                  {[
                    { mine: false, w: "w-48" },
                    { mine: true,  w: "w-36" },
                    { mine: false, w: "w-56" },
                    { mine: true,  w: "w-44" },
                    { mine: false, w: "w-32" },
                  ].map((s, i) => (
                    <div key={i} className={`flex ${s.mine ? "justify-end" : "justify-start"}`}>
                      <div className={`${s.w} h-10 bg-gray-200 rounded-2xl animate-pulse ${s.mine ? "rounded-br-sm" : "rounded-bl-sm"}`} />
                    </div>
                  ))}
                </>
              ) : null}
              {!messagesLoading && messages.map((msg) => {
                const isMine = msg.senderId === user?.id;
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        isMine
                          ? "bg-black text-white rounded-br-sm"
                          : "bg-white text-gray-900 border border-gray-100 rounded-bl-sm"
                      }`}
                    >
                      {msg.body}
                      <p
                        className={`text-[10px] mt-1 ${isMine ? "text-white/60 text-right" : "text-gray-400"}`}
                      >
                        {timeLabel(msg.createdAt)}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
              {!messagesLoading && messages.length === 0 && (
                <p className="text-center text-gray-400 text-sm py-8">No messages yet. Say hello!</p>
              )}

              {typingUsers.size > 0 && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm text-gray-400 italic">
                    typing…
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Compose */}
            <div className="bg-white border-t border-gray-100 px-4 py-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage();
                }}
                className="flex gap-2 items-end"
              >
                <textarea
                  value={draft}
                  onChange={(e) => handleDraftChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Type a message…"
                  rows={1}
                  className="flex-1 resize-none border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-gray-400 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!draft.trim() || sending}
                  className="bg-black text-white p-2.5 rounded-xl disabled:opacity-40 hover:bg-gray-800 transition-colors shrink-0"
                >
                  <FaPaperPlane size={14} />
                </button>
              </form>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <MessagesContent />
    </Suspense>
  );
}
