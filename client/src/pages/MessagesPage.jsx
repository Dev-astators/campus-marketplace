import { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/studentDashboard/Navbar';
import { supabase } from '../config/supabaseClient';

export default function MessagesPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [chats, setChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [newMessage, setNewMessage] = useState('');

  // ─────────────────────────────
  // GET USER (same as ChatPage dependency)
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getSession();
      setCurrentUser(data.session?.user || null);
    };
    getUser();
  }, []);

  // ─────────────────────────────
  // FETCH CHATS (FORCED CHAT-LIKE BEHAVIOR)
  useEffect(() => {
    const fetchChats = async () => {
      if (!currentUser) return;

      // 1. MESSAGES (same as Chat.jsx logic base)
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
        .or(
          `sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`
        )
        .order('sent_at', { ascending: true });

      if (error) {
        console.error(error.message);
        return;
      }

      if (!messages?.length) return;

      // ─────────────────────────────
      // 2. FORCE CHATPAGE STYLE SELLER LOOKUP
      const sellerIds = [
        ...new Set(messages.map(m => m.listings?.seller_id).filter(Boolean))
      ];

      const userIds = [
        ...new Set([
          ...messages.flatMap(m => [m.sender_id, m.receiver_id]),
          ...sellerIds
        ])
      ];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('auth_user_id, full_name')
        .in('auth_user_id', userIds);

      const profileMap = new Map(
        (profiles || []).map(p => [p.auth_user_id, p.full_name])
      );

      // ─────────────────────────────
      // CHAT GROUPING (Chat.jsx style grouping logic)
      const chatsMap = {};

      messages.forEach(msg => {
        const listing = msg.listings;

        if (!listing) return;

        // FORCE seller as primary chat identity (ChatPage behavior)
        const sellerId = listing.seller_id;

        const otherUserId =
          msg.sender_id === currentUser.id
            ? msg.receiver_id
            : msg.sender_id;

        // chat key = listing-based (same conversation scope as Chat.jsx)
        const chatKey = listing.id;

        // FORCE name priority:
        // 1. seller name (ChatPage style)
        // 2. other user
        const chatPartnerName =
          profileMap.get(sellerId) ||
          profileMap.get(otherUserId) ||
          'Unknown User';

        if (!chatsMap[chatKey]) {
          chatsMap[chatKey] = {
            id: chatKey,
            listingId: listing.id,
            listingTitle: listing.title,

            sellerId: sellerId,
            chatPartnerId: sellerId, // FORCE seller dependency like ChatPage
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
      });

      setChats(Object.values(chatsMap));
      setSelectedChatId(Object.keys(chatsMap)[0] || null);
    };

    fetchChats();
  }, [currentUser]);

  // ─────────────────────────────
  const selectedChat = useMemo(
    () => chats.find(c => c.id === selectedChatId),
    [chats, selectedChatId]
  );

  // ─────────────────────────────
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

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar user={currentUser} />

      <main className="flex-1 px-6 py-6">
        <div className="bg-white border rounded-2xl h-[calc(100vh-120px)] flex">

          {/* LEFT */}
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

          {/* RIGHT */}
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
      </main>
    </div>
  );
}