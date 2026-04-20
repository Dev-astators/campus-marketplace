import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "../config/supabaseClient";
import Chat from "../components/Chat";
import { API_BASE_URL } from "../config/apiBaseUrl";

export default function ChatPage() {
  const { id: listingId } = useParams();
  const [searchParams] = useSearchParams();
  const sellerId = searchParams.get("seller");

  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  // ─────────────────────────────
  // GET CURRENT USER
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user);
    };

    getUser();
  }, []);

  // ─────────────────────────────
  // FETCH MESSAGES (FIXED - no hook warnings)
  useEffect(() => {
    if (!user || !sellerId || !listingId) return;

    const fetchMessages = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/messages/${listingId}/${user.id}/${sellerId}`,
        );

        const data = await res.json();
        setMessages(data.messages || []);
      } catch (err) {
        console.error("Error fetching messages:", err);
      }
    };

    fetchMessages();
  }, [user, sellerId, listingId]);

  // ─────────────────────────────
  // SEND MESSAGE
  const handleSend = async () => {
    if (!input.trim() || !user) return;

    try {
      await fetch(`${API_BASE_URL}/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listing_id: listingId,
          sender_id: user.id,
          receiver_id: sellerId,
          content: input,
        }),
      });

      setInput("");
      // ❌ Do NOT refetch (Realtime will handle it)
    } catch (err) {
      console.error("Send message error:", err);
    }
  };

  // ─────────────────────────────
  // REALTIME SUBSCRIPTION (NO DUPLICATES)
  useEffect(() => {
    if (!user || !listingId) return;

    const channel = supabase
      .channel(`chat-${listingId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `listing_id=eq.${listingId}`,
        },
        (payload) => {
          const newMessage = payload.new;

          // 🔥 Prevent duplicates
          setMessages((prev) => {
            const exists = prev.some((msg) => msg.id === newMessage.id);
            if (exists) return prev;
            return [...prev, newMessage];
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, listingId]);

  // ─────────────────────────────
  if (!user) {
    return <p className="p-6">Loading chat...</p>;
  }

  return (
    <main
      className="h-screen flex flex-col p-6 bg-gray-50"
      aria-label="Chat page"
    >
      <h1 className="text-lg font-semibold mb-4">Chat</h1>

      <section className="flex-1" aria-label="Chat conversation">
        <Chat
          messages={messages}
          currentUserId={user.id}
          input={input}
          setInput={setInput}
          onSend={handleSend}
        />
      </section>
    </main>
  );
}
