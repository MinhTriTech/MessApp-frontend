import { forwardRef, useContext, useEffect, useRef, useState } from "react";
import { useChat } from "../context/ChatContext";
import { AuthContext } from "../context/AuthContext";

const ChatWindow = forwardRef(function ChatWindow({ conversationId, onScroll }, messageListRef) {
  const { user } = useContext(AuthContext);
  const [input, setInput] = useState("");

  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  const { messages, typingUsers, sendMessage, emitTyping, emitStopTyping, emitSeenMessage } = useChat();

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    emitSeenMessage();
  }, [conversationId, messages]);

  const handleTyping = (e) => {
    const value = e.target.value;
    setInput(value);

    if (!value.trim()) {
      if (isTypingRef.current) {
        emitStopTyping();
        isTypingRef.current = false;
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      return;
    }

    if (!isTypingRef.current) {
      emitTyping();
      isTypingRef.current = true;
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      emitStopTyping();
      isTypingRef.current = false;
    }, 1000);
  };

  const handleSend = () => {
    if (!input.trim()) return;

    sendMessage(input);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (isTypingRef.current) {
      emitStopTyping();
      isTypingRef.current = false;
    }

    setInput("");
  };

  const isSeen = (msg) => {
    return msg.sender_id === user?.id && msg.seenBy && msg.seenBy.length > 0;
  };

  if (!conversationId) {
    return <div style={{ padding: "20px" }}>Chọn cuộc hội thoại</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>

      {typingUsers.length > 0 && (
        <div>Ai đó đang soạn tin nhắn</div>
      )}
      
      {/* Message list */}
      <div
        ref={messageListRef}
        onScroll={onScroll}
        style={{ flex: 1, overflowY: "auto", padding: "10px" }}
      >
        {messages.map((m) => (
          <div key={m.id} style={{ marginBottom: "10px" }}>
            {isSeen(m) && "✓✓ Seen "}
            <b>{m.sender_id}:</b> {m.content}
          </div>
        ))}
      </div>

      {/* Input */}
      <div style={{ display: "flex", padding: "10px", borderTop: "1px solid #ccc" }}>
        <input
          value={input}
          onChange={handleTyping}
          style={{ flex: 1, padding: "8px" }}
        />
        <button onClick={handleSend} style={{ marginLeft: "10px" }}>
          Send
        </button>
      </div>

    </div>
  );
});

export default ChatWindow;