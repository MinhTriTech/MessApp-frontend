import { useState } from "react";
import { useChat } from "../context/ChatContext";
import { useEffect } from "react";

export default function ConversationList({ onSelect, onToggleProfile, isProfileViewOpen }) {
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

  const getLastMess = (conversation) => {
    const lastMessage = (conversation?.last_message || "").trim();
    return lastMessage || "Tệp đính kèm";
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
      <div className="conversation-heading-row">
        <h3 className="conversation-heading">Tin nhắn</h3>
        <button
          type="button"
          className={`btn conversation-profile-btn ${isProfileViewOpen ? "active" : ""}`}
          onClick={onToggleProfile}
          aria-label="Mở thông tin profile"
          title="Profile"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
            <path d="M4 20C4 16.6863 7.58172 14 12 14C16.4183 14 20 16.6863 20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
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
            {getLastMess(conv)}
          </div>
        </div>
      ))}

      {filteredConversations.length === 0 && (
        <div className="conversation-empty">Không tìm thấy hội thoại phù hợp</div>
      )}
    </div>
  );
}