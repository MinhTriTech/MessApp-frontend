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

export default function ConversationItem({
  conversation,
  isSelected,
  onSelect,
  onContextMenu,
}) {
  const seed = hashString(`${conversation.conversation_id}-${conversation.target_name || "user"}`);
  const roughCirclePath = buildWobblyCirclePath(seed);
  const organicRadius = buildOrganicRadius(seed);
  const rawTargetAvatar =
    typeof conversation.target_avatar === "string" ? conversation.target_avatar.trim() : "";
  const avatarUrl =
    rawTargetAvatar && rawTargetAvatar.toLowerCase() !== "null"
      ? rawTargetAvatar
      : "";

  const lastMessage = (conversation?.last_message || "").trim();
  const displayMessage = lastMessage || "Tệp đính kèm";

  return (
    <div
      onClick={() => onSelect(conversation.conversation_id)}
      onContextMenu={(event) => onContextMenu(event, conversation.target_id)}
      className={`conversation-item ${String(isSelected) === String(conversation.conversation_id) ? "active" : ""}`}
    >
      <div className="conversation-avatar-wrap">
        <div className="conversation-avatar-core" style={{ borderRadius: organicRadius }}>
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={`Avatar của ${conversation.target_name || "user"}`}
              className="conversation-avatar-image"
            />
          ) : (
            <span className="conversation-avatar-fallback">{getInitials(conversation.target_name)}</span>
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
        <div className="conversation-name">{conversation.target_name}</div>
        <div className="conversation-message">{displayMessage}</div>
      </div>
    </div>
  );
}
