import { useEffect, useRef } from "react";

export default function Chat({
  messages,
  currentUserId,
  input,
  setInput,
  onSend,
}) {
  const bottomRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <section
      className="flex flex-col h-full border rounded-xl bg-white"
      aria-label="Chat thread"
    >
      {/* Messages */}
      <ul className="flex-1 overflow-y-auto p-4 space-y-2" role="list">
        {messages.map((msg) => {
          const isMe = msg.sender_id === currentUserId;

          return (
            <li
              key={msg.id}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              <p
                className={`px-4 py-2 rounded-xl text-sm max-w-xs wrap-break-word
                  ${
                    isMe
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-900"
                  }`}
              >
                {msg.content}
              </p>
            </li>
          );
        })}
        <li ref={bottomRef} aria-hidden="true" />
      </ul>

      {/* Input */}
      <footer className="border-t p-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        />

        <button
          type="button"
          onClick={onSend}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
        >
          Send
        </button>
      </footer>
    </section>
  );
}
