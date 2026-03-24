export default function ProfilePanel({ user }) {
  const profileName = user?.name || "Bạn";
  const profileEmail = user?.email || "demo@mess.app";
  const profileHandle = `@${profileEmail.split("@")[0] || "user"}`;
  const profileInitials = profileName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("") || "U";

  return (
    <div className="chat-window">
      <div className="profile-view-wrap">
        <div className="profile-view-card">
          <div className="profile-view-header">Thông tin profile (mock)</div>

          <div className="profile-view-main">
            <div className="profile-view-avatar">{profileInitials}</div>
            <div className="profile-view-identity">
              <div className="profile-view-name">{profileName}</div>
              <div className="profile-view-handle">{profileHandle}</div>
            </div>
          </div>

          <div className="profile-view-grid">
            <div className="profile-view-item">
              <div className="profile-view-label">Email</div>
              <div className="profile-view-value">{profileEmail}</div>
            </div>

            <div className="profile-view-item">
              <div className="profile-view-label">Trạng thái</div>
              <div className="profile-view-value">Đang hoạt động</div>
            </div>

            <div className="profile-view-item profile-view-item-full">
              <div className="profile-view-label">Giới thiệu</div>
              <div className="profile-view-value">Xin chào! Đây là dữ liệu mock để preview giao diện profile trong ChatWindow.</div>
            </div>

            <div className="profile-view-item">
              <div className="profile-view-label">Ngày tham gia</div>
              <div className="profile-view-value">24/03/2026</div>
            </div>

            <div className="profile-view-item">
              <div className="profile-view-label">Vị trí</div>
              <div className="profile-view-value">Hà Nội</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
