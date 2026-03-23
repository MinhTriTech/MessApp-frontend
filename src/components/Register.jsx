import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";

export default function Register() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const { setUser } = useAuth();

    const handleRegister = async () => {
        if (password !== confirmPassword) {
            alert("Mật khẩu nhập lại không khớp");
            return;
        }

        const res = await fetch("http://localhost:8000/auth/register", {
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
            <h2 className="auth-title">Đăng ký</h2>
            <div className="auth-form">
                <input className="text-input" placeholder="Email" onChange={e => setEmail(e.target.value)} />
                <input className="text-input" placeholder="Mật khẩu" type="password" onChange={e => setPassword(e.target.value)} />
                <input className="text-input" placeholder="Nhập lại mật khẩu" type="password" onChange={e => setConfirmPassword(e.target.value)} />
                <button className="btn" onClick={handleRegister}>Đăng ký</button>
                <p className="auth-switch-text">
                    Đã có tài khoản? <Link to="/login" className="auth-switch-link">Đăng nhập</Link>
                </p>
            </div>
        </div>
    );
}