import { useState, useEffect, useCallback } from "react";
import { supabase } from "../config/supabaseClient";

function Chat({ senderId, receiverId }) {
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);

  // ✅ FIX: wrap in useCallback
  const loadMessages = useCallback(async () => {
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
  }, [senderId, receiverId]); // ✅ dependencies here

  // ✅ FIXED useEffect
  useEffect(() => {
    if (receiverId) {
      loadMessages();
    }
  }, [receiverId, loadMessages]); // ✅ include loadMessages

  // 📤 Send message
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

    if (error) {
      console.log("INSERT ERROR:", error.message);
    } else {
      setText("");
      loadMessages(); // ✅ safe now
    }
  };
}