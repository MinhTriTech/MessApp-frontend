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
  const {
    conversations,
    setCurrentConversationId,
    setActiveSearchUser,
    setGlobalSearchResults,
    setPendingReceiverId,
  } = useChat();

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
    navigate(`/chat/${conversationId}`);
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

  const handleMessageProfileUser = () => {
    if (isMyProfile || !profileUser) {
      return;
    }

    const targetId = profileUser.id || profileId;

    if (!targetId) {
      return;
    }

    const existingConversation = conversations.find(
      (conversation) => String(conversation.target_id) === String(targetId),
    );

    if (existingConversation?.conversation_id) {
      setActiveSearchUser(null);
      setGlobalSearchResults([]);
      setPendingReceiverId(null);
      navigate(`/chat/${existingConversation.conversation_id}`);
      return;
    }

    setCurrentConversationId(null);
    setGlobalSearchResults([]);
    setPendingReceiverId(targetId);
    setActiveSearchUser({
      id: targetId,
      name: profileUser.name,
      email: profileUser.email,
      avatar: profileUser.avatar_url || profileUser.avatar || profileUser.profile_image || "",
    });
    navigate("/chat");
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
            onStartMessage={!isMyProfile ? handleMessageProfileUser : undefined}
          />
        </div>
      </div>

      <button className="btn logout-btn" onClick={handleLogout}>Đăng xuất</button>
    </>
  );
}
