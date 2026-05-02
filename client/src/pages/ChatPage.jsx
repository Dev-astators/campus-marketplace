import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "../config/supabaseClient";
import Chat from "../components/Chat";
import { API_BASE_URL } from "../config/apiBaseUrl";
import useProfile from "../hooks/useProfile";

export default function ChatPage() {
  const { id: listingId } = useParams();
  const [searchParams] = useSearchParams();
  const sellerId = searchParams.get("seller");

  const { profile, accessToken, loading: profileLoading } = useProfile();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  // ─────────────────────────────
  useEffect(() => {
    if (!profile || !sellerId || !listingId) return;
    if (!accessToken) return;

    const fetchMessages = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/messages/${listingId}/${profile.id}/${sellerId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );

        const data = await res.json();
        setMessages(data.messages || []);
      } catch (err) {
        console.error("Error fetching messages:", err);
      }
    };

    fetchMessages();
  }, [profile, sellerId, listingId, accessToken]);

  // ─────────────────────────────
  // ✅ FIXED: Optimistic UI update
  const handleSend = async () => {
    if (!input.trim() || !profile) return;
    if (!accessToken) return;

    const tempMessage = {
      id: Date.now(), // temporary unique id
      listing_id: listingId,
      sender_id: profile.id,
      receiver_id: sellerId,
      content: input,
      sent_at: new Date().toISOString(),
    };

    // 🔥 Show immediately
    setMessages((prev) => [...prev, tempMessage]);

    try {
      await fetch(`${API_BASE_URL}/api/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          listing_id: listingId,
          sender_id: profile.id,
          receiver_id: sellerId,
          content: input,
        }),
      });

      setInput("");
    } catch (err) {
      console.error("Send message error:", err);
    }
  };

  // ─────────────────────────────
  useEffect(() => {
    if (!profile || !listingId) return;

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
  }, [profile, listingId]);

  // ─────────────────────────────
  if (profileLoading || !profile) {
    return <p className="p-6">Loading chat...</p>;
  }

  return (
    <main className="h-screen flex flex-col p-6 bg-gray-50">
      <header>
        <h1 className="text-lg font-semibold mb-4">Chat</h1>
      </header>

      <section className="flex-1" aria-label="Chat messages">
        <Chat
          messages={messages}
          currentUserId={profile.id}
          input={input}
          setInput={setInput}
          onSend={handleSend}
        />
      </section>
    </main>
  );
}
