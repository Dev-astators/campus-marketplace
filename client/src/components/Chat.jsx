import { useEffect, useRef } from "react";

export default function Chat({
  messages,
  currentUserId,
  input,
  setInput,
  onSend,
}) {
  const bottomRef = useRef(null);

  // Auto-scroll to newest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatTime = (dateString) => {
    if (!dateString) return "";

    return new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSend();
  };

  return (
    <section className="h-full bg-white/90 backdrop-blur border border-gray-200 rounded-3xl shadow-sm overflow-hidden flex flex-col">
      <header className="px-5 py-4 border-b border-gray-200 bg-white">
        <h2 className="text-lg font-bold text-gray-900">Conversation</h2>

        <p className="text-sm text-gray-500 mt-1">
          Continue your conversation about this listing.
        </p>
      </header>

      <section className="flex-1 overflow-y-auto px-5 py-5 bg-gray-50">
        {messages.length === 0 ? (
          <article className="h-full flex flex-col items-center justify-center text-center px-4">
            <p className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-3xl mb-4">
              💬
            </p>

            <h3 className="text-lg font-bold text-gray-800">
              No messages yet
            </h3>

            <p className="text-sm text-gray-500 mt-2 max-w-sm">
              Start the conversation by sending a message about this listing.
            </p>
          </article>
        ) : (
          <ol className="space-y-3">
            {messages.map((msg) => {
              const isMe = msg.sender_id === currentUserId;

              return (
                <li
                  key={msg.id}
                  className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <article
                    className={`max-w-[78%] rounded-2xl px-4 py-3 shadow-sm ${
                      isMe
                        ? "bg-blue-600 text-white rounded-br-md"
                        : "bg-white text-gray-800 border border-gray-200 rounded-bl-md"
                    }`}
                  >
                    <p className="text-sm leading-6 break-words">
                      {msg.content}
                    </p>

                    {/* ───────────────────────────── */}
                    {/* TIME + TICKS */}
                    <footer className="mt-2 flex items-center justify-end gap-2">
                      <time
                        dateTime={msg.sent_at || undefined}
                        className={`text-xs ${
                          isMe ? "text-blue-100" : "text-gray-400"
                        }`}
                      >
                        {formatTime(msg.sent_at)}
                      </time>

                      {/* ✔ / ✔✔ TICKS */}
                      {isMe && (
                        <span
                          className={`text-xs ${
                            msg.status === "read"
                              ? "text-blue-200"
                              : "text-blue-100"
                          }`}
                        >
                          {msg.status === "read" ? "✔✔" : "✔"}
                        </span>
                      )}
                    </footer>
                  </article>
                </li>
              );
            })}

            <li ref={bottomRef} aria-hidden="true" />
          </ol>
        )}
      </section>

      <footer className="border-t border-gray-200 bg-white px-4 py-4">
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <label htmlFor="chat-message" className="sr-only">
            Type your message
          </label>

          <input
            id="chat-message"
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />

          <button
            type="submit"
            disabled={!input.trim()}
            className="px-5 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
          >
            Send
          </button>
        </form>
      </footer>
    </section>
  );
}