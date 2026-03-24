import { forwardRef, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useChat } from "../context/ChatContext";
import { AuthContext } from "../context/AuthContext";
import attachFileIcon from "../assets/attach-file.png";
import attachFileHoverIcon from "../assets/attach-file-hover.png";

let roughModulePromise;

const loadRough = () => {
  if (!roughModulePromise) {
    roughModulePromise = import("roughjs/bundled/rough.esm.js").then((module) => module.default ?? module);
  }

  return roughModulePromise;
};

function RoughMessageBubble({ message, isMe, isSeen, sender, roughLib, onPreviewImage }) {
  const bubbleRef = useRef(null);
  const canvasRef = useRef(null);

  const fileUrl = message.file_url;
  const fileType = message.file_type;
  const fileName = message.file_name;
  const hasFile = Boolean(fileUrl) || message.type === "file";
  const isImageFile = Boolean(fileType?.startsWith("image/") && fileUrl);

  const renderMessageContent = () => {
    if (isImageFile) {
      return (
        <button
          type="button"
          className="image-message-button"
          onClick={() => onPreviewImage?.({ url: fileUrl, name: fileName || "Hình ảnh" })}
        >
          <img src={fileUrl} alt={fileName || "Uploaded image"} className="message-image" loading="lazy" />
        </button>
      );
    }

    if (hasFile && fileUrl) {
      return (
        <a href={fileUrl} target="_blank" rel="noreferrer" className="file-message-link">
          {fileName || "Xem tệp đính kèm"}
        </a>
      );
    }

    return <div className="message-content">{message.content}</div>;
  };

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
          {renderMessageContent()}
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
        {renderMessageContent()}
      </div>
    </div>
  );
}

const ChatWindow = forwardRef(function ChatWindow({ conversationId, onScroll }, messageListRef) {
  const { user } = useContext(AuthContext);
  const [input, setInput] = useState("");
  const [roughLib, setRoughLib] = useState(null);
  const [isFileButtonHovered, setIsFileButtonHovered] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);

  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  const token = localStorage.getItem("token");

  const {
    messages,
    typingUsers,
    sendMessage,
    emitTyping,
    emitStopTyping,
    emitSeenMessage,
    participants,
    globalSearchResults,
    setGlobalSearchResults,
    activeSearchUser,
    setActiveSearchUser,
    setCurrentConversationId,
    conversations,
    setMessages,
  } = useChat();

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

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === "Escape") {
        setPreviewImage(null);
      }
    };

    window.addEventListener("keydown", handleEsc);

    return () => {
      window.removeEventListener("keydown", handleEsc);
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

  const handleSend = async () => {
    if (!input.trim()) return;

    const isSent = await sendMessage(input, {
      draftUserId: activeSearchUser?.id,
    });

    if (!isSent) {
      return;
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (isTypingRef.current) {
      emitStopTyping();
      isTypingRef.current = false;
    }

    setInput("");
  };

  const handleSelectSearchUser = (targetUser) => {
    const existingConversation = conversations.find(
      (conversation) => conversation.target_id === targetUser.id,
    );

    if (existingConversation?.conversation_id) {
      setActiveSearchUser(null);
      setGlobalSearchResults([]);
      setCurrentConversationId(existingConversation.conversation_id);
      return;
    }

    setActiveSearchUser(targetUser);
    setGlobalSearchResults([]);
    setCurrentConversationId(null);
  };

  const handlePickFile = () => {
    if (!fileInputRef.current) {
      return;
    }

    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    if (!conversationId) {
      e.target.value = "";
      return;
    }

    if (!token) return;

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("conversationId", conversationId);

    const res = await fetch("http://localhost:8000/messages/uploads", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData
    });

    if (!res.ok) {
      e.target.value = "";
      return;
    }

    const data = await res.json();
    const uploadedMessage = data?.message;

    if (uploadedMessage?.id) {
      setMessages((prev) => [...prev, uploadedMessage]);
    }

    e.target.value = "";
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

  return (
    <div className="chat-window">
      {globalSearchResults.length > 0 && (
        <div className="search-result-panel search-result-panel-full">
          <div className="search-result-heading">Kết quả tìm user</div>
          <div className="search-result-grid">
            {globalSearchResults.map((resultUser) => (
              <button
                key={resultUser.id}
                type="button"
                className={`search-user-card ${activeSearchUser?.id === resultUser.id ? "active" : ""}`}
                onClick={() => handleSelectSearchUser(resultUser)}
              >
                <div className="search-user-name">{resultUser.name}</div>
                {resultUser.email && <div className="search-user-email">{resultUser.email}</div>}
              </button>
            ))}
          </div>
        </div>
      )}

      {globalSearchResults.length > 0 && (
        <div className="chat-empty search-result-empty-note">Chọn một user để bắt đầu trò chuyện</div>
      )}

      {!conversationId && !activeSearchUser && globalSearchResults.length === 0 && (
        <div className="chat-empty">Chọn cuộc hội thoại hoặc chọn 1 user từ kết quả tìm kiếm</div>
      )}

      {!conversationId && activeSearchUser && globalSearchResults.length === 0 && (
        <div className="chat-empty">Đang chuẩn bị chat với {activeSearchUser.name}. Gửi tin nhắn đầu tiên để tạo phòng chat.</div>
      )}

      {globalSearchResults.length === 0 && (
        <>
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
                  sender={sender || { name: "Unknown" }}
                  roughLib={roughLib}
                  onPreviewImage={setPreviewImage}
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
            <input
              ref={fileInputRef}
              type="file"
              className="file-input-hidden"
              onChange={handleFileChange}
            />
            <button
              onClick={handlePickFile}
              className="btn btn-file"
              type="button"
              onMouseEnter={() => setIsFileButtonHovered(true)}
              onMouseLeave={() => setIsFileButtonHovered(false)}
            >
              <img
                src={isFileButtonHovered ? attachFileHoverIcon : attachFileIcon}
                alt="Đính kèm file"
              />
            </button>
            <button onClick={handleSend} className="btn">
              Gửi
            </button>
          </div>
        </>
      )}

      {previewImage && (
        <div className="image-preview-overlay" onClick={() => setPreviewImage(null)}>
          <div className="image-preview-bubble" onClick={(e) => e.stopPropagation()}>
            <img src={previewImage.url} alt={previewImage.name} className="image-preview-image" />
          </div>
        </div>
      )}

    </div>
  );
});

export default ChatWindow;