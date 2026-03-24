import { useEffect } from "react";

export default function ProfileContextMenu({ open, x, y, onClose, onOpenProfile, onStartMessage }) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleClose = () => {
      onClose?.();
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    window.addEventListener("click", handleClose);
    window.addEventListener("scroll", handleClose, true);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("click", handleClose);
      window.removeEventListener("scroll", handleClose, true);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="conversation-context-menu" style={{ top: y, left: x }}>
      <button type="button" className="conversation-context-menu-item" onClick={onOpenProfile}>
        Xem trang cá nhân
      </button>
      {typeof onStartMessage === "function" && (
        <button type="button" className="conversation-context-menu-item" onClick={onStartMessage}>
          Nhắn tin
        </button>
      )}
    </div>
  );
}