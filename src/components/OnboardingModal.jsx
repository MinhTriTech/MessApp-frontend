import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const OnboardingModal = () => {
  const { user, setUser } = useAuth();
  const token = localStorage.getItem("token");

  const [step, setStep] = useState(
    !user.is_verified ? "verify" : "username"
  );

  const [name, setName] = useState("");

  // gửi email
  const handleSendEmail = async () => {
    if (!token) return;

    await fetch("http://localhost:8000/auth/send-verify-email", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    alert("Đã gửi email!");
  };

  // fake verify (dev mode)
  const handleVerified = async () => {
    if (!token) return;

    const res = await fetch("http://localhost:8000/auth/getMe", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      alert("Không thể kiểm tra trạng thái xác nhận email");
      return;
    }

    const updatedUser = await res.json();
    setUser(updatedUser);

    if (updatedUser.is_verified) {
      setStep("username");
    }
  };

  // submit username
  const handleUsername = async () => {
    if (!token) return;

    const res = await fetch("http://localhost:8000/auth/updateName", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name }),
    });

    if (!res.ok) {
      alert("Cập nhật username thất bại");
      return;
    }

    const updatedUser = await res.json();
    setUser(updatedUser);
  };

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-card">
        {step === "verify" && (
          <div className="onboarding-content">
            <h2 className="auth-title">Xác nhận email</h2>
            <p className="onboarding-text">Vui lòng kiểm tra email để xác nhận tài khoản</p>

            <div className="onboarding-actions">
              <button className="btn" onClick={handleSendEmail}>
                Gửi lại email
              </button>

              <button className="btn" onClick={handleVerified}>
                Tôi đã xác nhận
              </button>
            </div>
          </div>
        )}

        {step === "username" && (
          <div className="onboarding-content">
            <h2 className="auth-title">Nhập username</h2>

            <input
              className="text-input"
              placeholder="Username"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <button className="btn" onClick={handleUsername}>
              Hoàn tất
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingModal;