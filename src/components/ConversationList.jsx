import { useState } from "react";
import { useChat } from "../context/ChatContext";
import { useEffect } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import ConversationItem from "./ConversationItem";
import ProfileContextMenu from "./chat/ProfileContextMenu";
import TextInput from "./common/TextInput";
import Button from "./common/Button";

export default function ConversationList({ onSelect }) {
  const { conversations, setGlobalSearchResults, setActiveSearchUser } = useChat();
  const navigate = useNavigate();
  const location = useLocation();
  const { conversationId: conversationIdParam } = useParams();
  const [searchParams] = useSearchParams();

  const [selectedId, setSelectedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState(() => {
    return searchParams.get("q") || "";
  });
  const [contextMenuState, setContextMenuState] = useState({
    open: false,
    x: 0,
    y: 0,
    targetId: null,
  });
  const isProfileRoute = location.pathname.startsWith("/profile");
  const isSearchRoute = location.pathname.startsWith("/search");

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
    setSelectedId(String(id));
    setActiveSearchUser(null);
    setGlobalSearchResults([]);
    setSearchTerm("");
    // Remove query parameter when selecting conversation
    if (location.search) {
      navigate(location.pathname, { replace: true });
    }
    onSelect?.(id);
  };

  const handleOpenProfile = () => {
    navigate("/profile");
  };

  const handleOpenTargetProfile = () => {
    if (!contextMenuState.targetId) {
      return;
    }

    navigate(`/profile/${contextMenuState.targetId}`);
    setContextMenuState((prev) => ({
      ...prev,
      open: false,
    }));
  };

  const closeContextMenu = () => {
    setContextMenuState((prev) => {
      if (!prev.open) {
        return prev;
      }

      return {
        ...prev,
        open: false,
      };
    });
  };

  const handleConversationRightClick = (event, targetId) => {
    event.preventDefault();

    setContextMenuState({
      open: true,
      x: event.clientX,
      y: event.clientY,
      targetId,
    });
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
    if (conversationIdParam) {
      setSelectedId(String(conversationIdParam));
      return;
    }

    setSelectedId(null);
  }, [conversationIdParam, location.pathname]);

  // Sync searchTerm with URL query parameter
  useEffect(() => {
    const qParam = searchParams.get("q") || "";
    setSearchTerm(qParam);
  }, [searchParams]);

  useEffect(() => {
    const controller = new AbortController();

    const timeout = setTimeout(() => {
      if (searchTerm) {
        searchGlobal(searchTerm, controller.signal).catch(() => {
          if (!controller.signal.aborted) {
            setGlobalSearchResults([]);
          }
        });
        // Navigate to search page when user types a search term
        if (!isSearchRoute) {
          navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
        }
      } else {
        setGlobalSearchResults([]);
      }
    }, 400);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [searchTerm, setActiveSearchUser, setGlobalSearchResults, navigate, isSearchRoute]);

  return (
    <div className="conversation-list">
      <div className="conversation-heading-row">
        <h3 className="conversation-heading">Tin nhắn</h3>
        <Button
          type="button"
          className={`conversation-profile-btn ${isProfileRoute ? "active" : ""}`}
          onClick={handleOpenProfile}
          aria-label="Mở thông tin profile"
          title="Profile"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
            <path d="M4 20C4 16.6863 7.58172 14 12 14C16.4183 14 20 16.6863 20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </Button>
      </div>
      <div className="conversation-search-wrap">
        <TextInput
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Tìm kiếm hội thoại..."
          className="conversation-search-input"
        />
      </div>

      {filteredConversations.map((conv) => (
        <ConversationItem
          key={conv.conversation_id}
          conversation={conv}
          isSelected={selectedId}
          onSelect={handleClick}
          onContextMenu={handleConversationRightClick}
        />
      ))}

      {filteredConversations.length === 0 && (
        <div className="conversation-empty">Không tìm thấy hội thoại phù hợp</div>
      )}

      <ProfileContextMenu
        open={contextMenuState.open}
        x={contextMenuState.x}
        y={contextMenuState.y}
        onClose={closeContextMenu}
        onOpenProfile={handleOpenTargetProfile}
      />
    </div>
  );
}