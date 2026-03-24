import { forwardRef, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "../context/ChatContext";
import { AuthContext } from "../context/AuthContext";
import RoughMessageBubble from "./chat/RoughMessageBubble";
import ProfilePanel from "./chat/ProfilePanel";
import SearchResultPanel from "./chat/SearchResultPanel";
import ChatComposer from "./chat/ChatComposer";
import ImagePreviewModal from "./chat/ImagePreviewModal";

let roughModulePromise;

const loadRough = () => {
  if (!roughModulePromise) {
    roughModulePromise = import("roughjs/bundled/rough.esm.js").then((module) => module.default ?? module);
  }

  return roughModulePromise;
};

const ChatWindow = forwardRef(function ChatWindow({ conversationId, onScroll, showProfilePanel }, messageListRef) {
  const { user } = useContext(AuthContext);
  const [input, setInput] = useState("");
  const [roughLib, setRoughLib] = useState(null);
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

  if (showProfilePanel) {
    return <ProfilePanel user={user} />;
  }

  return (
    <div className="chat-window">
      <SearchResultPanel
        results={globalSearchResults}
        activeSearchUser={activeSearchUser}
        onSelectSearchUser={handleSelectSearchUser}
      />

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

          <ChatComposer
            input={input}
            onInputChange={handleTyping}
            onSend={handleSend}
            fileInputRef={fileInputRef}
            onFileChange={handleFileChange}
            onPickFile={handlePickFile}
          />
        </>
      )}

      <ImagePreviewModal previewImage={previewImage} onClose={() => setPreviewImage(null)} />

    </div>
  );
});

export default ChatWindow;