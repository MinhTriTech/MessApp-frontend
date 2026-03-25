import { useEffect, useMemo, useRef, useState } from "react";
import AvatarCropModal from "../common/AvatarCropModal";
import ImagePreviewModal from "../common/ImagePreviewModal";
import ConfirmationModal from "../common/ConfirmationModal";
import TextInput from "../common/TextInput";
import Button from "../common/Button";

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

export default function ProfilePanel({
  user,
  readOnly = false,
  loading = false,
  error = "",
  onProfileUpdated,
  onStartMessage,
}) {
  const initialProfile = useMemo(() => {
    const profileName = user?.name || "Bạn";
    const profileEmail = user?.email || "";

    return {
      name: profileName,
      email: profileEmail,
      avatar: user?.avatar_url || user?.avatar || user?.profile_image || "",
      bio: "",
    };
  }, [user]);

  const [savedProfile, setSavedProfile] = useState(initialProfile);
  const [draftProfile, setDraftProfile] = useState(initialProfile);
  const [cropSourceUrl, setCropSourceUrl] = useState("");
  const [previewImage, setPreviewImage] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const fileInputRef = useRef(null);
  const cropSourceObjectUrlRef = useRef(null);

  useEffect(() => {
    setSavedProfile(initialProfile);
    setDraftProfile(initialProfile);
  }, [initialProfile]);

  const isDirty = useMemo(() => {
    return draftProfile.name !== savedProfile.name || draftProfile.avatar !== savedProfile.avatar;
  }, [draftProfile.avatar, draftProfile.name, savedProfile.avatar, savedProfile.name]);

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
    setDraftProfile(savedProfile);
  };

  const handleSave = async () => {
    if (!isDirty || isSaving) {
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      return;
    }

    setIsSaving(true);

    try {
      const formData = new FormData();
      formData.append("name", draftProfile.name);

      if (draftProfile.avatar && draftProfile.avatar.startsWith("data:image/")) {
        const avatarResponse = await fetch(draftProfile.avatar);
        const avatarBlob = await avatarResponse.blob();
        formData.append("avatar", avatarBlob, `avatar-${Date.now()}.png`);
      }

      const res = await fetch("http://localhost:8000/auth/update", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        return;
      }

      const updatedData = await res.json();
      const nextProfile = {
        ...savedProfile,
        name: updatedData?.name ?? draftProfile.name,
        avatar: updatedData?.avatar ?? draftProfile.avatar,
        bio: "",
      };

      setSavedProfile(nextProfile);
      setDraftProfile(nextProfile);
      onProfileUpdated?.(updatedData);
      setShowSuccessModal(true);
    } catch {
      // Handle error silently
    } finally {
      setIsSaving(false);
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

  const handlePreviewAvatar = () => {
    if (!readOnly || !draftProfile.avatar) {
      return;
    }

    setPreviewImage({
      url: draftProfile.avatar,
      name: `Avatar của ${draftProfile.name || "user"}`,
    });
  };

  return (
    <div className="chat-window">
      <div className="profile-view-wrap">
        <div className="profile-view-card">
          <div className="profile-view-header">Thông tin cá nhân</div>

          {loading && <div className="chat-empty">Đang tải thông tin user...</div>}
          {error && !loading && <div className="chat-empty">{error}</div>}

          {!loading && !error && (
            <>
              <div className="profile-view-main">
                <div className="profile-view-identity">
                  <div className="profile-view-name">{draftProfile.name}</div>
                </div>

                <div className="profile-view-avatar-pane">
                  <div className="conversation-avatar-wrap profile-view-avatar-wrap">
                    <div
                      className={`conversation-avatar-core profile-view-avatar-core ${readOnly && draftProfile.avatar ? "profile-view-avatar-clickable" : ""}`}
                      style={{ borderRadius: avatarRadius }}
                      onClick={handlePreviewAvatar}
                      role={readOnly && draftProfile.avatar ? "button" : undefined}
                      tabIndex={readOnly && draftProfile.avatar ? 0 : undefined}
                      onKeyDown={(event) => {
                        if (!readOnly || !draftProfile.avatar) {
                          return;
                        }

                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          handlePreviewAvatar();
                        }
                      }}
                    >
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

                  {readOnly && typeof onStartMessage === "function" && (
                    <Button
                      type="button"
                      className="profile-view-message-btn"
                      onClick={onStartMessage}
                    >
                      Nhắn tin
                    </Button>
                  )}
                </div>
              </div>

              <div className="profile-view-grid">
                <div className="profile-view-item">
                  <div className="profile-view-label">Tên hiển thị</div>
                  <TextInput
                    type="text"
                    value={draftProfile.name}
                    onChange={handleChange("name")}
                    disabled={readOnly}
                    className="profile-view-input"
                  />
                </div>

                <div className="profile-view-item profile-view-item-full">
                  <div className="profile-view-label">Giới thiệu</div>
                  <textarea
                    className="text-input profile-view-input profile-view-textarea"
                    value=""
                    disabled
                  />
                </div>
              </div>

              {!readOnly && (
                <div className="profile-view-actions">
                  <div className="profile-view-actions-left">
                    <Button
                      type="button"
                      onClick={handleReset}
                      disabled={!isDirty}
                    >
                      Reset
                    </Button>
                  </div>
                  <div>
                    <Button
                      type="button"
                      onClick={handleSave}
                      disabled={!isDirty || isSaving}
                    >
                      {isSaving ? "Đang lưu..." : "Lưu"}
                    </Button>
                  </div>
                </div>
              )}

            </>
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={showSuccessModal}
        title="Thành công"
        description="Hồ sơ của bạn đã được lưu thành công."
        canCloseOnBackdrop
        onBackdropClick={() => setShowSuccessModal(false)}
        buttons={[
          {
            text: "OK",
            onClick: () => setShowSuccessModal(false),
          },
        ]}
      />

      <AvatarCropModal
        key={cropSourceUrl || "empty-crop"}
        sourceUrl={cropSourceUrl}
        roughPath={avatarOutlinePath}
        onCancel={handleCloseCropModal}
        onConfirm={handleApplyCroppedAvatar}
      />

      <ImagePreviewModal
        previewImage={previewImage}
        onClose={() => setPreviewImage(null)}
        modalMaxWidth="min(1120px, 97vw)"
        modalMaxHeight="92vh"
        imageMaxWidth="min(1080px, 95vw)"
        imageMaxHeight="calc(92vh - 16px)"
      />
    </div>
  );
}
