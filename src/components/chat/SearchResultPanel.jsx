import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProfileContextMenu from "./ProfileContextMenu";

const getAvatarUrl = (user) => {
  const rawAvatar = user.avatar || user.avatar_url || user.profile_image || "";

  if (typeof rawAvatar !== "string") {
    return "";
  }

  const trimmedAvatar = rawAvatar.trim();

  if (!trimmedAvatar || trimmedAvatar.toLowerCase() === "null") {
    return "";
  }

  return trimmedAvatar;
};

export default function SearchResultPanel({ results, activeSearchUser, onSelectSearchUser }) {
  const navigate = useNavigate();
  const [avatarColorMap, setAvatarColorMap] = useState({});
  const [contextMenuState, setContextMenuState] = useState({
    open: false,
    x: 0,
    y: 0,
    targetId: null,
  });

  useEffect(() => {
    const avatarUrls = Array.from(new Set(results.map((resultUser) => getAvatarUrl(resultUser)).filter(Boolean)));

    if (avatarUrls.length === 0) {
      return undefined;
    }

    const missingAvatarUrls = avatarUrls.filter((url) => !avatarColorMap[url]);

    if (missingAvatarUrls.length === 0) {
      return undefined;
    }

    let isCancelled = false;

    missingAvatarUrls.forEach((avatarUrl) => {
      const image = new Image();
      image.crossOrigin = "anonymous";

      image.onload = () => {
        if (isCancelled) {
          return;
        }

        try {
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d", { willReadFrequently: true });

          if (!context) {
            return;
          }

          const sampleSize = 24;
          canvas.width = sampleSize;
          canvas.height = sampleSize;
          context.drawImage(image, 0, 0, sampleSize, sampleSize);

          const imageData = context.getImageData(0, 0, sampleSize, sampleSize).data;

          let red = 0;
          let green = 0;
          let blue = 0;
          let pixelWeight = 0;

          for (let index = 0; index < imageData.length; index += 4) {
            const alpha = imageData[index + 3] / 255;

            if (alpha < 0.05) {
              continue;
            }

            red += imageData[index] * alpha;
            green += imageData[index + 1] * alpha;
            blue += imageData[index + 2] * alpha;
            pixelWeight += alpha;
          }

          if (!pixelWeight) {
            return;
          }

          const avgRed = Math.round(red / pixelWeight);
          const avgGreen = Math.round(green / pixelWeight);
          const avgBlue = Math.round(blue / pixelWeight);
          const averageColor = `rgba(${avgRed}, ${avgGreen}, ${avgBlue}, 0.42)`;

          setAvatarColorMap((prev) => {
            if (prev[avatarUrl]) {
              return prev;
            }

            return {
              ...prev,
              [avatarUrl]: averageColor,
            };
          });
        } catch {
          setAvatarColorMap((prev) => {
            if (prev[avatarUrl]) {
              return prev;
            }

            return {
              ...prev,
              [avatarUrl]: "rgba(34, 34, 34, 0.42)",
            };
          });
        }
      };

      image.onerror = () => {
        if (isCancelled) {
          return;
        }

        setAvatarColorMap((prev) => {
          if (prev[avatarUrl]) {
            return prev;
          }

          return {
            ...prev,
            [avatarUrl]: "rgba(34, 34, 34, 0.42)",
          };
        });
      };

      image.src = avatarUrl;
    });

    return () => {
      isCancelled = true;
    };
  }, [avatarColorMap, results]);

  if (results.length === 0) {
    return null;
  }

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

  const handleRightClick = (event, targetId) => {
    event.preventDefault();

    setContextMenuState({
      open: true,
      x: event.clientX,
      y: event.clientY,
      targetId,
    });
  };

  const handleOpenTargetProfile = () => {
    if (!contextMenuState.targetId) {
      return;
    }

    navigate(`/profile/${contextMenuState.targetId}`);
    closeContextMenu();
  };

  const handleStartMessage = () => {
    if (!contextMenuState.targetId) {
      return;
    }

    const targetUser = results.find((resultUser) => resultUser.id === contextMenuState.targetId);

    if (!targetUser) {
      closeContextMenu();
      return;
    }

    onSelectSearchUser(targetUser);
    closeContextMenu();
  };

  return (
    <>
      <div className="search-result-panel search-result-panel-full">
        <div className="search-result-heading">Kết quả tìm user</div>
        <div className="search-result-grid">
          {results.map((resultUser) => {
            const avatarUrl = getAvatarUrl(resultUser);
            const averageAvatarColor = avatarUrl ? avatarColorMap[avatarUrl] : undefined;

            return (
              <button
                key={resultUser.id}
                type="button"
                className={`search-user-card ${activeSearchUser?.id === resultUser.id ? "active" : ""} ${avatarUrl ? "has-avatar" : ""}`}
                style={
                  avatarUrl
                    ? {
                        backgroundImage: `url(${avatarUrl})`,
                        backgroundColor: averageAvatarColor,
                      }
                    : undefined
                }
                onClick={() => navigate(`/profile/${resultUser.id}`)}
                onContextMenu={(event) => handleRightClick(event, resultUser.id)}
              >
                {avatarUrl && <span className="search-user-card-backdrop" aria-hidden="true" />}
                <span className="search-user-card-content">
                  <span className="search-user-name">{resultUser.name}</span>
                  {resultUser.email && <span className="search-user-email">{resultUser.email}</span>}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="chat-empty search-result-empty-note">Chọn một user để bắt đầu trò chuyện</div>

      <ProfileContextMenu
        open={contextMenuState.open}
        x={contextMenuState.x}
        y={contextMenuState.y}
        onClose={closeContextMenu}
        onOpenProfile={handleOpenTargetProfile}
        onStartMessage={handleStartMessage}
      />
    </>
  );
}
