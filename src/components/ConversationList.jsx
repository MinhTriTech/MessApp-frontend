import { useState } from "react";
import { useChat } from "../context/ChatContext";
import { useEffect } from "react";

export default function ConversationList({ onSelect }) {
  const { conversations, setGlobalSearchResults, setActiveSearchUser } = useChat();

  const [selectedId, setSelectedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredConversations = conversations.filter((conv) => {
    if (!normalizedSearch) {
      return true;
    }

    const targetName = (conv.target_name || "").toLowerCase();
    const lastMessage = (conv.last_message || "").toLowerCase();

    return targetName.includes(normalizedSearch) || lastMessage.includes(normalizedSearch);
  });

  const handleClick = (id) => {
    setSelectedId(id);
    setActiveSearchUser(null);
    setGlobalSearchResults([]);
    onSelect(id);
  };

  const searchGlobal = async (keyword, signal) => {
    const trimmedKeyword = keyword.trim();

    if (!trimmedKeyword) {
      setGlobalSearchResults([]);
      return;
    }

    const res = await fetch(`http://localhost:8000/users/search?q=${encodeURIComponent(trimmedKeyword)}`, {
        signal,
        headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
        }
    });

    if (!res.ok) {
      setGlobalSearchResults([]);
      return;
    }

    const data = await res.json();

    if (!Array.isArray(data)) {
      setGlobalSearchResults([]);
      return;
    }

    setGlobalSearchResults(data);
  };

  useEffect(() => {
    const controller = new AbortController();

    const timeout = setTimeout(() => {
      if (searchTerm) {
        searchGlobal(searchTerm, controller.signal).catch(() => {
          if (!controller.signal.aborted) {
            setGlobalSearchResults([]);
          }
        });
      } else {
        setGlobalSearchResults([]);
        setActiveSearchUser(null);
      }
    }, 400);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [searchTerm, setActiveSearchUser, setGlobalSearchResults]);

  return (
    <div className="conversation-list">
      <h3 className="conversation-heading">Tin nhắn</h3>
      <div className="conversation-search-wrap">
        <input
          className="text-input conversation-search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Tìm kiếm hội thoại..."
        />
      </div>

      {filteredConversations.map((conv) => (
        <div
          key={conv.conversation_id}
          onClick={() => handleClick(conv.conversation_id)}
          className={`conversation-item ${selectedId === conv.conversation_id ? "active" : ""}`}
        >
          <div className="conversation-name">{conv.target_name}</div>
          <div className="conversation-message">
            {conv.last_message === "" ? "[File]" : conv.last_message}
          </div>
        </div>
      ))}

      {filteredConversations.length === 0 && (
        <div className="conversation-empty">Không tìm thấy hội thoại phù hợp</div>
      )}
    </div>
  );
}