import { useEffect, useState } from 'react';
import { supabase } from '../config/supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function MessagesPage() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  // ─────────────────────────────
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user);
    };
    getUser();
  }, []);

  // ─────────────────────────────
  useEffect(() => {
    if (!user) return;

    const fetchConversations = async () => {
      try {
        // 🔥 Get messages + listing + profiles
        const { data, error } = await supabase
          .from('messages')
          .select(`
            *,
            listing:listings(title),
            sender:profiles!messages_sender_id_fkey(full_name),
            receiver:profiles!messages_receiver_id_fkey(full_name)
          `)
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .order('sent_at', { ascending: false });

        if (error) throw error;

        // 🔥 GROUP CONVERSATIONS
        const grouped = {};

        data.forEach((msg) => {
          const isSender = msg.sender_id === user.id;

          const otherUserId = isSender
            ? msg.receiver_id
            : msg.sender_id;

          const otherUserName = isSender
            ? msg.receiver?.full_name
            : msg.sender?.full_name;

          const key = `${msg.listing_id}-${otherUserId}`;

          if (!grouped[key]) {
            grouped[key] = {
              listing_id: msg.listing_id,
              listing_title: msg.listing?.title,
              otherUserId,
              otherUserName,
              lastMessage: msg.content,
              sent_at: msg.sent_at,
            };
          }
        });

        setConversations(Object.values(grouped));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [user]);

  // ─────────────────────────────
  const openChat = (conv) => {
    navigate(`/chat/${conv.listing_id}?seller=${conv.otherUserId}`);
  };

  // ─────────────────────────────
  if (loading) return <p className="p-6">Loading...</p>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold mb-6">Messages</h1>

      {conversations.length === 0 ? (
        <p className="text-gray-500">No conversations yet.</p>
      ) : (
        <div className="space-y-3">
          {conversations.map((conv, i) => (
            <div
              key={i}
              onClick={() => openChat(conv)}
              className="bg-white p-4 rounded-xl border hover:shadow cursor-pointer transition"
            >
              {/* Listing */}
              <p className="text-xs text-blue-600 font-medium">
                {conv.listing_title}
              </p>

              {/* User */}
              <p className="text-sm font-semibold text-gray-800">
                {conv.otherUserName}
              </p>

              {/* Last message */}
              <p className="text-sm text-gray-600 truncate">
                {conv.lastMessage}
              </p>

              {/* Time */}
              <p className="text-xs text-gray-400 mt-1">
                {new Date(conv.sent_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}