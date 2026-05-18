import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "../config/supabaseClient";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/apiBaseUrl";

const getNotificationIcon = (type) => {
  if (type === "message") return "Message";
  if (type === "listing") return "Listing";
  if (type === "booking") return "Booking";
  if (type === "payment") return "Payment";
  if (type === "rating") return "Rating";
  if (type === "sale") return "Sale";
  if (type === "purchase") return "Purchase";
  if (type === "drop_off") return "Drop-off";
  if (type === "dropoff") return "Drop-off";
  if (type === "collection") return "Collection";

  return "Alert";
};

const getStoredBookingReads = () =>
  JSON.parse(localStorage.getItem("read_booking_notifications") || "[]");

const saveStoredBookingReads = (ids) => {
  localStorage.setItem("read_booking_notifications", JSON.stringify(ids));
};

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);
  const toastTimeoutRef = useRef(null);

  const formatTime = useCallback((dateString) => {
    return new Date(dateString).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  const showToast = useCallback((message) => {
    if (!message) return;
    setToastMessage(message);

    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }

    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

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

  const fetchBookingNotifications = useCallback(
    async (currentUser) => {
      try {
        const { data, error } = await supabase
          .from("facility_bookings")
          .select(
            `
            id,
            status,
            booking_type,
            confirmed_at,
            student_id,
            slot:facility_slots(
              slot_date,
              slot_time,
              facility:trade_facilities(
                name,
                location
              )
            ),
            transaction:transactions(
              listing:listings(
                title
              )
            )
          `,
          )
          .eq("student_id", currentUser.id)
          .in("booking_type", ["collection", "drop_off"])
          .order("confirmed_at", { ascending: false });

        if (error) throw error;

        const readBookingIds = getStoredBookingReads();

        return (data || []).map((booking) => {
          const bookingNotificationId = `booking-${booking.id}`;
          const actionText =
            booking.booking_type === "collection" ? "Collect" : "Drop off";
          const titlePrefix =
            booking.booking_type === "collection"
              ? "Collection Booking"
              : "Drop-off Booking";

          return {
            id: bookingNotificationId,
            type: "booking",
            bookingType: booking.booking_type,
            title:
              booking.status === "confirmed"
                ? `${titlePrefix} Confirmed`
                : `${titlePrefix} Update`,
            description: `${actionText} "${booking.transaction?.listing?.title || "your item"}" at ${booking.slot?.facility?.name || "facility"} (${booking.slot?.facility?.location || "campus"}) on ${booking.slot?.slot_date} at ${booking.slot?.slot_time}`,
            time: formatTime(booking.confirmed_at || new Date().toISOString()),
            rawTime: booking.confirmed_at,
            is_read: readBookingIds.includes(bookingNotificationId),
            bookingData: booking,
          };
        });
      } catch (error) {
        console.error("Error fetching booking notifications:", error);
        return [];
      }
    },
    [formatTime],
  );

  const fetchTradeNotifications = useCallback(
    async (currentUser) => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/payments/notifications/${currentUser.id}`,
        );

        if (!res.ok) throw new Error("Failed to fetch trade notifications");

        const data = await res.json();
        const list = Array.isArray(data) ? data : [];

        return list.map((notification) => {
          const normalizedType =
            notification.type === "drop_off" ? "dropoff" : notification.type;

          return {
            id: `trade-${notification.id}`,
            type: normalizedType || "system",
            category: "trade",
            title: notification.title || "Marketplace update",
            description: notification.message || "",
            time: formatTime(notification.created_at),
            rawTime: notification.created_at,
            is_read: notification.is_read ?? false,
            notificationId: notification.id,
            relatedTransactionId: notification.related_transaction_id,
          };
        });
      } catch (error) {
        console.error("Error fetching trade notifications:", error);
        return [];
      }
    },
    [formatTime],
  );

  const fetchNotifications = useCallback(
    async (currentUser) => {
      try {
        const { data, error } = await supabase
          .from("messages")
          .select(
            `
            id,
            content,
            sent_at,
            is_read,
            listing_id,
            sender_id,
            receiver_id,
            listing:listings(title),
            sender:profiles!messages_sender_id_fkey(
              full_name
            )
          `,
          )
          .eq("receiver_id", currentUser.id)
          .neq("sender_id", currentUser.id)
          .order("sent_at", { ascending: false });

        if (error) throw error;

        const formattedMessages = (data || []).map((message) => ({
          id: message.id,
          type: "message",
          title: `New message from ${message.sender?.full_name || "Unknown user"}`,
          description: message.listing?.title
            ? `About "${message.listing.title}"`
            : message.content,
          time: formatTime(message.sent_at),
          rawTime: message.sent_at,
          listing_id: message.listing_id,
          sender_id: message.sender_id,
          is_read: message.is_read ?? false,
        }));

        const bookingNotifications =
          await fetchBookingNotifications(currentUser);
        const tradeNotifications = await fetchTradeNotifications(currentUser);
        const combined = [
          ...formattedMessages,
          ...bookingNotifications,
          ...tradeNotifications,
        ];

        combined.sort(
          (first, second) =>
            new Date(second.rawTime || second.time) -
            new Date(first.rawTime || first.time),
        );

        setNotifications(combined);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      } finally {
        setLoading(false);
      }
    },
    [formatTime, fetchBookingNotifications, fetchTradeNotifications],
  );

  useEffect(() => {
    if (!user) return;

    const loadNotifications = async () => {
      await fetchNotifications(user);
    };

    loadNotifications();
  }, [user, fetchNotifications, showToast]);

  useEffect(() => {
    if (!user) return;

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
          showToast("New message received.");

          if (Notification.permission === "granted") {
            new Notification("New Message", {
              body: "You received a new marketplace message.",
            });
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          await fetchNotifications(user);
          showToast(payload.new?.title || "New trade notification.");
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "facility_bookings",
        },
        async (payload) => {
          if (payload.new.student_id !== user.id) return;
          if (!["collection", "drop_off"].includes(payload.new.booking_type)) {
            return;
          }

          await fetchNotifications(user);

          const type =
            payload.new.booking_type === "collection"
              ? "Collection"
              : "Drop-off";

          showToast(`${type} booking updated.`);

          if (Notification.permission === "granted") {
            new Notification(`${type} Booking Updated`, {
              body: "Your booking has been updated.",
            });
          }
        },
      )
      .subscribe();

    if (Notification.permission !== "granted") {
      Notification.requestPermission();
    }

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchNotifications, showToast]);

  const markAllAsRead = async () => {
    try {
      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("receiver_id", user.id)
        .eq("is_read", false);

      const tradeUnreadIds = notifications
        .filter(
          (notification) =>
            notification.category === "trade" && !notification.is_read,
        )
        .map((notification) => notification.notificationId)
        .filter(Boolean);

      if (tradeUnreadIds.length > 0) {
        await Promise.all(
          tradeUnreadIds.map((id) =>
            fetch(`${API_BASE_URL}/api/payments/notifications/${id}/read`, {
              method: "PATCH",
            }),
          ),
        );
      }

      const bookingIds = notifications
        .filter((notification) => notification.type === "booking")
        .map((notification) => notification.id);

      saveStoredBookingReads(bookingIds);
      await fetchNotifications(user);
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };

  const openNotification = async (notification) => {
    try {
      if (notification.type === "message") {
        await supabase
          .from("messages")
          .update({ is_read: true })
          .eq("id", notification.id);

        navigate(
          `/chat/${notification.listing_id}?seller=${notification.sender_id}`,
        );
        return;
      }

      if (notification.category === "trade") {
        if (!notification.is_read && notification.notificationId) {
          await fetch(
            `${API_BASE_URL}/api/payments/notifications/${notification.notificationId}/read`,
            { method: "PATCH" },
          );
        }

        if (notification.relatedTransactionId) {
          if (notification.type === "sale") {
            navigate("/student-dashboard", { state: { tab: "my-sales" } });
          } else {
            navigate("/student-dashboard", { state: { tab: "my-purchases" } });
          }
        }

        setNotifications((previous) =>
          previous.map((entry) =>
            entry.id === notification.id ? { ...entry, is_read: true } : entry,
          ),
        );

        return;
      }

      if (notification.type === "booking") {
        const existing = getStoredBookingReads();

        if (!existing.includes(notification.id)) {
          saveStoredBookingReads([...existing, notification.id]);
        }

        setNotifications((previous) =>
          previous.map((entry) =>
            entry.id === notification.id ? { ...entry, is_read: true } : entry,
          ),
        );
      }
    } catch (error) {
      console.error("Error opening notification:", error);
    }
  };

  const unread = notifications.filter((notification) => !notification.is_read);
  const read = notifications.filter((notification) => notification.is_read);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6">
        <article className="rounded-2xl border border-gray-200 bg-white px-6 py-6 text-center shadow-sm">
          <p className="text-base font-semibold text-gray-800">
            Loading notifications...
          </p>
        </article>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 sm:py-8">
      {toastMessage ? (
        <aside
          role="status"
          aria-live="polite"
          className="fixed right-4 top-4 z-50 rounded-xl bg-slate-900 px-4 py-3 text-sm text-white shadow-lg"
        >
          {toastMessage}
        </aside>
      ) : null}
      <article className="mx-auto max-w-4xl">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <section>
            <p>
              <button
                type="button"
                onClick={() => navigate("/student-dashboard")}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
              >
                Back
              </button>
            </p>
            <h1 className="mt-4 text-2xl font-bold sm:text-3xl">
              Notifications
            </h1>
          </section>

          {unread.length > 0 ? (
            <button
              onClick={markAllAsRead}
              className="rounded-xl bg-blue-600 px-4 py-2 text-white"
            >
              Mark all as read
            </button>
          ) : null}
        </header>

        {unread.length > 0 ? (
          <section>
            <h2 className="mb-2 font-bold">Unread</h2>

            {unread.map((notification) => (
              <article key={notification.id} className="mb-3">
                <button
                  onClick={() => openNotification(notification)}
                  className="w-full rounded-lg border p-4 text-left"
                >
                  <section className="flex items-start gap-3">
                    <p className="shrink-0 rounded-full bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
                      {getNotificationIcon(notification.type)}
                    </p>

                    <section className="min-w-0">
                      <p className="font-semibold">{notification.title}</p>
                      <p className="whitespace-pre-line text-sm">
                        {notification.description}
                      </p>
                      <p className="text-xs text-gray-400">
                        {notification.time}
                      </p>
                    </section>
                  </section>
                </button>
              </article>
            ))}
          </section>
        ) : null}

        {read.length > 0 ? (
          <section className="mt-6">
            <h2 className="mb-2 font-bold">Read</h2>

            {read.map((notification) => (
              <article key={notification.id} className="mb-3">
                <button
                  onClick={() => openNotification(notification)}
                  className="w-full rounded-lg border p-4 text-left opacity-70"
                >
                  <section className="flex items-start gap-3">
                    <p className="shrink-0 rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
                      {getNotificationIcon(notification.type)}
                    </p>

                    <section className="min-w-0">
                      <p className="font-semibold">{notification.title}</p>
                      <p className="whitespace-pre-line text-sm">
                        {notification.description}
                      </p>
                      <p className="text-xs text-gray-400">
                        {notification.time}
                      </p>
                    </section>
                  </section>
                </button>
              </article>
            ))}
          </section>
        ) : null}
      </article>
    </main>
  );
}
