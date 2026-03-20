import { useChat } from "../context/ChatContext";

export default function ConversationList({ onSelect }) {
  const { conversations } = useChat();

  return (
    <div>
      <h3 style={{ padding: "10px" }}>Conversations</h3>
      {conversations.map(c => (
        <div key={c.conversation_id} onClick={() => onSelect(c.conversation_id)}>
          <h4>{c.target_name}</h4>
          <p>{c.last_message}</p>
        </div>
      ))}
    </div>
  );
}