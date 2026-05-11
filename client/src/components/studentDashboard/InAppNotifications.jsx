// src/components/studentDashboard/InAppNotifications.jsx
// In-dashboard notifications tab — shows sale, purchase, dropoff, and message notifications.
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../config/supabaseClient";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

const TYPE_ICON = {
  sale: "💰",
  purchase: "🛍️",
  dropoff: "📦",
  collection: "✅",
  message: "💬",
  system: "🔔",
};

export default function InAppNotifications({ profileId }) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!profileId) return;
    try {
      const res = await fetch(
        `${API_URL}/api/payments/notifications/${profileId}`,
      );
      const data = await res.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    let active = true;

    const loadNotifications = async () => {
      if (!profileId) {
        if (active) setLoading(false);
        return;
      }

      try {
        const res = await fetch(
          `${API_URL}/api/payments/notifications/${profileId}`,
        );
        const data = await res.json();
        if (active) setNotifications(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadNotifications();

    return () => {
      active = false;
    };
  }, [profileId]);

  // Realtime — listen for new notifications inserted for this user
  useEffect(() => {
    if (!profileId) return;

    const channel = supabase
      .channel("in-app-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${profileId}`,
        },
        () => {
          fetchNotifications();
        },
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [profileId, fetchNotifications]);

  const markAsRead = async (id) => {
    await fetch(`${API_URL}/api/payments/notifications/${id}/read`, {
      method: "PATCH",
    });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    );
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter((n) => !n.is_read);
    await Promise.all(
      unread.map((n) =>
        fetch(`${API_URL}/api/payments/notifications/${n.id}/read`, {
          method: "PATCH",
        }),
      ),
    );
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const handleClick = async (notification) => {
    if (!notification.is_read) await markAsRead(notification.id);
    // Navigate to related transaction if available
    if (notification.related_transaction_id) {
      if (notification.type === "sale")
        navigate("/student-dashboard", { state: { tab: "my-sales" } });
      else if (
        notification.type === "purchase" ||
        notification.type === "dropoff"
      )
        navigate("/student-dashboard", { state: { tab: "my-purchases" } });
    }
  };

  const unread = notifications.filter((n) => !n.is_read);
  const read = notifications.filter((n) => n.is_read);

  if (loading)
    return (
      <p className="text-sm text-slate-400 py-4">Loading notifications…</p>
    );

  return (
    <section aria-label="Notifications">
      <header className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-[#0D1B4B]">Notifications</h2>
        {unread.length > 0 && (
          <button
            type="button"
            onClick={markAllAsRead}
            className="text-xs text-[#1C3FAA] font-semibold hover:underline cursor-pointer"
          >
            Mark all as read
          </button>
        )}
      </header>

      {notifications.length === 0 && (
        <article className="text-center py-12 bg-white rounded-2xl border border-slate-200">
          <p className="text-4xl mb-3">🔔</p>
          <p className="text-sm font-semibold text-slate-600">
            No notifications yet
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Sale and purchase updates will appear here
          </p>
        </article>
      )}

      {unread.length > 0 && (
        <section className="mb-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
            Unread
          </h3>
          <ul className="flex flex-col gap-2 list-none p-0 m-0">
            {unread.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => handleClick(n)}
                  className="w-full text-left bg-blue-50 border border-blue-100 rounded-2xl px-4 py-4 hover:bg-blue-100 transition-colors cursor-pointer"
                >
                  <article className="flex items-start gap-3">
                    <p className="text-2xl" role="img" aria-label={n.type}>
                      {TYPE_ICON[n.type] || "🔔"}
                    </p>
                    <section className="flex-1">
                      <h4 className="text-sm font-semibold text-[#0D1B4B]">
                        {n.title}
                      </h4>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {n.message}
                      </p>
                      <time className="text-xs text-slate-400 mt-1 block">
                        {new Date(n.created_at).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </time>
                    </section>
                  </article>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {read.length > 0 && (
        <section>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
            Earlier
          </h3>
          <ul className="flex flex-col gap-2 list-none p-0 m-0">
            {read.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => handleClick(n)}
                  className="w-full text-left bg-white border border-slate-200 rounded-2xl px-4 py-4 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <article className="flex items-start gap-3">
                    <p
                      className="text-2xl opacity-50"
                      role="img"
                      aria-label={n.type}
                    >
                      {TYPE_ICON[n.type] || "🔔"}
                    </p>
                    <section className="flex-1">
                      <h4 className="text-sm font-medium text-slate-600">
                        {n.title}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {n.message}
                      </p>
                      <time className="text-xs text-slate-400 mt-1 block">
                        {new Date(n.created_at).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </time>
                    </section>
                  </article>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </section>
  );
}
