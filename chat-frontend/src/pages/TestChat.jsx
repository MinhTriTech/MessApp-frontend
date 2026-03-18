import { useEffect, useState } from "react";
import { socket } from "../services/socket";

const USER_1 = {
  name: "First user",
  id: 1,
};

const USER_2 = {
  name: "Second user",
  id: 2,
};


export default function TestChat() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);

  const [user, setUser] = useState(null);
  
  useEffect(() => {
    const fakeId = prompt("Enter user id:");
    if (Number(fakeId) === 1) {
      setUser(USER_1);
    } else {
      setUser(USER_2);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

    // Tạo room
    socket.emit("start_conversation", {
      userId: user.id,
      targetId: user.id === 1 ? 2 : 1
    });

    // Room sẵn sàng
    socket.on("conversation_ready", ({ conversationId }) => {
      setConversationId(conversationId);
      
      // join room
      socket.emit("join_conversation", conversationId, user);
    });
    
    // nhận message
    socket.on("receive_message", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      socket.off("conversation_ready");
      socket.off("receive_message");
    };
  }, [user]);

  const sendMessage = () => {
    if (!conversationId || !message.trim()) {
      return;
    }

    socket.emit("send_message", {
      conversation_id: conversationId ,
      sender_id: user.id ?? 0,
      content: message.trim(),
    });

    setMessage("");
  };

  if (!user) {
    return <div>Initializing user...</div>;
  }

  return (
    <div>
      <h2>Chat Test (User {user.id})</h2>

      <div>
        {messages.map((msg, index) => (
          <div key={msg.id}>
              {msg.sender_id === user.id ? "Me: " : "Other: "}
              {msg.content}
          </div>
        ))}
      </div>

      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      <button onClick={sendMessage}>Send</button>
    </div>
  );
}