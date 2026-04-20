import { useEffect, useState } from 'react';
import { supabase } from '../config/supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function MessagesPage() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user);
    };
    getUser();
  }, []);

  useEffect(() => {
    if (!user) return;

      const { data: messages, error } = await supabase
        .from('messages')
        .select(`
          id,
          listing_id,
          sender_id,
          receiver_id,
          content,
          sent_at,
          listings (
            id,
            title,
            seller_id
          )
        `)
        .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
        .order('sent_at', { ascending: true });

      if (error) {
        console.error("MESSAGES ERROR:", error.message);
        return;
      }

        // 🔥 GROUP CONVERSATIONS
        const grouped = {};

      // 🔥 Collect ALL user IDs
      const userIds = [
        ...new Set(
          messages.flatMap(m => [
            m.sender_id,
            m.receiver_id,
            m.listings?.seller_id
          ])
        )
      ];

      // 🔥 Fetch profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('auth_user_id, full_name, email, username')
        .in('auth_user_id', userIds);

      // 🔥 Create map
      const profileMap = new Map(
        (profiles || []).map(p => [
          p.auth_user_id,
          p.full_name || p.username || p.email || null
        ])
      );

      const chatsMap = {};

      messages.forEach(msg => {
        const listing = msg.listings;
        if (!listing) return;

        const sellerId = listing.seller_id;

        const otherUserId =
          msg.sender_id === currentUser.id
            ? msg.receiver_id
            : msg.sender_id;

        const isCurrentUserSeller = currentUser.id === sellerId;

        const chatPartnerId = isCurrentUserSeller
          ? otherUserId
          : sellerId;

        // 🔥 SMART FALLBACK FIX
        let chatPartnerName = profileMap.get(chatPartnerId);

        if (!chatPartnerName) {
          chatPartnerName = `User (${chatPartnerId.slice(0, 6)})`;
        }

        const chatKey = `${listing.id}-${chatPartnerId}`;

        if (!chatsMap[chatKey]) {
          chatsMap[chatKey] = {
            id: chatKey,
            listingId: listing.id,
            listingTitle: listing.title,
            chatPartnerId,
            chatPartnerName,
            messages: [],
          };
        }

        chatsMap[chatKey].messages.push({
          id: msg.id,
          senderId: msg.sender_id,
          content: msg.content,
          sentAt: new Date(msg.sent_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        });

      const chatsArray = Object.values(chatsMap);

      setChats(chatsArray);
      setSelectedChatId(chatsArray[0]?.id || null);
    };

    fetchConversations();
  }, [user]);

  const selectedChat = useMemo(
    () => chats.find(c => c.id === selectedChatId),
    [chats, selectedChatId]
  );

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;

    await supabase.from('messages').insert([
      {
        sender_id: currentUser.id,
        receiver_id: selectedChat.chatPartnerId,
        content: newMessage,
        listing_id: selectedChat.listingId,
        sent_at: new Date().toISOString(),
      },
    ]);

    setNewMessage('');
    window.location.reload();
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

          <aside className="w-[320px] border-r overflow-y-auto">
            <div className="p-4 border-b">
              <h1 className="text-xl font-bold">Messages</h1>
            </div>

            {chats.map(chat => (
              <button
                key={chat.id}
                onClick={() => setSelectedChatId(chat.id)}
                className="w-full text-left p-4 hover:bg-gray-50 border-b"
              >
                <p className="font-semibold">
                  👤 {chat.chatPartnerName}
                </p>
                <p className="text-xs text-gray-500">
                  📦 {chat.listingTitle}
                </p>
              </button>
            ))}
          </aside>

          <section className="flex-1 flex flex-col">
            {selectedChat && (
              <>
                <div className="p-4 border-b">
                  <h2 className="font-bold">
                    👤 {selectedChat.chatPartnerName}
                  </h2>
                  <p className="text-sm text-gray-500">
                    📦 {selectedChat.listingTitle}
                  </p>
                </div>

                <div className="flex-1 p-4 overflow-y-auto">
                  {selectedChat.messages.map(msg => (
                    <div key={msg.id} className="mb-2">
                      <b>
                        {msg.senderId === currentUser.id
                          ? 'You'
                          : selectedChat.chatPartnerName}
                        :
                      </b>{' '}
                      {msg.content}
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendMessage} className="p-4 flex gap-2">
                  <input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type message..."
                    className="flex-1 border p-2 rounded"
                  />
                  <button className="bg-blue-600 text-white px-4 rounded">
                    Send
                  </button>
                </form>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}