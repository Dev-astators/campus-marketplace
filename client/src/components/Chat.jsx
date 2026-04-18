import { useState, useEffect } from "react";
import { supabase } from "../config/supabaseClient";

function Chat({ senderId, receiverId }) {
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);

  // ✅ CLEAN: no external function
  useEffect(() => {
    if (!receiverId) return;

    const loadMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${senderId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${senderId})`
        )
        .order("sent_at", { ascending: true });

      if (error) {
        console.log(error.message);
      } else {
        setMessages(data || []);
      }
    };

    loadMessages();
  }, [receiverId, senderId]);

  // ✅ USED function
  const sendMessage = async () => {
    if (!text.trim()) return;

    const { error } = await supabase.from("messages").insert([
      {
        sender_id: senderId,
        receiver_id: receiverId,
        content: text,
        listing_id: null,
        is_read: false,
        sent_at: new Date().toISOString(),
      },
    ]);

    if (!error) {
      setText("");

      // reload after send
      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${senderId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${senderId})`
        )
        .order("sent_at", { ascending: true });

      setMessages(data || []);
    }
  };

  // ✅ USING messages + sendMessage
  return (
    <div>
      <div>
        {messages.map((msg) => (
          <p key={msg.id}>
            {msg.sender_id === senderId ? "You: " : "Them: "}
            {msg.content}
          </p>
        ))}
      </div>

      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <button onClick={sendMessage}>Send</button>
    </div>
  );
}

// ✅ REQUIRED EXPORT
export default Chat;