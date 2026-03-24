import { useState } from "react";
import { useChat } from "../context/ChatContext";
import { useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import ProfileContextMenu from "./chat/ProfileContextMenu";

const AVATAR_SIZE = 44;

const hashString = (value) => {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
};

const createSeededRandom = (seed) => {
  let value = seed || 1;

  return () => {
    value += 0x6d2b79f5;
    let temp = value;
    temp = Math.imul(temp ^ (temp >>> 15), temp | 1);
    temp ^= temp + Math.imul(temp ^ (temp >>> 7), temp | 61);
    return ((temp ^ (temp >>> 14)) >>> 0) / 4294967296;
  };
};

const buildWobblyCirclePath = (seed, size = 48) => {
  const random = createSeededRandom(seed);
  const totalPoints = 18;
  const center = size / 2;
  const baseRadius = size * 0.4;
  const points = [];

  for (let index = 0; index < totalPoints; index += 1) {
    const angle = (index / totalPoints) * Math.PI * 2;
    const angleOffset = (random() - 0.5) * 0.18;
    const radiusOffset = (random() - 0.5) * 0.22;
    const radius = baseRadius * (1 + radiusOffset);

    points.push({
      x: center + Math.cos(angle + angleOffset) * radius,
      y: center + Math.sin(angle + angleOffset) * radius,
    });
  }

  let path = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;

  for (let index = 1; index <= points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index % points.length];
    const midpointX = ((previous.x + current.x) / 2).toFixed(2);
    const midpointY = ((previous.y + current.y) / 2).toFixed(2);

    path += ` Q ${previous.x.toFixed(2)} ${previous.y.toFixed(2)} ${midpointX} ${midpointY}`;
  }

  return `${path} Z`;
};

const buildOrganicRadius = (seed) => {
  const random = createSeededRandom(seed ^ 0x9e3779b9);
  const p1 = 35 + random() * 25;
  const p2 = 35 + random() * 25;
  const p3 = 35 + random() * 25;
  const p4 = 35 + random() * 25;
  const q1 = 35 + random() * 25;
  const q2 = 35 + random() * 25;
  const q3 = 35 + random() * 25;
  const q4 = 35 + random() * 25;

  return `${p1.toFixed(1)}% ${p2.toFixed(1)}% ${p3.toFixed(1)}% ${p4.toFixed(1)}% / ${q1.toFixed(1)}% ${q2.toFixed(1)}% ${q3.toFixed(1)}% ${q4.toFixed(1)}%`;
};

const getInitials = (name) => {
  const tokens = (name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (tokens.length === 0) {
    return "U";
  }

  if (tokens.length === 1) {
    return tokens[0].slice(0, 1).toUpperCase();
  }

  return `${tokens[0][0]}${tokens[tokens.length - 1][0]}`.toUpperCase();
};

export default function ConversationList({ onSelect }) {
  const { conversations, setGlobalSearchResults, setActiveSearchUser } = useChat();
  const navigate = useNavigate();
  const location = useLocation();
  const { conversationId: conversationIdParam } = useParams();

  const [selectedId, setSelectedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [contextMenuState, setContextMenuState] = useState({
    open: false,
    x: 0,
    y: 0,
    targetId: null,
  });
  const isProfileRoute = location.pathname.startsWith("/profile");

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
    if (conversationIdParam) {
      setSelectedId(String(conversationIdParam));
      return;
    }

    setSelectedId(null);
  }, [conversationIdParam, location.pathname]);

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
          className={`btn conversation-profile-btn ${isProfileRoute ? "active" : ""}`}
          onClick={handleOpenProfile}
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

      {filteredConversations.map((conv) => {
        const seed = hashString(`${conv.conversation_id}-${conv.target_name || "user"}`);
        const roughCirclePath = buildWobblyCirclePath(seed);
        const organicRadius = buildOrganicRadius(seed);
        const rawTargetAvatar =
          typeof conv.target_avatar === "string" ? conv.target_avatar.trim() : "";
        const avatarUrl =
          rawTargetAvatar && rawTargetAvatar.toLowerCase() !== "null"
            ? rawTargetAvatar
            : "";

        return (
          <div
            key={conv.conversation_id}
            onClick={() => handleClick(conv.conversation_id)}
            onContextMenu={(event) => handleConversationRightClick(event, conv.target_id)}
            className={`conversation-item ${String(selectedId) === String(conv.conversation_id) ? "active" : ""}`}
          >
            <div className="conversation-avatar-wrap">
              <div className="conversation-avatar-core" style={{ borderRadius: organicRadius }}>
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={`Avatar của ${conv.target_name || "user"}`}
                    className="conversation-avatar-image"
                  />
                ) : (
                  <span className="conversation-avatar-fallback">{getInitials(conv.target_name)}</span>
                )}
              </div>

              <svg
                className="conversation-avatar-outline"
                width={AVATAR_SIZE}
                height={AVATAR_SIZE}
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path d={roughCirclePath} />
              </svg>
            </div>

            <div className="conversation-content">
              <div className="conversation-name">{conv.target_name}</div>
              <div className="conversation-message">{getLastMess(conv)}</div>
            </div>
          </div>
        );
      })}

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