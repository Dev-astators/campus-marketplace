import { useState, useEffect } from "react";
import { supabase } from "../config/supabaseClient";

function Chat({ senderId, receiverId, listingId }) {
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!receiverId || !listingId) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("listing_id", listingId)
        .or(
          `and(sender_id.eq.${senderId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${senderId})`
        )
        .order("sent_at", { ascending: true });

      if (!error) setMessages(data || []);
      else console.log(error.message);
    };

    fetchMessages();
  }, [receiverId, senderId, listingId]);

  const sendMessage = async () => {
    if (!text.trim()) return;

    const { error } = await supabase.from("messages").insert([
      {
        sender_id: senderId,
        receiver_id: receiverId,
        content: text,
        listing_id: listingId,
        is_read: false,
        sent_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.log(error.message);
      return;
    }

    setText("");

    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("listing_id", listingId)
      .or(
        `and(sender_id.eq.${senderId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${senderId})`
      )
      .order("sent_at", { ascending: true });

    setMessages(data || []);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      
      <div style={{ flex: 1, overflowY: "auto", padding: "10px", background: "#f5f5f5" }}>
        {messages.length === 0 && <p>No messages yet</p>}

        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              marginBottom: "10px",
              textAlign: msg.sender_id === senderId ? "right" : "left",
            }}
          >
            <div
              style={{
                display: "inline-block",
                padding: "10px",
                borderRadius: "10px",
                backgroundColor:
                  msg.sender_id === senderId ? "#DCF8C6" : "#ffffff",
                maxWidth: "70%",
              }}
            >
              {msg.content}
            </div>

            <br />
            <small style={{ fontSize: "10px" }}>
              {msg.sent_at
                ? new Date(msg.sent_at).toLocaleTimeString()
                : ""}
            </small>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "10px", padding: "10px", borderTop: "1px solid #ccc" }}>
        <input
          type="text"
          placeholder="Type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{ flex: 1, padding: "10px", borderRadius: "20px", border: "1px solid #ccc" }}
        />

        <button
          onClick={sendMessage}
          style={{
            padding: "10px 15px",
            borderRadius: "20px",
            background: "#25D366",
            color: "#fff",
            border: "none",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default Chat;