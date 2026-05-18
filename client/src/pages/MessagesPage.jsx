import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../config/supabaseClient";

export default function MessagesPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const fetchConversations = useCallback(async (currentUser) => {
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

      (data || []).forEach((message) => {
        const isSender = message.sender_id === currentUser.id;
        const otherUserId = isSender ? message.receiver_id : message.sender_id;
        const otherUserName = isSender
          ? message.receiver?.full_name
          : message.sender?.full_name;
        const key = `${message.listing_id}-${otherUserId}`;

        if (!grouped[key]) {
          grouped[key] = {
            listing_id: message.listing_id,
            listing_title: message.listing?.title || "Untitled listing",
            otherUserId,
            otherUserName: otherUserName || "Unknown user",
            lastMessage: message.content,
            sent_at: message.sent_at,
          };
        }
      });

      setConversations(Object.values(grouped));
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    const loadConversations = async () => {
      await fetchConversations(user);
    };

    loadConversations();
  }, [user, fetchConversations]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("messages-page-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        async (payload) => {
          const message = payload.new;
          const belongsToUser =
            message.sender_id === user.id || message.receiver_id === user.id;

          if (!belongsToUser) return;

          await fetchConversations(user);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
        },
        async (payload) => {
          const message = payload.new;
          const belongsToUser =
            message.sender_id === user.id || message.receiver_id === user.id;

          if (!belongsToUser) return;

          await fetchConversations(user);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchConversations]);

  const openChat = (conversation) => {
    try {
      sessionStorage.removeItem("chatBackTarget");
    } catch {
      // Ignore sessionStorage errors (e.g. in private mode)
    }

    navigate(`/chat/${conversation.listing_id}?seller=${conversation.otherUserId}`);
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";

    return new Date(dateString).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white px-4 sm:px-6">
        <article className="rounded-3xl border border-gray-200 bg-white px-6 py-7 text-center shadow-sm sm:px-8">
          <p className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-sm font-semibold text-blue-700">
            Chats
          </p>
          <p className="text-base font-semibold text-gray-800">
            Loading messages...
          </p>
          <p className="mt-1 text-sm text-gray-400">
            Please wait while we get your conversations.
          </p>
        </article>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white px-4 py-6 sm:px-6 sm:py-8">
      <article className="mx-auto max-w-6xl">
        <header className="mb-8">
          <p>
            <button
              type="button"
              onClick={() => navigate("/student-dashboard")}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              Back
            </button>
          </p>
          <h1 className="mt-4 text-2xl font-bold text-gray-900 sm:text-3xl">
            Messages
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            View your conversations about marketplace listings.
          </p>
        </header>

        <section className="max-w-5xl">
          {conversations.length === 0 ? (
            <article className="rounded-3xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm sm:px-8 sm:py-20">
              <p className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-700">
                Chats
              </p>
              <h2 className="text-xl font-bold text-gray-800">
                No conversations yet
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                When you contact a seller, your chats will appear here.
              </p>
              {!user ? (
                <p className="mt-3 text-xs text-gray-400">
                  You are currently not signed in, so no real conversations can
                  be loaded yet.
                </p>
              ) : null}
            </article>
          ) : (
            <section className="space-y-4" aria-label="Message conversations">
              {conversations.map((conversation, index) => (
                <article
                  key={`${conversation.listing_id}-${conversation.otherUserId}-${index}`}
                  className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
                >
                  <button
                    type="button"
                    onClick={() => openChat(conversation)}
                    className="w-full px-4 py-5 text-left transition hover:bg-gray-50 sm:px-6"
                  >
                    <section className="flex items-start gap-4 sm:gap-5">
                      <p className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-100 text-base font-bold text-green-700 sm:h-14 sm:w-14 sm:text-lg">
                        {conversation.otherUserName?.charAt(0)?.toUpperCase() || "U"}
                      </p>

                      <section className="min-w-0 flex-1">
                        <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <section className="min-w-0">
                            <h2 className="truncate text-base font-bold text-gray-900 sm:text-lg">
                              {conversation.otherUserName}
                            </h2>
                            <p className="mt-1 truncate text-sm font-semibold text-blue-700">
                              {conversation.listing_title}
                            </p>
                          </section>

                          <time
                            dateTime={conversation.sent_at || undefined}
                            className="shrink-0 pt-0.5 text-xs text-gray-400"
                          >
                            {formatTime(conversation.sent_at)}
                          </time>
                        </header>

                        <footer className="mt-3 flex items-center justify-between gap-3">
                          <p className="truncate text-sm text-gray-600">
                            {conversation.lastMessage}
                          </p>
                          <p className="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500">
                            Open
                          </p>
                        </footer>
                      </section>
                    </section>
                  </button>
                </article>
              ))}
            </section>
          )}
        </section>
      </article>
    </main>
  );
}
