import { useEffect, useRef } from "react";

export default function Chat({
  messages,
  currentUserId,
  input,
  setInput,
  onSend,
  conversationName,
  listing,
}) {
  const bottomRef = useRef(null);

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
    <section className="h-full bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden flex flex-col">
      {/* Chat Header */}
      <header className="px-6 py-5 border-b border-gray-200 bg-white">
        <section className="flex items-center gap-4">
          <p className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold">
            {conversationName?.charAt(0)?.toUpperCase() || "U"}
          </p>

          <section>
            <h2 className="text-lg font-bold text-gray-900">
              {conversationName || "Unknown user"}
            </h2>

            <p className="text-sm text-blue-700 font-semibold mt-1">
              {listing?.title || "Loading listing..."}
            </p>

            {listing?.price !== undefined && listing?.price !== null && (
              <p className="text-sm text-gray-600 mt-1">
                R{Number(listing.price).toFixed(2)}
              </p>
            )}
          </section>
        </section>
      </header>

      {/* Messages Area */}
      <section className="flex-1 overflow-y-auto px-6 py-6 bg-[#f7f9fc]">
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
          <ol className="space-y-5">
            {messages.map((msg) => {
              const isMe = msg.sender_id === currentUserId;

              return (
                <li
                  key={msg.id}
                  className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                >
                  {!isMe && (
                    <p className="mr-3 mt-1 w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-sm font-bold">
                      {conversationName?.charAt(0)?.toUpperCase() || "U"}
                    </p>
                  )}

                  <article
                    className={`max-w-[72%] rounded-2xl px-4 py-3 shadow-sm ${
                      isMe
                        ? "bg-blue-700 text-white rounded-br-md"
                        : "bg-white text-gray-800 border border-gray-200 rounded-bl-md"
                    }`}
                  >
                    <p className="text-sm leading-6 break-words">
                      {msg.content}
                    </p>

                    <footer className="mt-2 flex items-center justify-end gap-2">
                      <time
                        dateTime={msg.sent_at || undefined}
                        className={`text-xs ${
                          isMe ? "text-blue-100" : "text-gray-400"
                        }`}
                      >
                        {formatTime(msg.sent_at)}
                      </time>

                      {isMe && (
                        <output
                          className={`text-xs ${
                            msg.status === "read"
                              ? "text-blue-200"
                              : "text-blue-100"
                          }`}
                        >
                          {msg.status === "read" ? "✔✔" : "✔"}
                        </output>
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

      {/* Input Area */}
      <footer className="border-t border-gray-200 bg-white px-5 py-4">
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <label htmlFor="chat-message" className="sr-only">
            Type your message
          </label>

          <button
            type="button"
            className="hidden sm:flex w-12 h-12 items-center justify-center rounded-xl border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 transition"
            aria-label="Attach file"
          >
            📎
          </button>

          <input
            id="chat-message"
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-white"
          />

          <button
            type="submit"
            disabled={!input.trim()}
            className="px-8 py-3 rounded-xl bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
          >
            Send
          </button>
        </form>
      </footer>
    </section>
  );
}
