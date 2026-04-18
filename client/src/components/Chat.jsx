import { useState, useEffect } from "react";
import { supabase } from "../config/supabaseClient";

function Chat({ senderId, receiverId }) {
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);

  // 📥 Load messages between 2 users
  const loadMessages = async () => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${senderId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${senderId})`
      )
      .order("sent_at", { ascending: true });

    if (error) {
      console.log("LOAD ERROR:", error.message);
    } else {
      setMessages(data || []);
    }
  };

  // 📤 Send message
  const sendMessage = async () => {
    if (!text.trim()) {
      alert("Message is empty");
      return;
    }

    const { error } = await supabase.from("messages").insert([
      {
        sender_id: senderId,
        receiver_id: receiverId,
        content: text,
        is_read: false,
        sent_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.log("INSERT ERROR:", error.message);
      alert(error.message);
    } else {
      setText("");
      loadMessages();
    }
  };

  // 🔁 Reload when switching users
  useEffect(() => {
    if (receiverId) {
      loadMessages();
    }
  }, [receiverId]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      
      {/* 💬 Messages */}
      <div style={{ flex: 1, overflowY: "auto", marginBottom: 10 }}>
        {messages.length === 0 && <p>No messages yet</p>}

        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              marginBottom: 10,
              textAlign: msg.sender_id === senderId ? "right" : "left",
            }}
          >
            <div
              style={{
                display: "inline-block",
                padding: 10,
                borderRadius: 10,
                backgroundColor:
                  msg.sender_id === senderId ? "#DCF8C6" : "#eee",
              }}
            >
              {msg.content}
            </div>

            <br />

            <small>
              {msg.sent_at
                ? new Date(msg.sent_at).toLocaleString()
                : ""}
            </small>

            {msg.sender_id === senderId && (
              <small style={{ marginLeft: 10 }}>
                {msg.is_read ? "✔✔ Seen" : "✔ Sent"}
              </small>
            )}
          </div>
        ))}
      </div>

      {/* ✍️ Input */}
      <div style={{ display: "flex", gap: 10 }}>
        <input
          placeholder="Type message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{ flex: 1, padding: 10 }}
        />

        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}

export default Chat;