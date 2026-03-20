import { useState } from "react";
import { createSocket } from "../services/socket";
import { useChat } from "../context/ChatContext";

export default function ChatWindow({ conversationId }) {
  const [input, setInput] = useState("");

  const token = localStorage.getItem("token");
  const socket = createSocket(token);

  const { messages } = useChat();


  const handleSend = () => {
    if (!input.trim()) return;

    socket.emit("send_message", {
      conversation_id: conversationId,
      content: input
    });

    setInput("");
  };

  if (!conversationId) {
    return <div style={{ padding: "20px" }}>Chọn cuộc hội thoại</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      
      {/* Message list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "10px" }}>
        {messages.map((m) => (
          <div key={m.id} style={{ marginBottom: "10px" }}>
            <b>{m.sender_id}:</b> {m.content}
          </div>
        ))}
      </div>

      {/* Input */}
      <div style={{ display: "flex", padding: "10px", borderTop: "1px solid #ccc" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{ flex: 1, padding: "8px" }}
        />
        <button onClick={handleSend} style={{ marginLeft: "10px" }}>
          Send
        </button>
      </div>

    </div>
  );
}