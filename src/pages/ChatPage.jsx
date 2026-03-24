import ChatWindow from "../components/ChatWindow";
import ConversationList from "../components/ConversationList";
import { useChat } from "../context/ChatContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function ChatPage () {
  const { currentConversationId, setCurrentConversationId, chatRef, handleScroll } = useChat();
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const handleSelectConversation = (conversationId) => {
    setCurrentConversationId(conversationId);
  };

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