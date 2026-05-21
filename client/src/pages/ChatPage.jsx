import { useEffect, useState, useCallback } from "react";
import {
  useNavigate,
  useParams,
  useSearchParams,
  useLocation,
} from "react-router-dom";
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
  const location = useLocation();
  const { id: listingId } = useParams();
  const [searchParams] = useSearchParams();

  const sellerId = searchParams.get("seller");

  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loadingUser, setLoadingUser] = useState(true);
  const [conversationName, setConversationName] = useState("Unknown user");
  const [listingSummary, setListingSummary] = useState(null);

  const backTarget = location.state?.backTo || "/messages";

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getSession();

      setUser(data.session?.user || null);
      setLoadingUser(false);
    };

    getUser();
  }, []);

  useEffect(() => {
    if (!listingId) return;

    const fetchChatContext = async () => {
      try {
        if (sellerId) {
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", sellerId)
            .single();

          if (profileError) {
            console.error("Error loading chat profile:", profileError);
          }

          setConversationName(profile?.full_name || "Unknown user");
        }

        const listingResponse = await fetch(
          `${API_BASE_URL}/api/listings/${listingId}`,
        );

        if (!listingResponse.ok) {
          throw new Error("Failed to load listing context");
        }

        const listingData = await listingResponse.json();

        setListingSummary({
          title: listingData.listing?.title || "Marketplace listing",
          price:
            listingData.listing?.price ??
            listingData.listing?.asking_price ??
            null,
        });
      } catch (err) {
        console.error("Error loading chat context:", err);

        setListingSummary({
          title: "Marketplace listing",
          price: null,
        });
      }
    };

    fetchChatContext();
  }, [listingId, sellerId]);

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

      const res = await fetch(
        `${API_BASE_URL}/api/messages/${listingId}/${user.id}/${sellerId}`,
      );

      const data = await res.json();

      setMessages(data.messages || []);
    } catch (err) {
      console.error("Error marking messages as read:", err);
    }
  }, [user, sellerId, listingId]);

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

      setMessages((prev) =>
        prev.filter((msg) => msg.id !== tempMessage.id),
      );
    }
  };

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

          if (newMessage.receiver_id === user.id) {
            await markMessagesAsRead();
          }
        },
      )

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

      .subscribe(async (status) => {
        console.log("Realtime status:", status);

        if (status === "SUBSCRIBED") {
          await fetchLatestMessages();
        }
      });

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [user, listingId, sellerId, markMessagesAsRead]);

  const displayedMessages = user ? messages : PREVIEW_MESSAGES;
  const displayedUserId = user?.id || PREVIEW_USER_ID;

  const enhancedMessages = displayedMessages.map((msg) => {
    const isMine = msg.sender_id === displayedUserId;

    return {
      ...msg,
      status: isMine ? (msg.is_read ? "read" : "sent") : null,
    };
  });

  if (loadingUser) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center px-6">
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

  return (
    <main className="min-h-screen bg-white px-6 py-6">
      <section className="max-w-7xl mx-auto grid grid-cols-[110px_1fr] gap-6 items-start">
        <section className="-ml-12 pt-1">
          <button
            type="button"
            aria-label="Back to Messages"
            onClick={() => navigate(backTarget, { replace: true })}
            className="px-4 py-2 border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 transition bg-white"
          >
            Back
          </button>
        </section>

        <section className="mt-6">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Chat
            </h1>

            <p className="text-sm text-gray-500 mt-2">
              Send and receive messages about this marketplace listing.
            </p>
          </header>

          <section className="h-[calc(100vh-14rem)] min-h-[520px] max-w-6xl">
            <Chat
              messages={enhancedMessages}
              currentUserId={displayedUserId}
              input={input}
              setInput={setInput}
              onSend={handleSend}
              conversationName={conversationName}
              listing={listingSummary}
            />
          </section>
        </section>
      </section>
    </main>
  );
}