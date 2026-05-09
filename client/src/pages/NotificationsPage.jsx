import { useEffect, useState, useCallback } from "react";
import { supabase } from "../config/supabaseClient";
import { useNavigate } from "react-router-dom";

const getNotificationIcon = (type) => {
  if (type === "message") return "💬";
  if (type === "listing") return "🏷️";
  if (type === "booking") return "📦";
  if (type === "payment") return "💳";
  if (type === "rating") return "⭐";

  return "🔔";
};

export default function NotificationsPage() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // ─────────────────────────────
  // FORMAT TIME (MOVED UP → FIX LINT ERROR)
  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ─────────────────────────────
  // Get logged in user
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getSession();

      if (!data.session?.user) {
        setLoading(false);
        return;
      }

      setUser(data.session.user);
    };

    getUser();
  }, []);

  // ─────────────────────────────
  // Fetch notifications (stable + lint-safe)
  const fetchNotifications = useCallback(async (currentUser) => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select(`
          id,
          content,
          sent_at,
          is_read,
          listing_id,
          sender_id,
          receiver_id,
          listing:listings(title),
          sender:profiles!messages_sender_id_fkey(full_name)
        `)
        .eq("receiver_id", currentUser.id)
        .neq("sender_id", currentUser.id)
        .order("sent_at", { ascending: false });

      if (error) throw error;

      const formatted = (data || []).map((msg) => ({
        id: msg.id,
        type: "message",
        title: `New message from ${
          msg.sender?.full_name || "Unknown user"
        }`,
        description: msg.listing?.title
          ? `About "${msg.listing.title}"`
          : msg.content,
        time: formatTime(msg.sent_at),
        listing_id: msg.listing_id,
        sender_id: msg.sender_id,
        is_read: msg.is_read ?? false,
      }));

      setNotifications(formatted);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ─────────────────────────────
  // Realtime updates (FIXED dependency + no lint issue)
  useEffect(() => {
    if (!user) return;

    fetchNotifications(user);

    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        async (payload) => {
          if (payload.new.receiver_id !== user.id) return;
          if (payload.new.sender_id === user.id) return;

          await fetchNotifications(user);

          if (Notification.permission === "granted") {
            new Notification("New Message", {
              body: "You received a new marketplace message.",
            });
          }
        }
      )
      .subscribe();

    if (Notification.permission !== "granted") {
      Notification.requestPermission();
    }

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchNotifications]);

  // ─────────────────────────────
  const markAllAsRead = async () => {
    try {
      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("receiver_id", user.id)
        .eq("is_read", false);

      fetchNotifications(user);
    } catch (err) {
      console.error("Error marking notifications as read:", err);
    }
  };

  const openNotification = async (notification) => {
    try {
      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("id", notification.id);

      navigate(
        `/chat/${notification.listing_id}?seller=${notification.sender_id}`
      );
    } catch (err) {
      console.error("Error opening notification:", err);
    }
  };

  // ─────────────────────────────
  const unreadNotifications = notifications.filter((n) => !n.is_read);
  const earlierNotifications = notifications.filter((n) => n.is_read);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading notifications...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 px-4 py-8 sm:px-6 lg:px-8">
      <section className="max-w-4xl mx-auto">
        <header className="mb-8 flex items-center justify-between gap-4">
          <section>
            <h1 className="text-3xl font-bold text-gray-900">
              Notifications
            </h1>
            <p className="text-sm text-gray-500 mt-2">
              Stay updated on new messages sent to you.
            </p>
          </section>

          <section className="flex items-center gap-3">
            {unreadNotifications.length > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
              >
                Mark all as read
              </button>
            )}
          </section>
        </header>

        <section className="bg-white/90 backdrop-blur border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
          {notifications.length === 0 ? (
            <article className="px-6 py-16 text-center">
              <p className="mx-auto w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4 text-3xl">
                🔔
              </p>

              <h2 className="text-xl font-bold text-gray-800">
                No notifications yet
              </h2>

              <p className="text-sm text-gray-500 mt-2">
                New incoming messages will appear here.
              </p>
            </article>
          ) : (
            <>
              {unreadNotifications.length > 0 && (
                <section className="border-b border-gray-100">
                  <header className="px-5 py-4 bg-gray-50">
                    <h2 className="text-sm font-bold text-gray-700">
                      Unread
                    </h2>
                  </header>

                  <ul className="divide-y divide-gray-100">
                    {unreadNotifications.map((notification) => (
                      <li key={notification.id}>
                        <button
                          type="button"
                          onClick={() => openNotification(notification)}
                          className="w-full text-left"
                        >
                          <article className="px-5 py-5 hover:bg-blue-50/60 transition cursor-pointer">
                            <section className="flex items-start gap-4">
                              <p className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-xl">
                                {getNotificationIcon(notification.type)}
                              </p>

                              <section className="flex-1">
                                <h3 className="text-base font-semibold text-gray-900">
                                  {notification.title}
                                </h3>
                                <p className="text-sm text-gray-600 mt-1">
                                  {notification.description}
                                </p>
                                <time className="text-xs text-gray-400">
                                  {notification.time}
                                </time>
                              </section>
                            </section>
                          </article>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {earlierNotifications.length > 0 && (
                <section>
                  <header className="px-5 py-4 bg-gray-50">
                    <h2 className="text-sm font-bold text-gray-700">
                      Read
                    </h2>
                  </header>

                  <ul className="divide-y divide-gray-100">
                    {earlierNotifications.map((notification) => (
                      <li key={notification.id}>
                        <button
                          type="button"
                          onClick={() => openNotification(notification)}
                          className="w-full text-left"
                        >
                          <article className="px-5 py-5 hover:bg-gray-50 transition cursor-pointer">
                            <section className="flex items-start gap-4">
                              <p className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-xl">
                                {getNotificationIcon(notification.type)}
                              </p>

                              <section className="flex-1">
                                <h3 className="text-base font-semibold text-gray-800">
                                  {notification.title}
                                </h3>
                                <p className="text-sm text-gray-600 mt-1">
                                  {notification.description}
                                </p>
                                <time className="text-xs text-gray-400">
                                  {notification.time}
                                </time>
                              </section>
                            </section>
                          </article>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}
        </section>
      </section>
    </main>
  );
}