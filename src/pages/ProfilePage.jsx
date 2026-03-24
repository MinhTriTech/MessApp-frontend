import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ConversationList from "../components/ConversationList";
import ProfilePanel from "../components/chat/ProfilePanel";
import { useChat } from "../context/ChatContext";
import { useAuth } from "../context/AuthContext";

export default function ProfilePage() {
  const { id: profileId } = useParams();
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const { setCurrentConversationId } = useChat();

  const [profileUser, setProfileUser] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");

  const isMyProfile = useMemo(() => {
    if (!profileId) {
      return true;
    }

    if (!user?.id) {
      return false;
    }

    return String(profileId) === String(user.id);
  }, [profileId, user?.id]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setProfileUser(null);
      setProfileError("Bạn chưa đăng nhập.");
      setIsLoadingProfile(false);
      return;
    }

    const controller = new AbortController();

    setIsLoadingProfile(true);
    setProfileError("");

    const profileApiUrl = profileId ? `http://localhost:8000/users/${profileId}` : "http://localhost:8000/auth/getMe";

    fetch(profileApiUrl, {
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error("Không tìm thấy user.");
          }

          throw new Error("Không thể tải thông tin profile.");
        }

        return res.json();
      })
      .then((data) => {
        setProfileUser(data);
      })
      .catch((error) => {
        if (controller.signal.aborted) {
          return;
        }

        setProfileUser(null);
        setProfileError(error.message || "Không thể tải thông tin profile.");
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoadingProfile(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [profileId]);

  const handleSelectConversation = (conversationId) => {
    setCurrentConversationId(conversationId);
    navigate("/chat");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/login", { replace: true });
  };

  const handleProfileUpdated = (updatedData) => {
    if (!updatedData) {
      return;
    }

    setProfileUser((prev) => ({
      ...prev,
      ...updatedData,
    }));

    setUser((prev) => {
      if (!prev) {
        return prev;
      }

      return {
        ...prev,
        ...updatedData,
      };
    });
  };

  return (
    <>
      <div className="chat-layout">
        <div className="conversation-pane">
          <ConversationList onSelect={handleSelectConversation} />
        </div>

        <div className="chat-pane">
          <ProfilePanel
            user={profileUser}
            readOnly={!isMyProfile}
            loading={isLoadingProfile}
            error={profileError}
            onProfileUpdated={isMyProfile ? handleProfileUpdated : undefined}
          />
        </div>
      </div>

      <button className="btn logout-btn" onClick={handleLogout}>Đăng xuất</button>
    </>
  );
}
