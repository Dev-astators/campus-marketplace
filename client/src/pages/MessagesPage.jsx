import { useEffect, useState } from "react";
import { supabase } from "../config/supabaseClient";
import { useNavigate } from "react-router-dom";
import useProfile from "../hooks/useProfile";
import { API_BASE_URL } from "../config/apiBaseUrl";

export default function MessagesPage() {
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  const { profile, accessToken, loading: profileLoading } = useProfile();

  // ─────────────────────────────
  const fetchConversations = async (currentUser, token) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/messages/user/${currentUser.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to fetch messages");
      }

      const payload = await res.json();
      const data = payload.messages || [];

      const grouped = {};

      data.forEach((msg) => {
        const isSender = msg.sender_id === currentUser.id;

        const otherUserId = isSender ? msg.receiver_id : msg.sender_id;

        const otherUserName = isSender
          ? msg.receiver?.full_name
          : msg.sender?.full_name;

        const key = `${msg.listing_id}-${otherUserId}`;

        if (!grouped[key]) {
          grouped[key] = {
            listing_id: msg.listing_id,
            listing_title: msg.listing?.title,
            otherUserId,
            otherUserName,
            lastMessage: msg.content,
            sent_at: msg.sent_at,
          };
        }
      });

      setConversations(Object.values(grouped));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────
  useEffect(() => {
    if (!profile || !accessToken) return;

    fetchConversations(profile, accessToken);

    // ✅ REALTIME FIX
    const channel = supabase
      .channel("messages-page")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        () => {
          fetchConversations(profile, accessToken); // 🔥 refresh automatically
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile, accessToken]);

  // ─────────────────────────────
  const openChat = (conv) => {
    navigate(`/chat/${conv.listing_id}?seller=${conv.otherUserId}`);
  };

  // ─────────────────────────────
  if (profileLoading || loading) return <p className="p-6">Loading...</p>;

  return (
    <main className="min-h-screen bg-gray-50 p-6" aria-label="Messages">
      <header>
        <h1 className="text-2xl font-bold mb-6">Messages</h1>
      </header>

      {conversations.length === 0 ? (
        <p className="text-gray-500">No conversations yet.</p>
      ) : (
        <section aria-label="Conversation list">
          <ul className="space-y-3" role="list">
            {conversations.map((conv, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => openChat(conv)}
                  className="w-full text-left bg-white p-4 rounded-xl border hover:shadow transition"
                >
                  <p className="text-xs text-blue-600 font-medium">
                    {conv.listing_title}
                  </p>

                  <p className="text-sm font-semibold text-gray-800">
                    {conv.otherUserName}
                  </p>

                  <p className="text-sm text-gray-600 truncate">
                    {conv.lastMessage}
                  </p>

                  <time
                    className="text-xs text-gray-400 mt-1 block"
                    dateTime={conv.sent_at}
                  >
                    {new Date(conv.sent_at).toLocaleString()}
                  </time>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
