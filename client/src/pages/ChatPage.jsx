import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "../config/supabaseClient";
import Chat from "../components/Chat";
import { API_BASE_URL } from "../config/apiBaseUrl";

const PREVIEW_USER_ID = "preview-user";

const PREVIEW_MESSAGES = [
  {
    id: "preview-1",
    listing_id: "preview-listing",
    sender_id: "seller-preview",
    receiver_id: PREVIEW_USER_ID,
    content: "Hi, yes this item is still available.",
    sent_at: new Date().toISOString(),
    is_read: true,
  },
  {
    id: "preview-2",
    listing_id: "preview-listing",
    sender_id: PREVIEW_USER_ID,
    receiver_id: "seller-preview",
    content: "Great, can I collect it tomorrow?",
    sent_at: new Date().toISOString(),
    is_read: true,
  },
  {
    id: "preview-3",
    listing_id: "preview-listing",
    sender_id: "seller-preview",
    receiver_id: PREVIEW_USER_ID,
    content: "Yes, tomorrow works. We can meet at the trade facility.",
    sent_at: new Date().toISOString(),
    is_read: false,
  },
];

export default function ChatPage() {
  const navigate = useNavigate();

  const { id: listingId } = useParams();

  const [searchParams] = useSearchParams();

  const sellerId = searchParams.get("seller");

  const [user, setUser] = useState(null);

  const [messages, setMessages] = useState([]);

  const [input, setInput] = useState("");

  const [loadingUser, setLoadingUser] = useState(true);

  // ─────────────────────────────
  // Get logged-in user
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getSession();

      setUser(data.session?.user || null);

      setLoadingUser(false);
    };

    getUser();
  }, []);

  // ─────────────────────────────
  // Mark messages as read
  const markMessagesAsRead = useCallback(async () => {
    if (!user || !sellerId || !listingId) return;

    try {
      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("listing_id", listingId)
        .eq("sender_id", sellerId)
        .eq("receiver_id", user.id)
        .eq("is_read", false);

      // IMPORTANT FIX:
      // refetch messages immediately
      // so first double-tick updates instantly
      const res = await fetch(
        `${API_BASE_URL}/api/messages/${listingId}/${user.id}/${sellerId}`,
      );

      const data = await res.json();

      setMessages(data.messages || []);
    } catch (err) {
      console.error("Error marking messages as read:", err);
    }
  }, [user, sellerId, listingId]);

  // ─────────────────────────────
  // Fetch messages
  useEffect(() => {
    if (!user || !sellerId || !listingId) return;

    const fetchMessages = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/messages/${listingId}/${user.id}/${sellerId}`,
        );

        const data = await res.json();

        setMessages(data.messages || []);

        await markMessagesAsRead();
      } catch (err) {
        console.error("Error fetching messages:", err);
      }
    };

    fetchMessages();
  }, [user, sellerId, listingId, markMessagesAsRead]);

  // ─────────────────────────────
  // Send message
  const handleSend = async () => {
    if (!input.trim()) return;

    if (!user) {
      const previewMessage = {
        id: Date.now(),
        listing_id: listingId || "preview-listing",
        sender_id: PREVIEW_USER_ID,
        receiver_id: sellerId || "seller-preview",
        content: input.trim(),
        sent_at: new Date().toISOString(),
        is_read: false,
      };

      PREVIEW_MESSAGES.push(previewMessage);

      setInput("");

      return;
    }

    if (!sellerId || !listingId) return;

    const messageContent = input.trim();

    // TEMP optimistic message
    const tempMessage = {
      id: `temp-${Date.now()}`,
      listing_id: listingId,
      sender_id: user.id,
      receiver_id: sellerId,
      content: messageContent,
      sent_at: new Date().toISOString(),
      is_read: false,
    };

    setMessages((prev) => [...prev, tempMessage]);

    setInput("");

    try {
      await fetch(`${API_BASE_URL}/api/messages`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          listing_id: listingId,
          sender_id: user.id,
          receiver_id: sellerId,
          content: messageContent,
        }),
      });
    } catch (err) {
      console.error("Send message error:", err);

      // remove failed temp message
      setMessages((prev) =>
        prev.filter((msg) => msg.id !== tempMessage.id),
      );
    }
  };

  // ─────────────────────────────
  // REALTIME SUBSCRIPTIONS
  useEffect(() => {
    if (!user || !listingId || !sellerId) return;

    let isMounted = true;

    const fetchLatestMessages = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/messages/${listingId}/${user.id}/${sellerId}`,
        );

        const data = await res.json();

        if (!isMounted) return;

        setMessages(data.messages || []);
      } catch (err) {
        console.error("Realtime sync error:", err);
      }
    };

    const channel = supabase
      .channel(`chat-${listingId}-${user.id}-${sellerId}`)

      // NEW MESSAGE
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },

        async (payload) => {
          const newMessage = payload.new;

          const isThisConversation =
            newMessage.listing_id === listingId &&
            (
              (
                newMessage.sender_id === user.id &&
                newMessage.receiver_id === sellerId
              ) ||
              (
                newMessage.sender_id === sellerId &&
                newMessage.receiver_id === user.id
              )
            );

          if (!isThisConversation) return;

          setMessages((prev) => {
            // remove matching temp message
            const filtered = prev.filter((msg) => {
              const isMatchingTemp =
                String(msg.id).startsWith("temp-") &&
                msg.content === newMessage.content &&
                msg.sender_id === newMessage.sender_id;

              return !isMatchingTemp;
            });

            const alreadyExists = filtered.some(
              (msg) => msg.id === newMessage.id,
            );

            if (alreadyExists) return filtered;

            return [...filtered, newMessage];
          });

          // instantly mark incoming messages as read
          if (newMessage.receiver_id === user.id) {
            await markMessagesAsRead();
          }
        },
      )

      // READ STATUS
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
        },

        (payload) => {
          const updatedMessage = payload.new;

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === updatedMessage.id
                ? {
                    ...msg,
                    ...updatedMessage,
                  }
                : msg,
            ),
          );
        },
      )

      // IMPORTANT FIX
      .subscribe(async (status) => {
        console.log("Realtime status:", status);

        // When subscription is fully connected,
        // fetch latest messages again
        // so first message is never missed
        if (status === "SUBSCRIBED") {
          await fetchLatestMessages();
        }
      });

    return () => {
      isMounted = false;

      supabase.removeChannel(channel);
    };
  }, [user, listingId, sellerId, markMessagesAsRead]);

  // ─────────────────────────────
  const displayedMessages = user ? messages : PREVIEW_MESSAGES;

  const displayedUserId = user?.id || PREVIEW_USER_ID;

  // Add status
  const enhancedMessages = displayedMessages.map((msg) => {
    const isMine = msg.sender_id === displayedUserId;

    return {
      ...msg,
      status: isMine ? (msg.is_read ? "read" : "sent") : null,
    };
  });

  // ─────────────────────────────
  if (loadingUser) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 flex items-center justify-center px-6">
        <section className="bg-white border border-gray-200 rounded-3xl shadow-sm px-8 py-7 text-center">
          <p className="mx-auto w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4 text-2xl">
            💬
          </p>

          <p className="text-base font-semibold text-gray-800">
            Loading chat...
          </p>

          <p className="text-sm text-gray-400 mt-1">
            Please wait while we prepare your conversation.
          </p>
        </section>
      </main>
    );
  }

  // ─────────────────────────────
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 px-4 py-8 sm:px-6 lg:px-8">
      <section className="max-w-4xl mx-auto h-[calc(100vh-4rem)] flex flex-col">
        <header className="mb-6 flex items-center justify-between gap-4">
          <section>
            <h1 className="text-3xl font-bold text-gray-900">Chat</h1>

            <p className="text-sm text-gray-500 mt-2">
              Send and receive messages about this marketplace listing.
            </p>
          </section>

          <button
            onClick={() => navigate("/messages")}
            className="px-4 py-2 rounded-xl border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            Back to Messages
          </button>
        </header>

        <section className="flex-1 min-h-0">
          <Chat
            messages={enhancedMessages}
            currentUserId={displayedUserId}
            input={input}
            setInput={setInput}
            onSend={handleSend}
          />
        </section>
      </section>
    </main>
  );
}