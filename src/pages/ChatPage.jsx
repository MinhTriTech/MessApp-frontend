import ChatWindow from "../components/ChatWindow";
import ConversationList from "../components/ConversationList";
import { useChat } from "../context/ChatContext";

export default function ChatPage () {
  const { currentConversationId, setCurrentConversationId } = useChat();
    return (
    <div style={{ display: "flex", height: "100vh" }}>
      <div style={{ width: "30%", borderRight: "1px solid #ccc" }}>
        <ConversationList onSelect={setCurrentConversationId} />
      </div>

      <div style={{ width: "70%" }}>
        <ChatWindow conversationId={currentConversationId} />
      </div>

    </div>
  );
}