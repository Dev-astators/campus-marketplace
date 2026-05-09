const NOTIFICATIONS = [
  {
    id: "n1",
    type: "message",
    title: "New message from Ayanda",
    description: 'About “MacBook Pro 14”',
    time: "2 minutes ago",
    unread: true,
  },
  {
    id: "n2",
    type: "listing",
    title: "Lerato is interested in your listing",
    description: 'Someone contacted you about “Desk Lamp”.',
    time: "12 minutes ago",
    unread: true,
  },
  {
    id: "n3",
    type: "booking",
    title: "Drop-off booked",
    description: "Your drop-off slot is booked for Friday at 10:00.",
    time: "Yesterday",
    unread: false,
  },
  {
    id: "n4",
    type: "payment",
    title: "Payment verified",
    description: 'Payment for “Computer Science Textbook” was verified.',
    time: "May 7",
    unread: false,
  },
  {
    id: "n5",
    type: "rating",
    title: "Rate your experience",
    description: "Tell us how your trade with Sipho went.",
    time: "May 6",
    unread: false,
  },
];

const getNotificationIcon = (type) => {
  if (type === "message") return "💬";
  if (type === "listing") return "🏷️";
  if (type === "booking") return "📦";
  if (type === "payment") return "💳";
  if (type === "rating") return "⭐";
  return "🔔";
};

export default function NotificationsPage() {
  const unreadNotifications = NOTIFICATIONS.filter(
    (notification) => notification.unread,
  );

  const earlierNotifications = NOTIFICATIONS.filter(
    (notification) => !notification.unread,
  );

  return (
    <main
      className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 px-4 py-8 sm:px-6 lg:px-8"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      <section className="max-w-4xl mx-auto">
        <header className="mb-8 flex items-center justify-between gap-4">
          <section>
            <h1 className="text-3xl font-bold text-gray-900">
              Notifications
            </h1>

            <p className="text-sm text-gray-500 mt-2">
              Stay updated on messages, listings, bookings and payments.
            </p>
          </section>

          <figure className="hidden sm:flex w-12 h-12 rounded-2xl bg-blue-600 items-center justify-center shadow-sm text-white text-xl">
            🔔
            <figcaption className="sr-only">Notifications icon</figcaption>
          </figure>
        </header>

        <section className="bg-white/90 backdrop-blur border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
          {NOTIFICATIONS.length === 0 ? (
            <article className="px-6 py-16 text-center">
              <p className="mx-auto w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4 text-3xl">
                🔔
              </p>

              <h2 className="text-xl font-bold text-gray-800">
                No notifications yet
              </h2>

              <p className="text-sm text-gray-500 mt-2">
                Updates about your messages, listings and bookings will appear
                here.
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
                        <article className="px-5 py-5 hover:bg-blue-50/60 transition">
                          <section className="flex items-start gap-4">
                            <p className="shrink-0 w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-xl">
                              {getNotificationIcon(notification.type)}
                            </p>

                            <section className="min-w-0 flex-1">
                              <header className="flex items-start justify-between gap-3">
                                <h3 className="text-base font-semibold text-gray-900">
                                  {notification.title}
                                </h3>

                                <time className="text-xs text-gray-400 shrink-0">
                                  {notification.time}
                                </time>
                              </header>

                              <p className="text-sm text-gray-600 mt-1">
                                {notification.description}
                              </p>
                            </section>

                            <p
                              className="shrink-0 w-2.5 h-2.5 rounded-full bg-blue-600 mt-2"
                              aria-label="Unread notification"
                            />
                          </section>
                        </article>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {earlierNotifications.length > 0 && (
                <section>
                  <header className="px-5 py-4 bg-gray-50">
                    <h2 className="text-sm font-bold text-gray-700">
                      Earlier
                    </h2>
                  </header>

                  <ul className="divide-y divide-gray-100">
                    {earlierNotifications.map((notification) => (
                      <li key={notification.id}>
                        <article className="px-5 py-5 hover:bg-gray-50 transition">
                          <section className="flex items-start gap-4">
                            <p className="shrink-0 w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-xl">
                              {getNotificationIcon(notification.type)}
                            </p>

                            <section className="min-w-0 flex-1">
                              <header className="flex items-start justify-between gap-3">
                                <h3 className="text-base font-semibold text-gray-800">
                                  {notification.title}
                                </h3>

                                <time className="text-xs text-gray-400 shrink-0">
                                  {notification.time}
                                </time>
                              </header>

                              <p className="text-sm text-gray-600 mt-1">
                                {notification.description}
                              </p>
                            </section>
                          </section>
                        </article>
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