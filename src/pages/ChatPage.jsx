import { useEffect } from "react";
import ChatWindow from "../components/ChatWindow";
import ConversationList from "../components/ConversationList";
import { useChat } from "../context/ChatContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useParams } from "react-router-dom";

export default function ChatPage () {
  const { conversationId: conversationIdParam } = useParams();
  const { currentConversationId, setCurrentConversationId, chatRef, handleScroll } = useChat();
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const handleSelectConversation = (conversationId) => {
    navigate(`/chat/${conversationId}`);
  };

  useEffect(() => {
    const routeConversationId = conversationIdParam || null;
    const normalizedRouteId = routeConversationId ? String(routeConversationId) : "";
    const normalizedCurrentId = currentConversationId ? String(currentConversationId) : "";

    if (normalizedRouteId === normalizedCurrentId) {
      return;
    }

    setCurrentConversationId(routeConversationId);
  }, [conversationIdParam, currentConversationId, setCurrentConversationId]);

  useEffect(() => {
    if (!currentConversationId) {
      return;
    }

    if (conversationIdParam && String(conversationIdParam) === String(currentConversationId)) {
      return;
    }

    if (conversationIdParam) {
      return;
    }

    navigate(`/chat/${currentConversationId}`, { replace: true });
  }, [currentConversationId, conversationIdParam, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/login", { replace: true });
  };

  return (
    <>
      <div className="chat-layout">
        <div className="conversation-pane">
          <ConversationList onSelect={handleSelectConversation} />
        </div>

        <div className="chat-pane">
          <ChatWindow
            conversationId={currentConversationId}
            ref={chatRef}
            onScroll={handleScroll}
          />
        </div>
      </div>

      <button className="btn logout-btn" onClick={handleLogout}>Đăng xuất</button>
    </>
  );
}