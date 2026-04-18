import { useState } from "react";
import Chat from "../components/Chat";

export default function ChatPage() {
  // 🧪 Logged-in user (YOU)
  const senderId = "090a96d0-6db1-4062-86ce-96bf4e14e499";
  //const senderId = "ef1d2dba-75f0-43a6-8719-0fbdf53be3a8";

  // 🧪 Hardcoded people (receivers)
  const users = [
    {
      id: "ef1d2dba-75f0-43a6-8719-0fbdf53be3a8",
      name: "User 1",
      
      //id : "090a96d0-6db1-4062-86ce-96bf4e14e499",
      //name : "User 1"
      //hello
      //hi

    },
    {
      id: "6fb9d3bf-dc02-43f0-80db-695a34465f71",
      name: "User 2",
    },
    {
      id: "acb72f25-d32a-4a0a-855b-f58d509c2a2d",
      name: "User 3",
    },
  ];

  const [selectedUser, setSelectedUser] = useState(null);

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      
      {/* 👥 LEFT PANEL */}
      <div
        style={{
          width: "30%",
          borderRight: "1px solid #ccc",
          padding: 10,
        }}
      >
        <h3>Chats</h3>

        {users.map((user) => (
          <div
            key={user.id}
            onClick={() => setSelectedUser(user)}
            style={{
              padding: 10,
              cursor: "pointer",
              marginBottom: 5,
              borderRadius: 5,
              backgroundColor:
                selectedUser?.id === user.id ? "#ddd" : "transparent",
            }}
          >
            {user.name}
          </div>
        ))}
      </div>

      {/* 💬 RIGHT PANEL */}
      <div style={{ flex: 1, padding: 10 }}>
        {selectedUser ? (
          <>
            <h3>Chat with {selectedUser.name}</h3>

            <Chat
              senderId={senderId}
              receiverId={selectedUser.id}
            />
          </>
        ) : (
          <p>Select a user to start chatting</p>
        )}
      </div>
    </div>
  );
}