import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';

export default function VerifySuccessPage() {
  const { user, setUser } = useAuth();
  const token = localStorage.getItem("token");

    useEffect(() => {
    const fetchUser = async () => {
        const res = await fetch("http://localhost:8000/auth/getMe", {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            },
        });
        setUser(res);
    };

    fetchUser();
    }, []);

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h2 className="auth-title">Xác thực thành công</h2>
        <p className="auth-switch-text">Tài khoản của bạn đã được xác thực thành công.</p>
        <div className="auth-form">
          <Link className="btn" to={user ? '/chat' : '/login'}>
            {user ? 'Vào chat' : 'Đăng nhập ngay'}
          </Link>
        </div>
      </div>
    </div>
  );
}
