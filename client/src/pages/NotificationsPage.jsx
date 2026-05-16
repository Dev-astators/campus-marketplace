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

// ─────────────────────────────
// LOCAL STORAGE HELPERS
const getStoredBookingReads = () => {
  return JSON.parse(
    localStorage.getItem("read_booking_notifications") || "[]"
  );
};

const saveStoredBookingReads = (ids) => {
  localStorage.setItem(
    "read_booking_notifications",
    JSON.stringify(ids)
  );
};

export default function NotificationsPage() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // ─────────────────────────────
  // Format time
  const formatTime = useCallback((dateString) => {
    return new Date(dateString).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

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
  // Fetch booking notifications
  const fetchBookingNotifications = useCallback(
    async (currentUser) => {
      try {
        const { data, error } = await supabase
          .from("facility_bookings")
          .select(`
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
          `)
          .eq("student_id", currentUser.id)
          .in("booking_type", ["collection", "drop_off"])
          .order("confirmed_at", { ascending: false });

        if (error) throw error;

        const readBookingIds = getStoredBookingReads();

        const formattedBookings = (data || []).map((booking) => {
          const bookingNotificationId = `booking-${booking.id}`;

          const actionText =
            booking.booking_type === "collection"
              ? "Collect"
              : "Drop off";

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

            description: `
${actionText} "${
              booking.transaction?.listing?.title || "your item"
            }"
at ${booking.slot?.facility?.name || "facility"}
(${booking.slot?.facility?.location || "campus"})
on ${booking.slot?.slot_date}
at ${booking.slot?.slot_time}
            `,

            time: formatTime(
              booking.confirmed_at || new Date().toISOString()
            ),

            rawTime: booking.confirmed_at,

            // ✅ persistent read state using localStorage
            is_read: readBookingIds.includes(
              bookingNotificationId
            ),

            bookingData: booking,
          };
        });

        return formattedBookings;
      } catch (err) {
        console.error(
          "Error fetching booking notifications:",
          err
        );

        return [];
      }
    },
    [formatTime]
  );

  // ─────────────────────────────
  // Fetch notifications
  const fetchNotifications = useCallback(
    async (currentUser) => {
      try {
        // ─────────────────────────────
        // MESSAGE NOTIFICATIONS
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

            sender:profiles!messages_sender_id_fkey(
              full_name
            )
          `)
          .eq("receiver_id", currentUser.id)
          .neq("sender_id", currentUser.id)
          .order("sent_at", { ascending: false });

        if (error) throw error;

        const formattedMessages = (data || []).map((msg) => ({
          id: msg.id,

          type: "message",

          title: `New message from ${
            msg.sender?.full_name || "Unknown user"
          }`,

          description: msg.listing?.title
            ? `About "${msg.listing.title}"`
            : msg.content,

          time: formatTime(msg.sent_at),

          rawTime: msg.sent_at,

          listing_id: msg.listing_id,

          sender_id: msg.sender_id,

          is_read: msg.is_read ?? false,
        }));

        // ─────────────────────────────
        // BOOKING NOTIFICATIONS
        const bookingNotifications =
          await fetchBookingNotifications(currentUser);

        // ─────────────────────────────
        // COMBINE
        const combined = [
          ...formattedMessages,
          ...bookingNotifications,
        ];

        combined.sort(
          (a, b) =>
            new Date(b.rawTime || b.time) -
            new Date(a.rawTime || a.time)
        );

        setNotifications(combined);
      } catch (err) {
        console.error("Error fetching notifications:", err);
      } finally {
        setLoading(false);
      }
    },
    [formatTime, fetchBookingNotifications]
  );

  // ─────────────────────────────
  // Initial load
  useEffect(() => {
    if (!user) return;

    const loadNotifications = async () => {
      await fetchNotifications(user);
    };

    loadNotifications();
  }, [user, fetchNotifications]);

  // ─────────────────────────────
  // Realtime updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("notifications-realtime")

      // ─────────────────────────────
      // MESSAGES
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        async (payload) => {
          if (payload.new.receiver_id !== user.id)
            return;

          if (payload.new.sender_id === user.id)
            return;

          await fetchNotifications(user);

          if (Notification.permission === "granted") {
            new Notification("New Message", {
              body:
                "You received a new marketplace message.",
            });
          }
        }
      )

      // ─────────────────────────────
      // BOOKINGS
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "facility_bookings",
        },
        async (payload) => {
          if (payload.new.student_id !== user.id)
            return;

          if (
            !["collection", "drop_off"].includes(
              payload.new.booking_type
            )
          ) {
            return;
          }

          await fetchNotifications(user);

          const type =
            payload.new.booking_type === "collection"
              ? "Collection"
              : "Drop-off";

          if (Notification.permission === "granted") {
            new Notification(`${type} Booking Updated`, {
              body: "Your booking has been updated.",
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
  // Mark all message notifications as read
  const markAllAsRead = async () => {
    try {
      // messages → database
      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("receiver_id", user.id)
        .eq("is_read", false);

      // bookings → localStorage
      const bookingIds = notifications
        .filter((n) => n.type === "booking")
        .map((n) => n.id);

      saveStoredBookingReads(bookingIds);

      await fetchNotifications(user);
    } catch (err) {
      console.error(
        "Error marking notifications as read:",
        err
      );
    }
  };

  // ─────────────────────────────
  // Open notification
  const openNotification = async (notification) => {
    try {
      // ─────────────────────────────
      // MESSAGE
      if (notification.type === "message") {
        await supabase
          .from("messages")
          .update({ is_read: true })
          .eq("id", notification.id);

        navigate(
          `/chat/${notification.listing_id}?seller=${notification.sender_id}`
        );

        return;
      }

      // ─────────────────────────────
      // BOOKING
      if (notification.type === "booking") {
        const existing =
          getStoredBookingReads();

        if (!existing.includes(notification.id)) {
          saveStoredBookingReads([
            ...existing,
            notification.id,
          ]);
        }

        // update UI immediately
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id
              ? { ...n, is_read: true }
              : n
          )
        );

        return;
      }
    } catch (err) {
      console.error(
        "Error opening notification:",
        err
      );
    }
  };

  // ─────────────────────────────
  // Split
  const unread = notifications.filter(
    (n) => !n.is_read
  );

  const read = notifications.filter(
    (n) => n.is_read
  );

  // ─────────────────────────────
  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>Loading notifications...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-8">
      <section className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">
            Notifications
          </h1>

          {unread.length > 0 && (
            <button
              onClick={markAllAsRead}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl"
            >
              Mark all as read
            </button>
          )}
        </header>

        {/* UNREAD */}
        {unread.length > 0 && (
          <section>
            <h2 className="font-bold mb-2">
              Unread
            </h2>

            {unread.map((n) => (
              <button
                key={n.id}
                onClick={() => openNotification(n)}
                className="w-full text-left p-4 border rounded-lg mb-2"
              >
                <div className="flex gap-3">
                  <span>
                    {getNotificationIcon(n.type)}
                  </span>

                  <div>
                    <p className="font-semibold">
                      {n.title}
                    </p>

                    <p className="text-sm whitespace-pre-line">
                      {n.description}
                    </p>

                    <p className="text-xs text-gray-400">
                      {n.time}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </section>
        )}

        {/* READ */}
        {read.length > 0 && (
          <section className="mt-6">
            <h2 className="font-bold mb-2">
              Read
            </h2>

            {read.map((n) => (
              <button
                key={n.id}
                onClick={() => openNotification(n)}
                className="w-full text-left p-4 border rounded-lg mb-2 opacity-70"
              >
                <div className="flex gap-3">
                  <span>
                    {getNotificationIcon(n.type)}
                  </span>

                  <div>
                    <p className="font-semibold">
                      {n.title}
                    </p>

                    <p className="text-sm whitespace-pre-line">
                      {n.description}
                    </p>

                    <p className="text-xs text-gray-400">
                      {n.time}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </section>
        )}
      </section>
    </main>
  );
}