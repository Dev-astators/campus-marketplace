import { useEffect, useState } from "react";
import { supabase } from "../config/supabaseClient";
import { useNavigate } from "react-router-dom";

export default function MessagesPage() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  // ─────────────────────────────
  // Get logged-in user
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getSession();

      if (!data.session?.user) {
        setUser(null);
        setLoading(false);
        return;
      }

      setUser(data.session.user);
    };

    getUser();
  }, []);

  // ─────────────────────────────
  // Fetch real conversations from Supabase
  const fetchConversations = async (currentUser) => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select(
          `
          *,
          listing:listings(title),
          sender:profiles!messages_sender_id_fkey(full_name),
          receiver:profiles!messages_receiver_id_fkey(full_name)
        `,
        )
        .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
        .order("sent_at", { ascending: false });

      if (error) throw error;

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
            listing_title: msg.listing?.title || "Untitled listing",
            otherUserId,
            otherUserName: otherUserName || "Unknown user",
            lastMessage: msg.content,
            sent_at: msg.sent_at,
          };
        }
      });

      setConversations(Object.values(grouped));
    } catch (err) {
      console.error("Error fetching conversations:", err);
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────
  // Load conversations + realtime updates
  useEffect(() => {
    if (!user) return;

    fetchConversations(user);

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
          fetchConversations(user);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // ─────────────────────────────
  // Open selected chat
  const openChat = (conv) => {
    navigate(`/chat/${conv.listing_id}?seller=${conv.otherUserId}`);
  };

  // ─────────────────────────────
  // Format date/time
  const formatTime = (dateString) => {
    if (!dateString) return "";

    return new Date(dateString).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ─────────────────────────────
  // Loading state
  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 flex items-center justify-center px-6">
        <section className="bg-white border border-gray-200 rounded-3xl shadow-sm px-8 py-7 text-center">
          <p className="mx-auto w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4 text-2xl">
            💬
          </p>

          <p className="text-base font-semibold text-gray-800">
            Loading messages...
          </p>

          <p className="text-sm text-gray-400 mt-1">
            Please wait while we get your conversations.
          </p>
        </section>
      </main>
    );
  }

  // ─────────────────────────────
  // Main page
  return (
    <main
      className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 px-4 py-8 sm:px-6 lg:px-8"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      <section className="max-w-4xl mx-auto">
        <header className="mb-8 flex items-center justify-between gap-4">
          <section>
            <h1 className="text-3xl font-bold text-gray-900">Messages</h1>

            <p className="text-sm text-gray-500 mt-2">
              View your conversations with sellers about marketplace listings.
            </p>
          </section>

          <aside
            className="hidden sm:flex w-12 h-12 rounded-2xl bg-blue-600 items-center justify-center shadow-sm text-white text-xl"
            aria-label="Messages icon"
          >
            💬
          </aside>
        </header>

        <section className="bg-white/90 backdrop-blur border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
          {conversations.length === 0 ? (
            <article className="px-6 py-16 text-center">
              <p className="mx-auto w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4 text-3xl">
                💬
              </p>

              <h2 className="text-xl font-bold text-gray-800">
                No conversations yet
              </h2>

              <p className="text-sm text-gray-500 mt-2">
                When you contact a seller, your chats will appear here.
              </p>

              {!user && (
                <p className="text-xs text-gray-400 mt-3">
                  You are currently not signed in, so no real conversations can
                  be loaded yet.
                </p>
              )}
            </article>
          ) : (
            <ul className="divide-y divide-gray-100">
              {conversations.map((conv, i) => (
                <li key={`${conv.listing_id}-${conv.otherUserId}-${i}`}>
                  <button
                    type="button"
                    onClick={() => openChat(conv)}
                    className="w-full text-left px-5 py-5 hover:bg-blue-50/60 transition group"
                  >
                    <article className="flex items-center gap-4">
                      <p
                        className="shrink-0 w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center shadow-sm text-base font-bold text-blue-700"
                        aria-label={`Avatar for ${conv.otherUserName}`}
                      >
                        {conv.otherUserName?.charAt(0)?.toUpperCase() || "U"}
                      </p>

                      <section className="min-w-0 flex-1">
                        <header className="flex items-start justify-between gap-3">
                          <section className="min-w-0">
                            <h2 className="text-base font-semibold text-gray-900 truncate">
                              {conv.otherUserName}
                            </h2>

                            <p className="text-xs text-blue-600 font-semibold truncate mt-1">
                              {conv.listing_title}
                            </p>
                          </section>

                          <time
                            className="text-xs text-gray-400 shrink-0"
                            dateTime={conv.sent_at || undefined}
                          >
                            {formatTime(conv.sent_at)}
                          </time>
                        </header>

                        <p className="text-sm text-gray-600 truncate mt-2">
                          {conv.lastMessage}
                        </p>
                      </section>

                      <p className="shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition">
                        →
                      </p>
                    </article>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </section>
    </main>
  );
}