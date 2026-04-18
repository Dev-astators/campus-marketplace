// src/pages/MessagesPage.jsx

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/studentDashboard/Navbar';

const CURRENT_USER = {
  id: 'buyer-1',
  name: 'Nkosinathi Khumalo',
  avatarUrl: null,
};

const MOCK_CHATS = [
  {
    id: 'chat-1',
    listingId: 'listing-1',
    listingTitle: 'MacBook Pro 14"',
    sellerId: 'seller-1',
    sellerName: 'Ayanda Mokoena',
    sellerEmail: 'ayanda.mokoena@wits.ac.za',
    unread: true,
    messages: [
      {
        id: 'm1',
        senderId: 'buyer-1',
        receiverId: 'seller-1',
        content: 'Hi, is this still available?',
        sentAt: '09:10',
      },
      {
        id: 'm2',
        senderId: 'seller-1',
        receiverId: 'buyer-1',
        content: 'Yes, it is still available.',
        sentAt: '09:12',
      },
    ],
  },
  {
    id: 'chat-2',
    listingId: 'listing-2',
    listingTitle: 'Computer Science Textbook',
    sellerId: 'seller-2',
    sellerName: 'Sipho Dlamini',
    sellerEmail: 'sipho.dlamini@wits.ac.za',
    unread: false,
    messages: [
      {
        id: 'm3',
        senderId: 'buyer-1',
        receiverId: 'seller-2',
        content: 'Can I collect tomorrow?',
        sentAt: '14:20',
      },
      {
        id: 'm4',
        senderId: 'seller-2',
        receiverId: 'buyer-1',
        content: 'Yes, tomorrow works for me.',
        sentAt: '14:25',
      },
    ],
  },
  {
    id: 'chat-3',
    listingId: 'listing-3',
    listingTitle: 'Desk Lamp',
    sellerId: 'seller-1',
    sellerName: 'Ayanda Mokoena',
    sellerEmail: 'ayanda.mokoena@wits.ac.za',
    unread: false,
    messages: [
      {
        id: 'm5',
        senderId: 'seller-1',
        receiverId: 'buyer-1',
        content: 'Let me know if you still want the lamp.',
        sentAt: '08:05',
      },
    ],
  },
];

export default function MessagesPage() {
  const navigate = useNavigate();
  const [chats, setChats] = useState(MOCK_CHATS);
  const [selectedChatId, setSelectedChatId] = useState(MOCK_CHATS[0]?.id ?? null);
  const [newMessage, setNewMessage] = useState('');

  const selectedChat = useMemo(
    () => chats.find((chat) => chat.id === selectedChatId) || null,
    [chats, selectedChatId]
  );

  const handleSelectChat = (chatId) => {
    setSelectedChatId(chatId);

    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.id === chatId ? { ...chat, unread: false } : chat
      )
    );
  };

  const handleSendMessage = (e) => {
    e.preventDefault();

    if (!newMessage.trim() || !selectedChat) return;

    const messageToAdd = {
      id: `m-${Date.now()}`,
      senderId: CURRENT_USER.id,
      receiverId: selectedChat.sellerId,
      content: newMessage.trim(),
      sentAt: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.id === selectedChat.id
          ? {
              ...chat,
              messages: [...chat.messages, messageToAdd],
            }
          : chat
      )
    );

    setNewMessage('');
  };

  const getLastMessage = (chat) => {
    if (!chat.messages.length) return 'No messages yet';
    return chat.messages[chat.messages.length - 1].content;
  };

  const getLastMessageTime = (chat) => {
    if (!chat.messages.length) return '';
    return chat.messages[chat.messages.length - 1].sentAt;
  };

  return (
    <div
      className="min-h-screen flex flex-col bg-gray-50"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      <Navbar user={CURRENT_USER} />

      <main className="flex-1 px-6 py-6">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden h-[calc(100vh-120px)] flex">
          {/* Left panel */}
          <aside className="w-full max-w-sm border-r border-gray-200 flex flex-col bg-white">
            <div className="px-5 py-4 border-b border-gray-200">
              <h1 className="text-xl font-bold text-gray-800">Messages</h1>
              <p className="text-sm text-gray-500 mt-1">
                Chat with sellers about listings
              </p>
            </div>

            <div className="flex-1 overflow-y-auto">
              {chats.map((chat) => {
                const isActive = chat.id === selectedChatId;

                return (
                  <button
                    key={chat.id}
                    type="button"
                    onClick={() => handleSelectChat(chat.id)}
                    className={`w-full text-left px-5 py-4 border-b border-gray-100 transition ${
                      isActive ? 'bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          {chat.sellerName}
                        </p>
                        <p className="text-xs text-gray-500 truncate mt-1">
                          {chat.listingTitle}
                        </p>
                        <p className="text-sm text-gray-600 truncate mt-2">
                          {getLastMessage(chat)}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className="text-xs text-gray-400">
                          {getLastMessageTime(chat)}
                        </span>
                        {chat.unread && (
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Right panel */}
          <section className="flex-1 flex flex-col bg-gray-50">
            {selectedChat ? (
              <>
                {/* Chat header */}
                <div className="px-6 py-4 border-b border-gray-200 bg-white flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-gray-800">
                      {selectedChat.sellerName}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Regarding: {selectedChat.listingTitle}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {selectedChat.sellerEmail}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate('/seller-profile')}
                    className="px-4 py-2 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
                  >
                    View Seller
                  </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-3">
                  {selectedChat.messages.map((message) => {
                    const isCurrentUser = message.senderId === CURRENT_USER.id;

                    return (
                      <div
                        key={message.id}
                        className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                            isCurrentUser
                              ? 'bg-blue-600 text-white rounded-br-md'
                              : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md'
                          }`}
                        >
                          <p className="text-sm leading-6">{message.content}</p>
                          <p
                            className={`text-xs mt-2 ${
                              isCurrentUser ? 'text-blue-100' : 'text-gray-400'
                            }`}
                          >
                            {message.sentAt}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Input */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-4 border-t border-gray-200 bg-white flex items-center gap-3"
                >
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    className="px-5 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
                  >
                    Send
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center px-6">
                <div className="text-center">
                  <h2 className="text-xl font-bold text-gray-800">
                    No conversation selected
                  </h2>
                  <p className="text-sm text-gray-500 mt-2">
                    Choose a chat from the left to start messaging.
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}