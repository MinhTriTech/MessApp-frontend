import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const OnboardingModal = () => {
  const { user, setUser } = useAuth();

  const [step, setStep] = useState(
    !user.is_verified ? "verify" : "username"
  );

  const [username, setUsername] = useState("");

  // gửi email
  const handleSendEmail = async () => {
    alert("Đã gửi email!");
  };

  // fake verify (dev mode)
  const handleVerified = async () => {
    // const res = await api.verifyEmail(); 
    // setUser(res);
    // setStep("username");
  };

  // submit username
  const handleUsername = async () => {
    // const res = await api.updateUsername({ username });
    // setUser(res);
    alert("Update tên");
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
              value={username}
              onChange={(e) => setUsername(e.target.value)}
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