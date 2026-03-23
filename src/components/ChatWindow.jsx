import { forwardRef, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useChat } from "../context/ChatContext";
import { AuthContext } from "../context/AuthContext";

let roughModulePromise;

const loadRough = () => {
  if (!roughModulePromise) {
    roughModulePromise = import("roughjs/bundled/rough.esm.js").then((module) => module.default ?? module);
  }

  return roughModulePromise;
};

function RoughMessageBubble({ message, isMe, isSeen, sender, roughLib }) {
  const bubbleRef = useRef(null);
  const canvasRef = useRef(null);

  // Hiệu ứng cho mỗi tin nhắn
  useLayoutEffect(() => {
    if (!roughLib) {
      return;
    }

    const drawBubble = () => {
      const bubbleElement = bubbleRef.current;
      const canvasElement = canvasRef.current;

      if (!bubbleElement || !canvasElement) {
        return;
      }

      const rect = bubbleElement.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));
      const dpr = window.devicePixelRatio || 1;

      canvasElement.width = width * dpr;
      canvasElement.height = height * dpr;
      canvasElement.style.width = `${width}px`;
      canvasElement.style.height = `${height}px`;

      const context = canvasElement.getContext("2d");
      if (!context) {
        return;
      }

      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);

      const roughCanvas = roughLib.canvas(canvasElement);
      const fillColor = isMe ? "#dcebff" : "#f3e3ff";
      const stripeColor = isMe ? "#4f7faa" : "#8f6db3";

      roughCanvas.rectangle(1, 1, width - 2, height - 2, {
        seed: Number(message.id) || undefined,
        stroke: "#111",
        strokeWidth: 1.6,
        roughness: 1.3,
        bowing: 1.2,
        fill: fillColor,
        fillStyle: "hachure",
        hachureAngle: isMe ? -35 : 35,
        hachureGap: 5,
        fillWeight: 1.5,
        strokeLineDash: [1, 0],
        fillLineDash: [3, 2],
        fillLineDashOffset: 2,
        fillShapeRoughnessGain: 1,
        fillStroke: stripeColor,
      });
    };

    drawBubble();

    let resizeObserver;
    if (window.ResizeObserver && bubbleRef.current) {
      resizeObserver = new ResizeObserver(() => {
        drawBubble();
      });
      resizeObserver.observe(bubbleRef.current);
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [isMe, message.content, message.id, roughLib]);

  if (!roughLib) {
    return (
      <div className={`message-row ${isMe ? "me" : ""} message-row-fallback`} ref={bubbleRef}>
        <div className="message-bubble-content">
          <div className="message-meta">
            {isSeen ? "✓✓ Seen • " : ""}
            <b>{sender.name}</b>
          </div>
          <div className="message-content">{message.content}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`message-row ${isMe ? "me" : ""}`} ref={bubbleRef}>
      <canvas className="message-bubble-canvas" ref={canvasRef} />
      <div className="message-bubble-content">
        <div className="message-meta">
          {isSeen ? "✓✓ Seen • " : ""}
          <b>{sender.name}</b>
        </div>
        <div className="message-content">{message.content}</div>
      </div>
    </div>
  );
}

const ChatWindow = forwardRef(function ChatWindow({ conversationId, onScroll }, messageListRef) {
  const { user } = useContext(AuthContext);
  const [input, setInput] = useState("");
  const [roughLib, setRoughLib] = useState(null);

  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  const { messages, typingUsers, sendMessage, emitTyping, emitStopTyping, emitSeenMessage, participants } = useChat();

  useEffect(() => {
    let isMounted = true;

    loadRough().then((lib) => {
      if (isMounted) {
        setRoughLib(lib);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Typing status
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Seen tin nhắn
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

  const userMap = useMemo(() => {
    const map = {};

    participants.forEach(user => {
      map[user.id] = user;
    });

    return map;
  }, [participants]);

  const isSeen = (msg) => {
    return msg.sender_id === user?.id && msg.seenBy && msg.seenBy.length > 0;
  };

  if (!conversationId) {
    return <div className="chat-empty">Chọn cuộc hội thoại</div>;
  }

  return (
    <div className="chat-window">
      <div
        ref={messageListRef}
        onScroll={onScroll}
        className="message-list"
      >
        {messages.map((m) => {
          const sender = userMap[m.sender_id];

          return (
            <RoughMessageBubble
              key={m.id}
              message={m}
              isMe={m.sender_id === user?.id}
              isSeen={isSeen(m)}
              sender={sender}
              roughLib={roughLib}
            />
          );
        })}
      </div>

      {typingUsers.length > 0 && (
        <div className="typing-indicator">Ai đó đang soạn tin nhắn...</div>
      )}

      <div className="message-input-row">
        <input
          value={input}
          onChange={handleTyping}
          className="text-input"
          placeholder="Nhập tin nhắn..."
        />
        <button onClick={handleSend} className="btn">
          Send
        </button>
      </div>

    </div>
  );
});

export default ChatWindow;