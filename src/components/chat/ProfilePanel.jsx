import { useEffect, useMemo, useRef, useState } from "react";
import AvatarCropModal from "./AvatarCropModal";

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

export default function ProfilePanel({ user, readOnly = false, loading = false, error = "" }) {
  const initialProfile = useMemo(() => {
    const profileName = user?.name || "Bạn";
    const profileEmail = user?.email || "demo@mess.app";

    return {
      name: profileName,
      email: profileEmail,
      avatar: user?.avatar_url || user?.avatar || user?.profile_image || "",
      bio: user?.bio || "",
    };
  }, [user]);

  const [draftProfile, setDraftProfile] = useState(initialProfile);
  const [cropSourceUrl, setCropSourceUrl] = useState("");
  const fileInputRef = useRef(null);
  const cropSourceObjectUrlRef = useRef(null);

  useEffect(() => {
    setDraftProfile(initialProfile);
  }, [initialProfile]);

  const isDirty = useMemo(() => {
    return Object.keys(initialProfile).some((key) => draftProfile[key] !== initialProfile[key]);
  }, [draftProfile, initialProfile]);

  const profileHandle = `@${draftProfile.email.split("@")[0] || "user"}`;
  const profileInitials = draftProfile.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("") || "U";
  const avatarSeed = useMemo(() => hashString(`${draftProfile.email}-${draftProfile.name}`), [draftProfile.email, draftProfile.name]);
  const avatarOutlinePath = useMemo(() => buildWobblyCirclePath(avatarSeed), [avatarSeed]);
  const avatarRadius = useMemo(() => buildOrganicRadius(avatarSeed), [avatarSeed]);

  const handleChange = (field) => (event) => {
    setDraftProfile((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleReset = () => {
    setDraftProfile(initialProfile);
  };

  const handleSave = () => {
    if (!isDirty) {
      return;
    }
  };

  const handleAvatarChange = (event) => {
    if (readOnly) {
      return;
    }

    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    if (cropSourceObjectUrlRef.current) {
      URL.revokeObjectURL(cropSourceObjectUrlRef.current);
    }

    const nextUrl = URL.createObjectURL(selectedFile);
    cropSourceObjectUrlRef.current = nextUrl;
    setCropSourceUrl(nextUrl);

    event.target.value = "";
  };

  const handleCloseCropModal = () => {
    if (cropSourceObjectUrlRef.current) {
      URL.revokeObjectURL(cropSourceObjectUrlRef.current);
      cropSourceObjectUrlRef.current = null;
    }

    setCropSourceUrl("");
  };

  const handleApplyCroppedAvatar = (croppedAvatarUrl) => {
    if (readOnly) {
      return;
    }

    setDraftProfile((prev) => ({
      ...prev,
      avatar: croppedAvatarUrl,
    }));

    handleCloseCropModal();
  };

  return (
    <div className="chat-window">
      <div className="profile-view-wrap">
        <div className="profile-view-card">
          <div className="profile-view-header">Thông tin profile</div>

          {loading && <div className="chat-empty">Đang tải thông tin user...</div>}
          {error && !loading && <div className="chat-empty">{error}</div>}

          {!loading && !error && (
            <>
              <div className="profile-view-main">
                <div className="profile-view-identity">
                  <div className="profile-view-name">{draftProfile.name}</div>
                  <div className="profile-view-handle">{profileHandle}</div>
                  <div className="profile-view-email">{draftProfile.email}</div>
                </div>

                <div className="profile-view-avatar-pane">
                  <div className="conversation-avatar-wrap profile-view-avatar-wrap">
                    <div className="conversation-avatar-core profile-view-avatar-core" style={{ borderRadius: avatarRadius }}>
                      {draftProfile.avatar ? (
                        <img
                          src={draftProfile.avatar}
                          alt="Avatar profile"
                          className="conversation-avatar-image"
                        />
                      ) : (
                        <span className="conversation-avatar-fallback">{profileInitials}</span>
                      )}

                      {!readOnly && (
                        <button
                          type="button"
                          className="profile-view-avatar-overlay"
                          onClick={() => fileInputRef.current?.click()}
                          aria-label="Đổi ảnh đại diện"
                          title="Đổi ảnh đại diện"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path d="M15.23 5.26L18.74 8.77M9 20H5V16L15.23 5.77C15.5343 5.46573 15.8955 5.22437 16.293 5.05971C16.6905 4.89505 17.1165 4.8103 17.5468 4.8103C17.9771 4.8103 18.4031 4.89505 18.8006 5.05971C19.1981 5.22437 19.5593 5.46573 19.8636 5.77C20.1679 6.07427 20.4093 6.4355 20.5739 6.833C20.7386 7.2305 20.8233 7.65652 20.8233 8.0868C20.8233 8.51708 20.7386 8.94311 20.5739 9.34061C20.4093 9.73811 20.1679 10.0993 19.8636 10.4036L9 21.26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      )}
                    </div>

                    <svg
                      className="conversation-avatar-outline"
                      width="100%"
                      height="100%"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                    >
                      <path d={avatarOutlinePath} />
                    </svg>

                    {!readOnly && (
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="profile-view-file-input"
                        onChange={handleAvatarChange}
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="profile-view-grid">
                <div className="profile-view-item">
                  <div className="profile-view-label">Tên hiển thị</div>
                  <input
                    className="text-input profile-view-input"
                    type="text"
                    value={draftProfile.name}
                    onChange={handleChange("name")}
                    disabled={readOnly}
                  />
                </div>

                <div className="profile-view-item profile-view-item-full">
                  <div className="profile-view-label">Giới thiệu</div>
                  <textarea
                    className="text-input profile-view-input profile-view-textarea"
                    value={draftProfile.bio}
                    onChange={handleChange("bio")}
                    disabled={readOnly}
                  />
                </div>
              </div>

              {!readOnly && (
                <div className="profile-view-actions">
                  <div className="profile-view-actions-left">
                    <button
                      type="button"
                      className="btn"
                      onClick={handleReset}
                      disabled={!isDirty}
                    >
                      Reset
                    </button>
                  </div>
                  <div>
                    <button
                      type="button"
                      className="btn"
                      onClick={handleSave}
                      disabled={!isDirty}
                    >
                      Lưu
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <AvatarCropModal
        key={cropSourceUrl || "empty-crop"}
        sourceUrl={cropSourceUrl}
        roughPath={avatarOutlinePath}
        onCancel={handleCloseCropModal}
        onConfirm={handleApplyCroppedAvatar}
      />
    </div>
  );
}
