import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const { setUser } = useAuth();

    const handleLogin = async () => {
        const res = await fetch("http://localhost:8000/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        localStorage.setItem("token", data.token);
        setUser(data.user);

        navigate("/");
    };

    return (
        <div className="auth-card">
            <h2 className="auth-title">Đăng nhập</h2>
            <div className="auth-form">
                <input className="text-input" placeholder="Email" onChange={e => setEmail(e.target.value)} />
                <input className="text-input" placeholder="Mật khẩu" type="password" onChange={e => setPassword(e.target.value)} />
                <button className="btn" onClick={handleLogin}>Đăng nhập</button>
                <p className="auth-switch-text">
                    Chưa có tài khoản? <Link to="/register" className="auth-switch-link">Đăng ký</Link>
                </p>
            </div>
        </div>
    );
}