import { useState } from "react";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

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

        console.log("Đăng nhập thành công", data);
    };

    return (
        <div>
            <input placeholder="email" onChange={e => setEmail(e.target.value)} />
            <input placeholder="password" type="password" onChange={e => setPassword(e.target.value)} />
            <button onClick={handleLogin}>Đăng nhập</button>
        </div>
    );
}